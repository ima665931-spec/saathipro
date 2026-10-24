import { prisma } from "@/lib/prisma";
import {
  AGENT_KYC_BONUS,
  MILESTONE_BONUS,
  MILESTONE_REFS,
  USER_REFERRAL_CREDIT,
  commissionAmount,
  subAgentShare,
  DEFAULT_COMMISSION_PCT,
} from "@/lib/referral";

/** ₹49 to parent when child agent KYC approved */
export async function grantAgentKycBonus(newAgentId: string) {
  const child = await prisma.user.findUnique({ where: { id: newAgentId } });
  if (!child?.referredById) return null;

  const parent = await prisma.user.findUnique({ where: { id: child.referredById } });
  if (!parent || parent.role !== "AGENT" || parent.isBanned) return null;

  const exists = await prisma.commission.findFirst({
    where: {
      agentId: parent.id,
      userId: child.id,
      note: "AGENT_KYC_BONUS",
    },
  });
  if (exists) return exists;

  return prisma.commission.create({
    data: {
      agentId: parent.id,
      userId: child.id,
      amount: AGENT_KYC_BONUS,
      percent: 0,
      planPrice: AGENT_KYC_BONUS,
      plan: null,
      status: "PENDING",
      note: "AGENT_KYC_BONUS",
    },
  });
}

/**
 * Normal user referral: +₹49 bill credit when friend plan is verified.
 * Agents get commission instead (not this credit).
 */
export async function grantUserReferralCredit(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.referredById) return null;

  const referrer = await prisma.user.findUnique({ where: { id: user.referredById } });
  if (!referrer || referrer.isBanned) return null;
  // Agents earn commission path — not bill credit
  if (referrer.role === "AGENT" || referrer.role === "ADMIN") return null;

  // One credit per referred user (idempotent via note on a dummy commission-style check)
  // Use paymentStatus of child already VERIFIED — caller ensures once
  // Store marker in referred user's referredAs-style: we track via a commission with note USER_CREDIT
  // Simpler: only grant if we haven't already bumped for this child — use Commission with agentId=referrer as ledger
  const already = await prisma.commission.findFirst({
    where: {
      agentId: referrer.id,
      userId: user.id,
      note: "USER_REFERRAL_CREDIT",
    },
  });
  if (already) return already;

  await prisma.user.update({
    where: { id: referrer.id },
    data: { creditBalance: { increment: USER_REFERRAL_CREDIT } },
  });

  // Ledger row (reuses Commission model; not cashout-able for non-agents ideally)
  return prisma.commission.create({
    data: {
      agentId: referrer.id,
      userId: user.id,
      amount: USER_REFERRAL_CREDIT,
      percent: 0,
      planPrice: USER_REFERRAL_CREDIT,
      status: "PAID",
      note: "USER_REFERRAL_CREDIT",
      paidAt: new Date(),
    },
  });
}

/** 50% membership + optional 10% to grandparent + milestone + user credit */
export async function grantMembershipCommissions(opts: {
  userId: string;
  paymentId: string;
  amount: number;
  planId: string;
}) {
  const user = await prisma.user.findUnique({ where: { id: opts.userId } });
  if (!user?.referredById) return;

  // User-to-user credit (non-agent referrer)
  try {
    await grantUserReferralCredit(opts.userId);
  } catch (e) {
    console.error("user credit", e);
  }

  const agent = await prisma.user.findUnique({ where: { id: user.referredById } });
  if (!agent || agent.role !== "AGENT" || agent.isBanned) return;

  const pct = agent.commissionPct || DEFAULT_COMMISSION_PCT;
  const amt = commissionAmount(opts.amount, pct);

  const existing = await prisma.commission.findFirst({
    where: { paymentId: opts.paymentId, agentId: agent.id, note: "MEMBERSHIP" },
  });

  if (!existing && amt > 0) {
    await prisma.commission.create({
      data: {
        agentId: agent.id,
        userId: user.id,
        paymentId: opts.paymentId,
        amount: amt,
        percent: pct,
        planPrice: opts.amount,
        plan: opts.planId,
        status: "PENDING",
        note: "MEMBERSHIP",
      },
    });

    if (agent.referredById) {
      const parent = await prisma.user.findUnique({ where: { id: agent.referredById } });
      if (parent && parent.role === "AGENT" && !parent.isBanned) {
        const share = subAgentShare(amt);
        if (share > 0) {
          await prisma.commission.create({
            data: {
              agentId: parent.id,
              userId: agent.id,
              paymentId: opts.paymentId,
              amount: share,
              percent: 10,
              planPrice: amt,
              plan: opts.planId,
              status: "PENDING",
              note: "SUB_AGENT_10PCT",
            },
          });
        }
      }
    }
  }

  const paidCount = await prisma.user.count({
    where: {
      referredById: agent.id,
      paymentStatus: "VERIFIED",
    },
  });

  if (paidCount === MILESTONE_REFS) {
    const milestoneExists = await prisma.commission.findFirst({
      where: {
        agentId: agent.id,
        note: `MILESTONE_${MILESTONE_REFS}`,
      },
    });
    if (!milestoneExists) {
      await prisma.commission.create({
        data: {
          agentId: agent.id,
          userId: user.id,
          amount: MILESTONE_BONUS,
          percent: 0,
          planPrice: MILESTONE_BONUS,
          status: "PENDING",
          note: `MILESTONE_${MILESTONE_REFS}`,
        },
      });
    }
  }
}

/** Deduct locked credit after membership approved */
export async function applyPaymentCredit(paymentId: string) {
  const pay = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!pay || !pay.creditUsed || pay.creditUsed <= 0) return;

  const user = await prisma.user.findUnique({ where: { id: pay.userId } });
  if (!user) return;

  const deduct = Math.min(pay.creditUsed, user.creditBalance || 0);
  if (deduct <= 0) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { creditBalance: { decrement: deduct } },
  });
}

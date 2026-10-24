import { prisma } from "@/lib/prisma";
import {
  AGENT_KYC_BONUS,
  MILESTONE_BONUS,
  MILESTONE_REFS,
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

/** 50% membership + optional 10% to grandparent + milestone */
export async function grantMembershipCommissions(opts: {
  userId: string;
  paymentId: string;
  amount: number;
  planId: string;
}) {
  const user = await prisma.user.findUnique({ where: { id: opts.userId } });
  if (!user?.referredById) return;

  const agent = await prisma.user.findUnique({ where: { id: user.referredById } });
  if (!agent || agent.role !== "AGENT" || agent.isBanned) return;

  const pct = agent.commissionPct || DEFAULT_COMMISSION_PCT;
  const amt = commissionAmount(opts.amount, pct);

  const existing = await prisma.commission.findFirst({
    where: { paymentId: opts.paymentId, agentId: agent.id },
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

    // 10% of this commission to agent's parent (sub-agent share)
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

  // Milestone: N verified plan members under agent
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

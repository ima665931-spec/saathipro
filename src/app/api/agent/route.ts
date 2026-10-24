import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_COMMISSION_PCT,
  MIN_CASHOUT,
  isValidAadhaar,
  isValidPhone,
  isValidUpi,
} from "@/lib/referral";
import { AGENT_ENTRY_FEE, AGENT_ENTRY_TYPE, telegramKycUrl } from "@/lib/agent-fee";
import { generateAgentId } from "@/lib/ids";

const MAX_PHOTO = 400_000;

function kycComplete(u: {
  phone?: string | null;
  aadhaar?: string | null;
  aadhaarPhoto?: string | null;
}) {
  return !!(u.phone && u.aadhaar && u.aadhaarPhoto);
}

async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return prisma.user.findFirst({
    where: { email: { equals: session.user.email, mode: "insensitive" } },
  });
}

function validateKycBody(body: {
  phone?: string;
  aadhaar?: string;
  aadhaarPhoto?: string;
  agentUpi?: string;
}) {
  const phone = String(body.phone || "").replace(/\D/g, "").slice(-10);
  const aadhaar = String(body.aadhaar || "").replace(/\s/g, "");
  const photo = body.aadhaarPhoto ? String(body.aadhaarPhoto) : "";
  const agentUpi = body.agentUpi ? String(body.agentUpi).trim().toLowerCase() : null;

  if (!isValidPhone(phone) || phone.length !== 10) {
    return { error: "Valid 10-digit mobile required" };
  }
  if (!isValidAadhaar(aadhaar)) return { error: "Valid 12-digit Aadhaar number required" };
  if (!photo.startsWith("data:image/")) return { error: "Aadhaar card photo required" };
  if (photo.length > MAX_PHOTO) return { error: "Photo too large — compress and retry" };
  if (agentUpi && !isValidUpi(agentUpi)) return { error: "Invalid UPI ID" };

  return { phone, aadhaar, photo, agentUpi };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.isBanned) {
    return NextResponse.json({ error: "Banned" }, { status: 403 });
  }

  const origin =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    "https://saathipro.vercel.app";

  const feePaid = await prisma.payment.findFirst({
    where: { userId: user.id, type: AGENT_ENTRY_TYPE, status: "APPROVED" },
  });
  const feePending = await prisma.payment.findFirst({
    where: { userId: user.id, type: AGENT_ENTRY_TYPE, status: "PENDING" },
  });

  const hasKyc = kycComplete(user);
  const isAgent = user.role === "AGENT" || user.role === "ADMIN";

  // Full agent hub
  if (isAgent && hasKyc && user.agentStatus === "APPROVED") {
    try {
      const [referrals, commissions, withdrawals] = await Promise.all([
        prisma.user.findMany({
          where: { referredById: user.id },
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true, name: true, email: true, paymentStatus: true,
            plan: true, planExpiresAt: true, createdAt: true,
          },
        }),
        prisma.commission.findMany({
          where: { agentId: user.id },
          orderBy: { createdAt: "desc" },
          take: 100,
          include: { user: { select: { name: true, email: true } } },
        }),
        prisma.withdrawal.findMany({
          where: { agentId: user.id },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ]);

      const pending = commissions.filter((c) => c.status === "PENDING").reduce((s, c) => s + c.amount, 0);
      const locked = commissions.filter((c) => c.status === "LOCKED").reduce((s, c) => s + c.amount, 0);
      const paid = commissions.filter((c) => c.status === "PAID").reduce((s, c) => s + c.amount, 0);

      return NextResponse.json({
        step: "hub",
        isAgent: true,
        needsKyc: false,
        kycComplete: true,
        feeStatus: "PAID",
        agent: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          referralCode: user.referralCode,
          commissionPct: user.commissionPct ?? DEFAULT_COMMISSION_PCT,
          agentUpi: user.agentUpi,
          aadhaarMasked: user.aadhaar ? `XXXX-XXXX-${user.aadhaar.slice(-4)}` : null,
          shareLink: user.referralCode
            ? `${origin.replace(/\/$/, "")}/register?ref=${user.referralCode}`
            : null,
        },
        stats: {
          referrals: referrals.length,
          paidMembers: referrals.filter((r) => r.paymentStatus === "VERIFIED").length,
          pendingCommission: pending,
          lockedCommission: locked,
          paidCommission: paid,
          minCashout: MIN_CASHOUT,
        },
        referrals,
        commissions,
        withdrawals,
      });
    } catch (err) {
      console.error("agent GET:", err);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }

  // Step machine for non-full agents
  let step: string = "pay_fee";
  if (feePending && !feePaid) step = "fee_pending";
  else if (feePaid || isAgent) {
    if (user.agentStatus === "PENDING" && hasKyc) step = "kyc_pending";
    else if (user.agentStatus === "REJECTED") step = "kyc_rejected";
    else if (!hasKyc) step = "kyc";
    else step = "kyc_pending";
  }

  const agentId = user.referralCode;
  const tg =
    agentId && hasKyc
      ? telegramKycUrl({
          agentId,
          name: user.name,
          phone: user.phone,
          email: user.email,
        })
      : null;

  return NextResponse.json({
    step,
    isAgent,
    needsKyc: !hasKyc,
    kycComplete: hasKyc,
    feeStatus: feePaid ? "PAID" : feePending ? "PENDING" : "NONE",
    feeAmount: AGENT_ENTRY_FEE,
    agentStatus: user.agentStatus || "NONE",
    agentNote: user.agentNote,
    agentId,
    telegramKycUrl: tg,
    profile: {
      phone: user.phone,
      aadhaarMasked: user.aadhaar ? `XXXX-XXXX-${user.aadhaar.slice(-4)}` : null,
      hasPhoto: !!user.aadhaarPhoto,
      agentUpi: user.agentUpi,
    },
  });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.isBanned) {
    return NextResponse.json({ error: "Banned" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "apply_agent" || action === "complete_kyc") {
      // Must have paid agent fee (unless already AGENT from old flow)
      const feePaid = await prisma.payment.findFirst({
        where: { userId: user.id, type: AGENT_ENTRY_TYPE, status: "APPROVED" },
      });
      if (!feePaid && user.role !== "AGENT" && user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Pay ₹199 agent entry fee first" },
          { status: 400 }
        );
      }

      if (user.agentStatus === "PENDING" && action === "apply_agent" && kycComplete(user)) {
        return NextResponse.json({ error: "KYC already pending" }, { status: 400 });
      }

      const v = validateKycBody(body);
      if ("error" in v && v.error) {
        return NextResponse.json({ error: v.error }, { status: 400 });
      }
      const { phone, aadhaar, photo, agentUpi } = v as {
        phone: string;
        aadhaar: string;
        photo: string;
        agentUpi: string | null;
      };

      let code = user.referralCode;
      if (!code) {
        code = generateAgentId(user.name);
        for (let i = 0; i < 5; i++) {
          const clash = await prisma.user.findFirst({
            where: { referralCode: code, NOT: { id: user.id } },
          });
          if (!clash) break;
          code = generateAgentId(user.name);
        }
      }

      // Already approved agent completing docs
      if (user.role === "AGENT" || user.role === "ADMIN") {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            phone,
            aadhaar,
            aadhaarPhoto: photo,
            agentUpi: agentUpi || user.agentUpi,
            referralCode: code,
            agentStatus: "APPROVED",
            commissionPct:
              !user.commissionPct || user.commissionPct < DEFAULT_COMMISSION_PCT
                ? DEFAULT_COMMISSION_PCT
                : user.commissionPct,
          },
        });
        return NextResponse.json({ success: true, kycComplete: true, agentId: code });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          phone,
          aadhaar,
          aadhaarPhoto: photo,
          agentUpi: agentUpi || user.agentUpi,
          referralCode: code,
          agentStatus: "PENDING",
          agentNote: null,
        },
      });

      return NextResponse.json({
        success: true,
        agentStatus: "PENDING",
        agentId: code,
        telegramKycUrl: telegramKycUrl({
          agentId: code,
          name: user.name,
          phone,
          email: user.email,
        }),
      });
    }

    if (user.role !== "AGENT" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Agents only" }, { status: 403 });
    }

    if (!kycComplete(user) && action !== "complete_kyc") {
      return NextResponse.json({ error: "Complete KYC first" }, { status: 400 });
    }

    if (action === "set_upi") {
      const agentUpi = String(body.agentUpi || "").trim().toLowerCase();
      if (!isValidUpi(agentUpi)) {
        return NextResponse.json({ error: "Valid UPI required" }, { status: 400 });
      }
      await prisma.user.update({ where: { id: user.id }, data: { agentUpi } });
      return NextResponse.json({ success: true, agentUpi });
    }

    if (action === "clear_upi") {
      await prisma.user.update({ where: { id: user.id }, data: { agentUpi: null } });
      return NextResponse.json({ success: true });
    }

    if (action === "request_cashout") {
      if (!user.agentUpi || !isValidUpi(user.agentUpi)) {
        return NextResponse.json({ error: "Add UPI first" }, { status: 400 });
      }

      const open = await prisma.withdrawal.findFirst({
        where: { agentId: user.id, status: "PENDING" },
      });
      if (open) {
        return NextResponse.json({ error: "Cashout already pending" }, { status: 400 });
      }

      const pending = await prisma.commission.findMany({
        where: { agentId: user.id, status: "PENDING" },
      });
      const total = pending.reduce((s, c) => s + c.amount, 0);
      if (total < MIN_CASHOUT) {
        return NextResponse.json(
          { error: `Minimum cashout ₹${MIN_CASHOUT}. You have ₹${total}` },
          { status: 400 }
        );
      }

      const w = await prisma.withdrawal.create({
        data: {
          agentId: user.id,
          amount: total,
          upiId: user.agentUpi,
          phone: user.phone,
          aadhaar: user.aadhaar,
          status: "PENDING",
        },
      });

      await prisma.commission.updateMany({
        where: { agentId: user.id, status: "PENDING" },
        data: { status: "LOCKED", withdrawalId: w.id },
      });

      return NextResponse.json({ success: true, withdrawalId: w.id, amount: total });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("agent PATCH:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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

async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return prisma.user.findFirst({
    where: { email: { equals: session.user.email, mode: "insensitive" } },
  });
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

  // Not agent yet — show apply status
  if (user.role !== "AGENT" && user.role !== "ADMIN") {
    return NextResponse.json({
      isAgent: false,
      agentStatus: user.agentStatus || "NONE",
      agentNote: user.agentNote,
      profile: {
        phone: user.phone,
        aadhaar: user.aadhaar ? `XXXX-XXXX-${user.aadhaar.slice(-4)}` : null,
        agentUpi: user.agentUpi,
      },
    });
  }

  try {
    const [referrals, commissions, withdrawals] = await Promise.all([
      prisma.user.findMany({
        where: { referredById: user.id },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          name: true,
          email: true,
          paymentStatus: true,
          plan: true,
          planExpiresAt: true,
          createdAt: true,
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

    const pending = commissions
      .filter((c) => c.status === "PENDING")
      .reduce((s, c) => s + c.amount, 0);
    const locked = commissions
      .filter((c) => c.status === "LOCKED")
      .reduce((s, c) => s + c.amount, 0);
    const paid = commissions
      .filter((c) => c.status === "PAID")
      .reduce((s, c) => s + c.amount, 0);

    return NextResponse.json({
      isAgent: true,
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

    // ——— Apply to become agent (KYC) ———
    if (action === "apply_agent") {
      if (user.role === "AGENT") {
        return NextResponse.json({ error: "Already an agent" }, { status: 400 });
      }
      if (user.agentStatus === "PENDING") {
        return NextResponse.json({ error: "Application already pending" }, { status: 400 });
      }

      const phone = String(body.phone || "").replace(/\D/g, "").slice(-10);
      const aadhaar = String(body.aadhaar || "").replace(/\s/g, "");
      const agentUpi = body.agentUpi ? String(body.agentUpi).trim().toLowerCase() : null;

      if (!isValidPhone(phone)) {
        return NextResponse.json({ error: "Valid 10-digit mobile required" }, { status: 400 });
      }
      if (!isValidAadhaar(aadhaar)) {
        return NextResponse.json({ error: "Valid 12-digit Aadhaar required" }, { status: 400 });
      }
      if (agentUpi && !isValidUpi(agentUpi)) {
        return NextResponse.json({ error: "Invalid UPI ID" }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          phone,
          aadhaar,
          agentUpi: agentUpi || user.agentUpi,
          agentStatus: "PENDING",
          agentNote: null,
        },
      });

      return NextResponse.json({ success: true, agentStatus: "PENDING" });
    }

    // ——— Agent-only actions ———
    if (user.role !== "AGENT" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Agents only" }, { status: 403 });
    }

    if (action === "set_upi") {
      const agentUpi = String(body.agentUpi || "").trim().toLowerCase();
      if (!isValidUpi(agentUpi)) {
        return NextResponse.json({ error: "Valid UPI required (name@ybl)" }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { agentUpi },
      });
      return NextResponse.json({ success: true, agentUpi });
    }

    if (action === "clear_upi") {
      await prisma.user.update({
        where: { id: user.id },
        data: { agentUpi: null },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "request_cashout") {
      if (!user.agentUpi || !isValidUpi(user.agentUpi)) {
        return NextResponse.json(
          { error: "Add your UPI first before cashout" },
          { status: 400 }
        );
      }

      const open = await prisma.withdrawal.findFirst({
        where: { agentId: user.id, status: "PENDING" },
      });
      if (open) {
        return NextResponse.json(
          { error: "You already have a pending cashout request" },
          { status: 400 }
        );
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

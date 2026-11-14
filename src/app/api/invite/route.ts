import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  USER_REFERRAL_CREDIT,
  MIN_CASHOUT,
  generateReferralCode,
  buildInviteLinks,
  isValidUpi,
  normalizeRefCode,
} from "@/lib/referral";
import { isAgentRole } from "@/lib/account-type";

async function ensureCode(userId: string, name?: string | null) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (u?.referralCode) return u.referralCode;
  for (let i = 0; i < 6; i++) {
    const code = generateReferralCode(name);
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
      });
      return code;
    } catch {
      /* unique clash */
    }
  }
  const fallback = normalizeRefCode(`SP${Date.now().toString(36)}`);
  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: fallback },
  });
  return fallback;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: session.user.email, mode: "insensitive" } },
  });
  if (!user || user.isBanned) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAgentRole(user.role)) {
    return NextResponse.json({ error: "Agents use /agent hub" }, { status: 403 });
  }

  const code = await ensureCode(user.id, user.name);
  const origin = new URL(req.url).origin.replace("localhost", "saathipro.site");
  // Prefer public site for share links
  const shareOrigin =
    process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://saathipro.site";
  const links = buildInviteLinks(shareOrigin, code);

  const referrals = await prisma.user.findMany({
    where: { referredById: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      paymentStatus: true,
      planId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const successful = referrals.filter((r) => r.paymentStatus === "VERIFIED").length;
  const pendingCashouts = await prisma.withdrawal.findMany({
    where: { agentId: user.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    code,
    creditBalance: user.creditBalance || 0,
    rewardPerFriend: USER_REFERRAL_CREDIT,
    minCashout: MIN_CASHOUT,
    links,
    stats: {
      invited: referrals.length,
      successful,
    },
    referrals: referrals.map((r) => ({
      id: r.id,
      name: r.name || r.email?.split("@")[0] || "Friend",
      status: r.paymentStatus === "VERIFIED" ? "Earned" : r.paymentStatus === "PENDING" ? "Pending plan" : "Joined",
      at: r.createdAt,
    })),
    pendingCashouts: pendingCashouts.map((w) => ({
      id: w.id,
      amount: w.amount,
      upiId: w.upiId,
      status: w.status,
      createdAt: w.createdAt,
    })),
  });
}

/** Request UPI payout of referral credit */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: session.user.email, mode: "insensitive" } },
  });
  if (!user || user.isBanned) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAgentRole(user.role)) {
    return NextResponse.json({ error: "Use agent cashout" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const upiId = typeof body.upiId === "string" ? body.upiId.trim() : "";
  const amount = Math.floor(Number(body.amount) || 0);

  if (!isValidUpi(upiId)) {
    return NextResponse.json({ error: "Valid UPI ID required (name@bank)" }, { status: 400 });
  }
  if (amount < MIN_CASHOUT) {
    return NextResponse.json(
      { error: `Minimum cashout is ₹${MIN_CASHOUT}` },
      { status: 400 }
    );
  }
  if (amount > (user.creditBalance || 0)) {
    return NextResponse.json({ error: "Not enough credit balance" }, { status: 400 });
  }

  const open = await prisma.withdrawal.findFirst({
    where: { agentId: user.id, status: "PENDING" },
  });
  if (open) {
    return NextResponse.json(
      { error: "You already have a pending cashout. Wait for admin." },
      { status: 400 }
    );
  }

  // Lock credit
  await prisma.user.update({
    where: { id: user.id },
    data: { creditBalance: { decrement: amount } },
  });

  const w = await prisma.withdrawal.create({
    data: {
      agentId: user.id,
      amount,
      upiId,
      status: "PENDING",
      note: "MEMBER_CREDIT_CASHOUT",
    },
  });

  return NextResponse.json({ ok: true, withdrawalId: w.id, amount, upiId });
}

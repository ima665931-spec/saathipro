import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { generateReferralCode, DEFAULT_COMMISSION_PCT } from "@/lib/referral";
import { grantAgentKycBonus } from "@/lib/rewards";

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const { userId, commissionPct } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const u = await prisma.user.findUnique({ where: { id: userId } });
    if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!u.phone || !u.aadhaar) {
      return NextResponse.json({ error: "KYC incomplete" }, { status: 400 });
    }

    let code = u.referralCode || generateReferralCode(u.name);
    for (let i = 0; i < 5; i++) {
      const clash = await prisma.user.findFirst({
        where: { referralCode: code, NOT: { id: userId } },
      });
      if (!clash) break;
      code = generateReferralCode(u.name);
    }

    const pct = Number(commissionPct) > 0 ? Number(commissionPct) : DEFAULT_COMMISSION_PCT;

    await prisma.user.update({
      where: { id: userId },
      data: {
        role: "AGENT",
        agentStatus: "APPROVED",
        referralCode: code,
        commissionPct: pct,
        agentNote: null,
      },
    });

    let bonus = null;
    try {
      bonus = await grantAgentKycBonus(userId);
    } catch (e) {
      console.error("kyc bonus", e);
    }

    return NextResponse.json({
      success: true,
      referralCode: code,
      parentBonus: bonus ? AGENT_KYC_BONUS_SAFE : null,
    });
  } catch (err) {
    console.error("approve-kyc:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const AGENT_KYC_BONUS_SAFE = 49;

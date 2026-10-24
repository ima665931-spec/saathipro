import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { AGENT_ENTRY_TYPE } from "@/lib/agent-fee";
import { DEFAULT_COMMISSION_PCT } from "@/lib/referral";

/** Approve ₹199 agent entry fee (last step). Unlocks hub if KYC already approved. */
export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const { paymentId } = await req.json();
    if (!paymentId) {
      return NextResponse.json({ error: "paymentId required" }, { status: 400 });
    }

    const pay = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!pay) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (pay.type !== AGENT_ENTRY_TYPE) {
      return NextResponse.json({ error: "Not an agent entry payment" }, { status: 400 });
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "APPROVED" },
    });

    const user = await prisma.user.findUnique({ where: { id: pay.userId } });
    if (user && user.agentStatus === "APPROVED") {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: "AGENT",
          commissionPct: user.commissionPct || DEFAULT_COMMISSION_PCT,
        },
      });
    }

    return NextResponse.json({
      success: true,
      agentId: user?.referralCode || null,
      userId: pay.userId,
    });
  } catch (err) {
    console.error("approve-agent-fee:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

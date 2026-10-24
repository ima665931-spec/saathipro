import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { computeExpiry, isValidPlanId, type PlanId } from "@/lib/plans";
import { grantMembershipCommissions } from "@/lib/rewards";

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
    if (pay.type === "AGENT_ENTRY") {
      return NextResponse.json({ error: "Use agent fee approve" }, { status: 400 });
    }

    const planId: PlanId = isValidPlanId(pay.plan) ? pay.plan : "MONTHLY";
    const user = await prisma.user.findUnique({ where: { id: pay.userId } });
    const expires = computeExpiry(planId, user?.planExpiresAt);

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "APPROVED" },
    });
    await prisma.user.update({
      where: { id: pay.userId },
      data: {
        paymentStatus: "VERIFIED",
        plan: planId,
        planExpiresAt: expires,
      },
    });
    await prisma.saathiProfile.updateMany({
      where: { userId: pay.userId },
      data: { isActive: true },
    });

    try {
      await grantMembershipCommissions({
        userId: pay.userId,
        paymentId: pay.id,
        amount: pay.amount,
        planId,
      });
    } catch (e) {
      console.error("commissions", e);
    }

    return NextResponse.json({ success: true, plan: planId, planExpiresAt: expires });
  } catch (err) {
    console.error("approve-membership:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

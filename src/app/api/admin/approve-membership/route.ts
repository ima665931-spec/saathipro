import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { activateMembershipPayment } from "@/lib/activate-membership";

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

    const result = await activateMembershipPayment(paymentId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Failed" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      already: result.already || false,
      plan: result.plan,
      planExpiresAt: result.planExpiresAt,
    });
  } catch (err) {
    console.error("approve-membership:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

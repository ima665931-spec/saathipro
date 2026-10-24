import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlan, isValidPlanId, hasActivePlan, type PlanId } from "@/lib/plans";
import {
  getRazorpay,
  getRazorpayKeyId,
  isRazorpayConfigured,
  rupeesToPaise,
} from "@/lib/razorpay";
import { generateRegistrationId } from "@/lib/ids";

async function ensurePublicId(userId: string, current?: string | null) {
  if (current) return current;
  for (let i = 0; i < 8; i++) {
    const id = generateRegistrationId();
    try {
      await prisma.user.update({ where: { id: userId }, data: { publicId: id } });
      return id;
    } catch {
      /* clash */
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { error: "Razorpay is not configured" },
        { status: 503 }
      );
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: session.user.email, mode: "insensitive" } },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.isBanned) {
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    }
    if (hasActivePlan(user)) {
      return NextResponse.json({ error: "Plan already active" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const planId: PlanId = isValidPlanId(body.plan) ? body.plan : "MONTHLY";
    const plan = getPlan(planId);
    const useCredit = body.useCredit !== false;

    const creditBalance = user.creditBalance || 0;
    const creditUsed =
      useCredit && creditBalance > 0 ? Math.min(creditBalance, plan.price) : 0;
    const amountDue = Math.max(0, plan.price - creditUsed);

    if (amountDue <= 0) {
      return NextResponse.json(
        { error: "Amount is zero — use credit-only submit on pay page" },
        { status: 400 }
      );
    }

    const publicId = await ensurePublicId(user.id, user.publicId);
    const rzp = getRazorpay();
    if (!rzp) {
      return NextResponse.json({ error: "Razorpay unavailable" }, { status: 503 });
    }

    const amountPaise = rupeesToPaise(amountDue);

    // Persist payment row first so receipt maps to our id
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: amountDue,
        type: "MEMBERSHIP",
        plan: planId,
        status: "ASSIGNED",
        method: "RAZORPAY",
        creditUsed,
        note: creditUsed ? `CREDIT:${creditUsed}` : null,
      },
    });

    const order = await rzp.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: payment.id.slice(0, 40),
      notes: {
        paymentId: payment.id,
        userId: user.id,
        plan: planId,
        publicId: publicId || "",
      },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { razorpayOrderId: order.id },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: amountPaise,
      currency: "INR",
      keyId: getRazorpayKeyId(),
      paymentId: payment.id,
      plan: planId,
      amountRupees: amountDue,
      creditUsed,
      publicId,
      prefill: {
        name: user.name || "",
        email: user.email,
        contact: user.phone || "",
      },
    });
  } catch (err) {
    console.error("razorpay order:", err);
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }
}

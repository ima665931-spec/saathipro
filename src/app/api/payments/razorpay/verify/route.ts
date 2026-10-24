import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { verifyPaymentSignature, isRazorpayConfigured } from "@/lib/razorpay";
import { activateMembershipPayment } from "@/lib/activate-membership";

export async function POST(req: Request) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json({ error: "Razorpay not configured" }, { status: 503 });
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

    const body = await req.json();
    const orderId = String(body.razorpay_order_id || "");
    const paymentId = String(body.razorpay_payment_id || "");
    const signature = String(body.razorpay_signature || "");
    const ourPaymentId = body.paymentId ? String(body.paymentId) : null;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
    }

    if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Idempotent: already processed this Razorpay payment
    const byRzpPay = await prisma.payment.findFirst({
      where: { razorpayPaymentId: paymentId },
    });
    if (byRzpPay?.status === "APPROVED") {
      return NextResponse.json({
        success: true,
        already: true,
        paymentId: byRzpPay.id,
      });
    }

    const pay =
      byRzpPay ||
      (await prisma.payment.findFirst({
        where: {
          razorpayOrderId: orderId,
          userId: user.id,
        },
      })) ||
      (ourPaymentId
        ? await prisma.payment.findFirst({
            where: { id: ourPaymentId, userId: user.id },
          })
        : null);

    if (!pay) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (pay.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.payment.update({
      where: { id: pay.id },
      data: {
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        method: "RAZORPAY",
        status: pay.status === "APPROVED" ? "APPROVED" : "PENDING",
        note: pay.note || `RZP:${paymentId}`,
      },
    });

    const result = await activateMembershipPayment(pay.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Activation failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      already: result.already || false,
      plan: result.plan,
      planExpiresAt: result.planExpiresAt,
      paymentId: pay.id,
    });
  } catch (err) {
    console.error("razorpay verify:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { activateMembershipPayment } from "@/lib/activate-membership";

type RzpEntity = {
  id?: string;
  order_id?: string;
  status?: string;
  notes?: Record<string, string>;
};

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      // Webhook optional — client verify is primary
      return NextResponse.json({ ok: true, skipped: true });
    }

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: { entity?: RzpEntity };
        order?: { entity?: RzpEntity };
      };
    };

    const name = event.event || "";
    if (
      name !== "payment.captured" &&
      name !== "order.paid" &&
      name !== "payment.authorized"
    ) {
      return NextResponse.json({ ok: true, ignored: name });
    }

    const payEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;

    const rzpPaymentId = payEntity?.id || undefined;
    const orderId =
      payEntity?.order_id || orderEntity?.id || undefined;
    const notePaymentId =
      payEntity?.notes?.paymentId || orderEntity?.notes?.paymentId || undefined;

    if (!rzpPaymentId && !orderId && !notePaymentId) {
      return NextResponse.json({ ok: true });
    }

    let pay = null;
    if (rzpPaymentId) {
      pay = await prisma.payment.findFirst({
        where: { razorpayPaymentId: rzpPaymentId },
      });
    }
    if (!pay && orderId) {
      pay = await prisma.payment.findFirst({
        where: { razorpayOrderId: orderId },
      });
    }
    if (!pay && notePaymentId) {
      pay = await prisma.payment.findUnique({ where: { id: notePaymentId } });
    }

    if (!pay) {
      return NextResponse.json({ ok: true, unmatched: true });
    }

    await prisma.payment.update({
      where: { id: pay.id },
      data: {
        razorpayPaymentId: rzpPaymentId || pay.razorpayPaymentId,
        razorpayOrderId: orderId || pay.razorpayOrderId,
        method: "RAZORPAY",
      },
    });

    await activateMembershipPayment(pay.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("razorpay webhook:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

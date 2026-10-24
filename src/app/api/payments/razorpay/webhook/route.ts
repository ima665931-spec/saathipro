import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { activateMembershipPayment } from "@/lib/activate-membership";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      // Webhook optional — verify endpoint is primary
      return NextResponse.json({ ok: true, skipped: true });
    }

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            status?: string;
            notes?: Record<string, string>;
          };
        };
      };
    };

    if (event.event !== "payment.captured" && event.event !== "order.paid") {
      return NextResponse.json({ ok: true, ignored: event.event });
    }

    const entity = event.payload?.payment?.entity;
    const rzpPaymentId = entity?.id;
    const orderId = entity?.order_id;
    const notePaymentId = entity?.notes?.paymentId;

    if (!rzpPaymentId && !orderId && !notePaymentId) {
      return NextResponse.json({ ok: true });
    }

    let pay = null;
    if (rzpPaymentId) {
      pay = await prisma.payment.findFirst({ where: { razorpayPaymentId: rzpPaymentId } });
    }
    if (!pay && orderId) {
      pay = await prisma.payment.findFirst({ where: { razorpayOrderId: orderId } });
    }
    if (!pay && notePaymentId) {
      pay = await prisma.payment.findUnique({ where: { id: notePaymentId } });
    }

    if (!pay) {
      return NextResponse.json({ ok: true, unmatched: true });
    }

    if (rzpPaymentId && !pay.razorpayPaymentId) {
      await prisma.payment.update({
        where: { id: pay.id },
        data: {
          razorpayPaymentId: rzpPaymentId,
          razorpayOrderId: orderId || pay.razorpayOrderId,
          method: "RAZORPAY",
        },
      });
    }

    await activateMembershipPayment(pay.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("razorpay webhook:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

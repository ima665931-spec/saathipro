import crypto from "crypto";
import Razorpay from "razorpay";

export function isRazorpayConfigured(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function getRazorpayKeyId(): string | null {
  return process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || null;
}

/** Server-only Razorpay instance */
export function getRazorpay(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

/** Checkout payment signature: order_id|payment_id */
export function verifyPaymentSignature(opts: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !opts.orderId || !opts.paymentId || !opts.signature) return false;
  const body = `${opts.orderId}|${opts.paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(opts.signature, "utf8")
    );
  } catch {
    return expected === opts.signature;
  }
}

/** Webhook body signature (X-Razorpay-Signature) */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature || !rawBody) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch {
    return expected === signature;
  }
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(Number(rupees) * 100);
}

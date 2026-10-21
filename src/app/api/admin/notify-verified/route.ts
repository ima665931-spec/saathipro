import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { sendPaymentVerifiedEmail } from "@/lib/email";

/** Optional follow-up after approve_payment — sends You're in email */
export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const { paymentId, userId } = await req.json();

    let user = null as { email: string; name: string | null } | null;

    if (paymentId) {
      const pay = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { user: { select: { email: true, name: true } } },
      });
      user = pay?.user || null;
    } else if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
    }

    if (!user?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result = await sendPaymentVerifiedEmail({
      to: user.email,
      name: user.name,
    });

    return NextResponse.json({ success: true, emailed: result.sent });
  } catch (err) {
    console.error("notify-verified:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

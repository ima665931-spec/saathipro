import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { sendPaymentVerifiedEmail } from "@/lib/email";

/** After payment approve — activate Saathi listing + email */
export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const { paymentId, userId } = await req.json();

    let uid = userId as string | undefined;
    let user = null as { email: string; name: string | null } | null;

    if (paymentId) {
      const pay = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { user: { select: { id: true, email: true, name: true } } },
      });
      if (pay) {
        uid = pay.userId;
        user = pay.user;
      }
    } else if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
    }

    if (uid) {
      await prisma.user.update({
        where: { id: uid },
        data: { paymentStatus: "VERIFIED", role: "SAATHI" },
      });
      await prisma.saathiProfile.updateMany({
        where: { userId: uid },
        data: { isActive: true },
      });
    }

    if (!user?.email) {
      return NextResponse.json({ success: true, emailed: false });
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

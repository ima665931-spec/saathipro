import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pickUpi, bumpUpiUsage } from "@/lib/upi-pool";

export const FEE = 499;
const MAX_SHOT = 500_000;
const ASSIGN_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours same UPI

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: session.user.email, mode: "insensitive" } },
      include: {
        payments: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Already verified / pending review — no new UPI needed
    if (user.paymentStatus === "VERIFIED" || user.paymentStatus === "PENDING") {
      return NextResponse.json({
        paymentStatus: user.paymentStatus,
        amount: FEE,
        upiId: "",
        upiName: "",
        upiPoolId: null,
        payments: user.payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          utr: p.utr,
          createdAt: p.createdAt,
        })),
      });
    }

    // Reuse open assignment so refresh doesn't change UPI mid-payment
    const since = new Date(Date.now() - ASSIGN_TTL_MS);
    let assignment = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        status: "ASSIGNED",
        type: "REGISTRATION",
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      include: { upiPool: true },
    });

    if (!assignment) {
      const picked = await pickUpi();
      if (!picked) {
        return NextResponse.json({
          paymentStatus: user.paymentStatus,
          amount: FEE,
          upiId: "",
          upiName: "",
          upiPoolId: null,
          error: "No UPI available in pool",
          payments: [],
        });
      }

      assignment = await prisma.payment.create({
        data: {
          userId: user.id,
          amount: FEE,
          type: "REGISTRATION",
          status: "ASSIGNED",
          upiPoolId: picked.id,
          note: picked.upiId,
        },
        include: { upiPool: true },
      });
    }

    const upiId =
      assignment.upiPool?.upiId || assignment.note || "";
    const upiName =
      assignment.upiPool?.displayName || "SaathiPro";

    return NextResponse.json({
      paymentStatus: user.paymentStatus,
      amount: FEE,
      upiId,
      upiName,
      upiPoolId: assignment.upiPoolId,
      assignmentId: assignment.id,
      payments: user.payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        utr: p.utr,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    console.error("payment GET:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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

    if (user.paymentStatus === "VERIFIED") {
      return NextResponse.json({ error: "Already verified" }, { status: 400 });
    }

    const body = await req.json();
    const { utr, screenshot, assignmentId, upiPoolId } = body;

    if (!utr || typeof utr !== "string" || utr.trim().length < 6) {
      return NextResponse.json(
        { error: "Valid UTR / transaction ID required" },
        { status: 400 }
      );
    }

    if (!screenshot || typeof screenshot !== "string") {
      return NextResponse.json(
        { error: "Payment screenshot required" },
        { status: 400 }
      );
    }

    if (!screenshot.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Invalid screenshot format" },
        { status: 400 }
      );
    }

    if (screenshot.length > MAX_SHOT) {
      return NextResponse.json(
        { error: "Screenshot too large" },
        { status: 400 }
      );
    }

    let payment;

    if (assignmentId) {
      payment = await prisma.payment.update({
        where: { id: assignmentId },
        data: {
          utr: utr.trim(),
          screenshot,
          status: "PENDING",
          amount: FEE,
        },
      });
    } else {
      payment = await prisma.payment.create({
        data: {
          userId: user.id,
          amount: FEE,
          type: "REGISTRATION",
          utr: utr.trim(),
          screenshot,
          status: "PENDING",
          upiPoolId: upiPoolId || null,
        },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { paymentStatus: "PENDING" },
    });

    await bumpUpiUsage(payment.upiPoolId || upiPoolId);

    return NextResponse.json({ success: true, paymentId: payment.id });
  } catch (err) {
    console.error("payment POST:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

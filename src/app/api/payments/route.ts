import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const FEE = 499;
const MAX_SHOT = 500_000;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        payments: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const upiId = process.env.NEXT_PUBLIC_UPI_ID || process.env.UPI_ID || "";
    const upiName =
      process.env.NEXT_PUBLIC_UPI_NAME || process.env.UPI_NAME || "SaathiPro";

    return NextResponse.json({
      paymentStatus: user.paymentStatus,
      amount: FEE,
      upiId,
      upiName,
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.paymentStatus === "VERIFIED") {
      return NextResponse.json({ error: "Already verified" }, { status: 400 });
    }

    const body = await req.json();
    const { utr, screenshot } = body;

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

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: FEE,
        type: "REGISTRATION",
        utr: utr.trim(),
        screenshot,
        status: "PENDING",
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { paymentStatus: "PENDING" },
    });

    return NextResponse.json({ success: true, paymentId: payment.id });
  } catch (err) {
    console.error("payment POST:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

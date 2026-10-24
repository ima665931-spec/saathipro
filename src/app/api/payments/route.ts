import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pickUpi, bumpUpiUsage } from "@/lib/upi-pool";
import { getPlan, isValidPlanId, hasActivePlan, type PlanId } from "@/lib/plans";

const MAX_SHOT = 500_000;
const ASSIGN_TTL_MS = 6 * 60 * 60 * 1000;

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const planParam = searchParams.get("plan");
    const planId: PlanId = isValidPlanId(planParam) ? planParam : "MONTHLY";
    const plan = getPlan(planId);

    const user = await prisma.user.findFirst({
      where: { email: { equals: session.user.email, mode: "insensitive" } },
      include: {
        payments: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const active = hasActivePlan(user);

    if (user.paymentStatus === "PENDING") {
      return NextResponse.json({
        paymentStatus: "PENDING",
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
        amount: plan.price,
        selectedPlan: plan,
        upiId: "",
        upiName: "",
        upiPoolId: null,
        active,
        payments: user.payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          plan: p.plan,
          status: p.status,
          utr: p.utr,
          createdAt: p.createdAt,
        })),
      });
    }

    if (active) {
      return NextResponse.json({
        paymentStatus: "VERIFIED",
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
        amount: plan.price,
        selectedPlan: plan,
        upiId: "",
        upiName: "",
        upiPoolId: null,
        active: true,
        payments: user.payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          plan: p.plan,
          status: p.status,
          utr: p.utr,
          createdAt: p.createdAt,
        })),
      });
    }

    const since = new Date(Date.now() - ASSIGN_TTL_MS);
    let assignment = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        status: "ASSIGNED",
        plan: planId,
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
          amount: plan.price,
          selectedPlan: plan,
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
          amount: plan.price,
          type: "MEMBERSHIP",
          plan: planId,
          status: "ASSIGNED",
          upiPoolId: picked.id,
          note: picked.upiId,
        },
        include: { upiPool: true },
      });
    }

    return NextResponse.json({
      paymentStatus: user.paymentStatus,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt,
      amount: plan.price,
      selectedPlan: plan,
      upiId: assignment.upiPool?.upiId || assignment.note || "",
      upiName: assignment.upiPool?.displayName || "SaathiPro",
      upiPoolId: assignment.upiPoolId,
      assignmentId: assignment.id,
      active: false,
      payments: user.payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        plan: p.plan,
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

    if (hasActivePlan(user) && user.paymentStatus === "VERIFIED") {
      // allow renew intentionally — still accept new payment
    }

    const body = await req.json();
    const { utr, screenshot, assignmentId, upiPoolId, plan: planRaw } = body;
    const planId: PlanId = isValidPlanId(planRaw) ? planRaw : "MONTHLY";
    const plan = getPlan(planId);

    if (!utr || typeof utr !== "string" || utr.trim().length < 6) {
      return NextResponse.json(
        { error: "Valid UTR / transaction ID required" },
        { status: 400 }
      );
    }

    if (!screenshot || typeof screenshot !== "string" || !screenshot.startsWith("data:image/")) {
      return NextResponse.json({ error: "Payment screenshot required" }, { status: 400 });
    }

    if (screenshot.length > MAX_SHOT) {
      return NextResponse.json({ error: "Screenshot too large" }, { status: 400 });
    }

    let payment;

    if (assignmentId) {
      payment = await prisma.payment.update({
        where: { id: assignmentId },
        data: {
          utr: utr.trim(),
          screenshot,
          status: "PENDING",
          amount: plan.price,
          plan: planId,
          type: "MEMBERSHIP",
        },
      });
    } else {
      payment = await prisma.payment.create({
        data: {
          userId: user.id,
          amount: plan.price,
          type: "MEMBERSHIP",
          plan: planId,
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

    return NextResponse.json({ success: true, paymentId: payment.id, plan: planId });
  } catch (err) {
    console.error("payment POST:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

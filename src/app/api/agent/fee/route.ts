import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pickUpi, bumpUpiUsage } from "@/lib/upi-pool";
import { AGENT_ENTRY_FEE, AGENT_ENTRY_TYPE } from "@/lib/agent-fee";
import { generateAgentId } from "@/lib/ids";
import { isValidUtr12, normalizeUtr12 } from "@/lib/ids";

const MAX_SHOT = 500_000;

async function sessionUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return prisma.user.findFirst({
    where: { email: { equals: session.user.email, mode: "insensitive" } },
  });
}

async function ensureAgentId(userId: string, name?: string | null, current?: string | null) {
  if (current) return current;
  for (let i = 0; i < 8; i++) {
    const code = generateAgentId(name);
    try {
      await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
      return code;
    } catch {
      /* clash */
    }
  }
  return generateAgentId(name);
}

export async function GET() {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const paid = await prisma.payment.findFirst({
    where: { userId: user.id, type: AGENT_ENTRY_TYPE, status: "APPROVED" },
  });
  const pending = await prisma.payment.findFirst({
    where: { userId: user.id, type: AGENT_ENTRY_TYPE, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  if (paid) {
    return NextResponse.json({
      feeStatus: "PAID",
      amount: AGENT_ENTRY_FEE,
      agentId: user.referralCode,
    });
  }
  if (pending) {
    return NextResponse.json({
      feeStatus: "PENDING",
      amount: AGENT_ENTRY_FEE,
      agentId: user.referralCode,
      utr: pending.utr,
    });
  }

  const picked = await pickUpi();
  if (!picked) {
    return NextResponse.json({
      feeStatus: "NONE",
      amount: AGENT_ENTRY_FEE,
      error: "No UPI in pool",
      upiId: "",
    });
  }

  return NextResponse.json({
    feeStatus: "NONE",
    amount: AGENT_ENTRY_FEE,
    upiId: picked.upiId,
    upiName: picked.displayName,
    upiPoolId: picked.id,
    agentId: user.referralCode,
  });
}

export async function POST(req: Request) {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "AGENT") {
    return NextResponse.json({ error: "Already an agent" }, { status: 400 });
  }

  const existing = await prisma.payment.findFirst({
    where: {
      userId: user.id,
      type: AGENT_ENTRY_TYPE,
      status: { in: ["APPROVED", "PENDING"] },
    },
  });
  if (existing?.status === "APPROVED") {
    return NextResponse.json({ error: "Fee already paid" }, { status: 400 });
  }
  if (existing?.status === "PENDING") {
    return NextResponse.json({ error: "Fee payment already under review" }, { status: 400 });
  }

  const body = await req.json();
  const { utr, screenshot, upiPoolId } = body;

  if (!utr || !isValidUtr12(String(utr))) {
    return NextResponse.json({ error: "UTR must be exactly 12 digits" }, { status: 400 });
  }
  if (!screenshot || !String(screenshot).startsWith("data:image/")) {
    return NextResponse.json({ error: "Screenshot required" }, { status: 400 });
  }
  if (String(screenshot).length > MAX_SHOT) {
    return NextResponse.json({ error: "Screenshot too large" }, { status: 400 });
  }

  const agentId = await ensureAgentId(user.id, user.name, user.referralCode);

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      amount: AGENT_ENTRY_FEE,
      type: AGENT_ENTRY_TYPE,
      plan: null,
      utr: normalizeUtr12(String(utr)),
      screenshot: String(screenshot),
      status: "PENDING",
      upiPoolId: upiPoolId || null,
      note: `Agent entry · ${agentId}`,
    },
  });

  await bumpUpiUsage(upiPoolId || null);

  return NextResponse.json({
    success: true,
    paymentId: payment.id,
    agentId,
    feeStatus: "PENDING",
  });
}

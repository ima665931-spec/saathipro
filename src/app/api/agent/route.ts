import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAgent() {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: "Unauthorized", status: 401 as const };
  }
  const user = await prisma.user.findFirst({
    where: { email: { equals: session.user.email, mode: "insensitive" } },
  });
  if (!user) return { error: "Not found", status: 404 as const };
  if (user.isBanned) return { error: "Banned", status: 403 as const };
  if (user.role !== "AGENT" && user.role !== "ADMIN") {
    return { error: "Agents only", status: 403 as const };
  }
  return { user };
}

export async function GET() {
  const gate = await requireAgent();
  if ("error" in gate && gate.error) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const agent = gate.user!;

  try {
    const [referrals, commissions] = await Promise.all([
      prisma.user.findMany({
        where: { referredById: agent.id },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          name: true,
          email: true,
          paymentStatus: true,
          plan: true,
          planExpiresAt: true,
          createdAt: true,
        },
      }),
      prisma.commission.findMany({
        where: { agentId: agent.id },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
    ]);

    const pending = commissions
      .filter((c) => c.status === "PENDING")
      .reduce((s, c) => s + c.amount, 0);
    const paid = commissions
      .filter((c) => c.status === "PAID")
      .reduce((s, c) => s + c.amount, 0);

    const origin =
      process.env.AUTH_URL ||
      process.env.NEXTAUTH_URL ||
      "https://saathipro.vercel.app";

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        referralCode: agent.referralCode,
        commissionPct: agent.commissionPct ?? 20,
        shareLink: agent.referralCode
          ? `${origin.replace(/\/$/, "")}/register?ref=${agent.referralCode}`
          : null,
      },
      stats: {
        referrals: referrals.length,
        paidMembers: referrals.filter((r) => r.paymentStatus === "VERIFIED").length,
        pendingCommission: pending,
        paidCommission: paid,
      },
      referrals,
      commissions,
    });
  } catch (err) {
    console.error("agent GET:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

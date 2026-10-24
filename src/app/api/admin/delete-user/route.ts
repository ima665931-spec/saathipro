import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

/**
 * Permanent delete — platform se user hat jata hai.
 * Same Gmail se dubara register ho sakta hai.
 */
export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const { userId } = await req.json();
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    if (userId === gate.user!.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.role === "ADMIN") {
      return NextResponse.json({ error: "Cannot delete admin accounts" }, { status: 400 });
    }

    // Cascade: payments, bookings, profile, commissions, withdrawals, etc.
    // Explicit sessions + OAuth accounts so email is free for re-register
    await prisma.$transaction(async (tx) => {
      await tx.session.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({
      success: true,
      deleted: {
        id: target.id,
        email: target.email,
        name: target.name,
        role: target.role,
      },
    });
  } catch (err) {
    console.error("delete-user:", err);
    return NextResponse.json(
      { error: "Delete failed — user may have linked data. Try again or contact support." },
      { status: 500 }
    );
  }
}

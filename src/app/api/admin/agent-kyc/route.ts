import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

/** Full KYC for one user — phone, aadhaar number, photo (admin only) */
export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      aadhaar: true,
      aadhaarPhoto: true,
      agentUpi: true,
      agentStatus: true,
      role: true,
      referralCode: true,
      commissionPct: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

/** Admin can update stored phone / aadhaar / commission */
export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const body = await req.json();
    const { userId, phone, aadhaar, agentUpi, commissionPct, agentNote } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (phone !== undefined) data.phone = String(phone).replace(/\D/g, "").slice(-10);
    if (aadhaar !== undefined) data.aadhaar = String(aadhaar).replace(/\s/g, "");
    if (agentUpi !== undefined) data.agentUpi = String(agentUpi).trim().toLowerCase() || null;
    if (commissionPct !== undefined) data.commissionPct = Number(commissionPct);
    if (agentNote !== undefined) data.agentNote = agentNote;

    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (err) {
    console.error("agent-kyc PATCH:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

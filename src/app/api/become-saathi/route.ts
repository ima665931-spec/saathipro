import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bio, city, hourlyRate, services, phone } = body;

    if (!bio || !city || !hourlyRate || !Array.isArray(services) || services.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "SAATHI",
        phone: phone || user.phone,
      },
    });

    await prisma.saathiProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        bio,
        city,
        hourlyRate: Number(hourlyRate),
        services: JSON.stringify(services),
        isVerified: false,
        isActive: true,
      },
      update: {
        bio,
        city,
        hourlyRate: Number(hourlyRate),
        services: JSON.stringify(services),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("become-saathi error:", err);
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}

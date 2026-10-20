import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_PHOTO_CHARS = 450_000; // ~350KB base64

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bio, city, hourlyRate, services, phone, photo } = body;

    if (
      !bio ||
      !city ||
      !hourlyRate ||
      !Array.isArray(services) ||
      services.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (typeof bio === "string" && bio.trim().length < 20) {
      return NextResponse.json(
        { error: "Bio must be at least 20 characters" },
        { status: 400 }
      );
    }

    let photoData: string | undefined;
    if (photo && typeof photo === "string") {
      if (!photo.startsWith("data:image/")) {
        return NextResponse.json(
          { error: "Invalid photo format" },
          { status: 400 }
        );
      }
      if (photo.length > MAX_PHOTO_CHARS) {
        return NextResponse.json(
          { error: "Photo too large. Use under 300KB." },
          { status: 400 }
        );
      }
      photoData = photo;
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
        ...(photoData ? { image: photoData } : {}),
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

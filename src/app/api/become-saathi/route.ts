import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertCleanBio } from "@/lib/content-filter";
import { hasActivePlan } from "@/lib/plans";

const MAX_PHOTO_CHARS = 450_000;

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

    const bioErr = assertCleanBio(String(bio));
    if (bioErr) {
      return NextResponse.json({ error: bioErr }, { status: 400 });
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

    const user = await prisma.user.findFirst({
      where: { email: { equals: session.user.email, mode: "insensitive" } },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isBanned) {
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    }

    // Active membership required for live listing + SAATHI role
    const paid =
      user.role === "ADMIN" || hasActivePlan(user);

    // Role: only promote to SAATHI when paid. Never demote ADMIN/AGENT.
    let nextRole = user.role;
    if (user.role !== "ADMIN" && user.role !== "AGENT") {
      nextRole = paid ? "SAATHI" : user.role === "SAATHI" ? "SAATHI" : "USER";
      // Keep SAATHI role if already set (profile edit), but isActive still gated by paid
      if (paid) nextRole = "SAATHI";
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: nextRole,
        phone: phone || user.phone,
        ...(photoData ? { image: photoData } : {}),
      },
    });

    await prisma.saathiProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        bio: String(bio).trim(),
        city,
        hourlyRate: Number(hourlyRate),
        services: JSON.stringify(services),
        isVerified: false,
        isActive: paid,
      },
      update: {
        bio: String(bio).trim(),
        city,
        hourlyRate: Number(hourlyRate),
        services: JSON.stringify(services),
        isActive: paid,
      },
    });

    return NextResponse.json({
      success: true,
      live: paid,
      needsPayment: !paid,
      paymentStatus: user.paymentStatus,
      message: paid
        ? "Profile live on Find Saathi."
        : "Profile saved. Choose a membership plan to go live on Find.",
    });
  } catch (err) {
    console.error("become-saathi error:", err);
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}

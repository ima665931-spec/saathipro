import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const profiles = await prisma.saathiProfile.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const saathis = profiles.map((p) => {
      let services: string[] = [];
      try {
        services = p.services ? JSON.parse(p.services) : [];
      } catch {
        services = p.services ? [p.services] : [];
      }

      return {
        id: p.userId,
        name: p.user.name || "Saathi",
        city: p.city || "India",
        services,
        rate: p.hourlyRate || 1500,
        rating: 4.8,
        reviews: 0,
        bio: p.bio || "Professional companion.",
        image: p.user.image || null,
        verified: p.isVerified,
        fromDb: true,
      };
    });

    return NextResponse.json({ saathis });
  } catch (err) {
    console.error("saathis list error:", err);
    return NextResponse.json({ saathis: [], error: "Failed to load" }, { status: 500 });
  }
}

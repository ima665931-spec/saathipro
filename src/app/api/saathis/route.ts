import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BAD_NAMES = new Set([
  "name",
  "имя",
  "test",
  "user",
  "saathi",
  "admin",
  "null",
  "undefined",
]);

function isQualityProfile(opts: {
  name: string;
  bio: string;
  services: string[];
  rate: number;
}) {
  const name = opts.name.trim();
  const bio = opts.bio.trim();

  if (name.length < 2) return false;
  if (BAD_NAMES.has(name.toLowerCase())) return false;
  if (bio.length < 20) return false;
  if (/^[A-Z0-9\s]{15,}$/.test(bio) && bio === bio.toUpperCase()) return false;
  if ((bio.match(/[aeiouаеёиоуыэюя]/gi) || []).length < 3) return false;
  if (!opts.services.length) return false;
  if (opts.rate < 500 || opts.rate > 10000) return false;

  return true;
}

function pickImage(image: string | null): string | null {
  if (!image) return null;
  // Prefer uploaded data URLs or https (skip odd OAuth cartoon defaults optionally)
  if (image.startsWith("data:image/")) return image;
  if (image.startsWith("https://")) return image;
  return null;
}

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
            reviewsReceived: {
              select: { rating: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const saathis = profiles
      .map((p) => {
        let services: string[] = [];
        try {
          services = p.services ? JSON.parse(p.services) : [];
        } catch {
          services = p.services ? [p.services] : [];
        }

        const name = p.user.name || "";
        const bio = p.bio || "";
        const rate = p.hourlyRate || 1500;
        const revs = p.user.reviewsReceived || [];
        const count = revs.length;
        const avg =
          count > 0
            ? Math.round(
                (revs.reduce((s, r) => s + r.rating, 0) / count) * 10
              ) / 10
            : 4.8;

        return {
          id: p.userId,
          name: name || "Saathi",
          city: p.city || "India",
          services,
          rate,
          rating: avg,
          reviews: count,
          bio: bio || "Professional companion.",
          image: pickImage(p.user.image),
          verified: p.isVerified,
          fromDb: true,
        };
      })
      .filter((s) =>
        isQualityProfile({
          name: s.name,
          bio: s.bio,
          services: s.services,
          rate: s.rate,
        })
      );

    return NextResponse.json({ saathis });
  } catch (err) {
    console.error("saathis list error:", err);
    return NextResponse.json(
      { saathis: [], error: "Failed to load" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isQualityProfile } from "@/lib/content-filter";
import { hasActivePlan } from "@/lib/plans";
import { SERVICE_LABELS, type SortId } from "@/lib/catalog";

function pickImage(image: string | null): string | null {
  if (!image) return null;
  if (image.startsWith("data:image/")) return image;
  if (image.startsWith("https://")) return image;
  return null;
}

function norm(s: string) {
  return s.trim().toLowerCase();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cityQ = searchParams.get("city")?.trim() || "";
    const serviceQ = searchParams.get("service")?.trim() || "";
    const q = searchParams.get("q")?.trim() || "";
    const verifiedOnly = searchParams.get("verified") === "1";
    const minRate = Number(searchParams.get("minRate") || 0) || 0;
    const maxRate = Number(searchParams.get("maxRate") || 0) || 0;
    const sort = (searchParams.get("sort") || "newest") as SortId;

    const profiles = await prisma.saathiProfile.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
            isBanned: true,
            role: true,
            paymentStatus: true,
            planExpiresAt: true,
            reviewsReceived: {
              select: { rating: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let saathis = profiles
      .filter((p) => {
        if (p.user.isBanned) return false;
        if (p.user.role === "ADMIN") return true;
        return hasActivePlan(p.user);
      })
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
            ? Math.round((revs.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
            : 0;

        return {
          id: p.userId,
          name: name || "Saathi",
          city: p.city || "India",
          services,
          rate,
          rating: avg || 4.8,
          reviews: count,
          bio: bio || "Professional companion.",
          image: pickImage(p.user.image),
          verified: p.isVerified,
          createdAt: p.createdAt.toISOString(),
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

    // Filters
    if (cityQ && cityQ.toLowerCase() !== "all" && cityQ !== "All Cities") {
      const c = norm(cityQ);
      saathis = saathis.filter(
        (s) => norm(s.city) === c || norm(s.city).includes(c) || c.includes(norm(s.city))
      );
    }

    if (serviceQ && serviceQ.toLowerCase() !== "all") {
      const svc = norm(serviceQ);
      saathis = saathis.filter((s) =>
        s.services.some((x) => norm(x) === svc || norm(x).includes(svc))
      );
    }

    if (q) {
      const qq = norm(q);
      saathis = saathis.filter(
        (s) =>
          norm(s.name).includes(qq) ||
          norm(s.bio).includes(qq) ||
          norm(s.city).includes(qq) ||
          s.services.some((x) => norm(x).includes(qq))
      );
    }

    if (verifiedOnly) {
      saathis = saathis.filter((s) => s.verified);
    }

    if (minRate > 0) {
      saathis = saathis.filter((s) => s.rate >= minRate);
    }
    if (maxRate > 0) {
      saathis = saathis.filter((s) => s.rate <= maxRate);
    }

    // Sort
    if (sort === "rate_asc") {
      saathis.sort((a, b) => a.rate - b.rate);
    } else if (sort === "rate_desc") {
      saathis.sort((a, b) => b.rate - a.rate);
    } else if (sort === "rating") {
      saathis.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    }
    // newest = default order from DB

    // Facets for UI (from unfiltered active set would be better; use current list cities)
    const cities = Array.from(
      new Set(
        profiles
          .filter((p) => !p.user.isBanned && (p.user.role === "ADMIN" || hasActivePlan(p.user)))
          .map((p) => p.city)
          .filter((c): c is string => !!c && c.trim().length > 0)
      )
    ).sort();

    return NextResponse.json({
      saathis,
      meta: {
        total: saathis.length,
        cities,
        services: SERVICE_LABELS,
      },
    });
  } catch (err) {
    console.error("saathis list error:", err);
    return NextResponse.json(
      { saathis: [], meta: { total: 0, cities: [], services: [] }, error: "Failed to load" },
      { status: 500 }
    );
  }
}

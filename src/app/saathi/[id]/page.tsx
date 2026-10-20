import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

const FALLBACK: Record<
  string,
  {
    name: string;
    city: string;
    services: string[];
    rate: number;
    rating: number;
    reviews: number;
    bio: string;
    verified: boolean;
  }
> = {
  "1": {
    name: "Priya Sharma",
    city: "Delhi",
    services: ["Movie Partner", "Coffee Partner", "Hanging Out"],
    rate: 1500,
    rating: 4.9,
    reviews: 128,
    bio: "Friendly and professional companion. I enjoy meaningful conversations, good cinema, and creating a comfortable experience for every session. Strictly professional boundaries.",
    verified: true,
  },
  "2": {
    name: "Anjali Mehta",
    city: "Mumbai",
    services: ["Clubbing", "Event Partner", "Hanging Out"],
    rate: 2000,
    rating: 4.8,
    reviews: 94,
    bio: "Nightlife and events specialist. Safe, punctual, and fun. Perfect for parties, launches, and social evenings.",
    verified: true,
  },
  "3": {
    name: "Sneha Reddy",
    city: "Bangalore",
    services: ["Elder Care", "Medical Support", "Shopping Buddy"],
    rate: 1200,
    rating: 5.0,
    reviews: 67,
    bio: "Patient and experienced in elder care and hospital assistance. Calm presence, reliable support for families.",
    verified: true,
  },
  "4": {
    name: "Kavita Patel",
    city: "Pune",
    services: ["Travel Partner", "City Tour Partner", "Coffee Partner"],
    rate: 1800,
    rating: 4.7,
    reviews: 52,
    bio: "Local explorer and travel companion. Great for city tours, day trips, and discovering new places together.",
    verified: true,
  },
  "5": {
    name: "Riya Kapoor",
    city: "Delhi",
    services: ["Shopping Buddy", "Cafe & Food Partner", "Hanging Out"],
    rate: 1400,
    rating: 4.8,
    reviews: 89,
    bio: "Fashion and food enthusiast. Ideal shopping and cafe companion with an eye for good spots.",
    verified: true,
  },
  "6": {
    name: "Neha Singh",
    city: "Mumbai",
    services: ["Movie Partner", "Concert Partner", "Event Partner"],
    rate: 1600,
    rating: 4.9,
    reviews: 113,
    bio: "Movie and music lover. Always up for a film, concert, or cultural evening — professional and punctual.",
    verified: true,
  },
  "7": {
    name: "Pooja Iyer",
    city: "Bangalore",
    services: ["Professional Networking Partner", "Coffee Partner", "Hanging Out"],
    rate: 1500,
    rating: 4.6,
    reviews: 41,
    bio: "Startup and networking oriented. Ideal for brainstorming sessions and professional coffee chats.",
    verified: true,
  },
  "8": {
    name: "Meera Joshi",
    city: "Hyderabad",
    services: ["Elder Care", "Domestic Help", "Shopping Buddy"],
    rate: 1100,
    rating: 4.9,
    reviews: 76,
    bio: "Warm, reliable support for seniors and daily errands. Trust and care first.",
    verified: true,
  },
};

export default async function SaathiProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let saathi: {
    id: string;
    name: string;
    city: string;
    services: string[];
    rate: number;
    rating: number;
    reviews: number;
    bio: string;
    image: string | null;
    verified: boolean;
  } | null = null;

  try {
    const profile = await prisma.saathiProfile.findUnique({
      where: { userId: id },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    if (profile) {
      let services: string[] = [];
      try {
        services = profile.services ? JSON.parse(profile.services) : [];
      } catch {
        services = [];
      }
      saathi = {
        id: profile.userId,
        name: profile.user.name || "Saathi",
        city: profile.city || "India",
        services,
        rate: profile.hourlyRate || 1500,
        rating: 4.8,
        reviews: 0,
        bio: profile.bio || "Professional companion.",
        image: profile.user.image,
        verified: profile.isVerified,
      };
    }
  } catch {
    // fall through to dummy
  }

  if (!saathi && FALLBACK[id]) {
    const f = FALLBACK[id];
    saathi = {
      id,
      name: f.name,
      city: f.city,
      services: f.services,
      rate: f.rate,
      rating: f.rating,
      reviews: f.reviews,
      bio: f.bio,
      image: null,
      verified: f.verified,
    };
  }

  if (!saathi) notFound();

  const avatar =
    saathi.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      saathi.name
    )}&background=5b4a3f&color=fff&size=256&font-size=0.4`;

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-cream font-display font-semibold text-sm">
              S
            </div>
            <span className="font-display text-lg font-semibold text-ink tracking-tight">
              SaathiPro
            </span>
          </Link>
          <Link
            href="/find"
            className="text-sm font-medium text-ink-muted hover:text-ink transition"
          >
            ← Back to Find
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
        <div className="grid lg:grid-cols-[1fr_320px] gap-10">
          {/* Left */}
          <div>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <img
                src={avatar}
                alt={saathi.name}
                className="w-28 h-28 rounded-2xl object-cover shadow-soft border border-border"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-3xl font-semibold text-ink">
                    {saathi.name}
                  </h1>
                  {saathi.verified && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-ink text-cream">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-ink-muted mt-1">{saathi.city} · Professional Saathi</p>
                <div className="flex items-center gap-3 mt-3 text-sm">
                  <span className="text-gold font-semibold">★ {saathi.rating}</span>
                  <span className="text-ink-muted">
                    {saathi.reviews > 0
                      ? `${saathi.reviews} reviews`
                      : "New on platform"}
                  </span>
                </div>
              </div>
            </div>

            <section className="mt-10">
              <h2 className="font-display text-xl font-semibold text-ink mb-3">
                About
              </h2>
              <p className="text-ink-muted leading-relaxed text-[15px]">{saathi.bio}</p>
            </section>

            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold text-ink mb-3">
                Services
              </h2>
              <div className="flex flex-wrap gap-2">
                {saathi.services.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1.5 rounded-full text-sm bg-cream-dark text-ink border border-border"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>

            <section className="mt-10 p-6 rounded-2xl bg-white border border-border shadow-card">
              <h2 className="font-display text-lg font-semibold text-ink mb-2">
                Safety & professionalism
              </h2>
              <ul className="space-y-2 text-sm text-ink-muted">
                <li>· Consent-first, strictly professional interactions</li>
                <li>· Not a dating service</li>
                <li>· Clear boundaries maintained at all times</li>
                <li>· Report any concern from your bookings page</li>
              </ul>
            </section>
          </div>

          {/* Sticky book card */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-2xl border border-border shadow-soft p-6">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-semibold text-ink">
                  ₹{saathi.rate}
                </span>
                <span className="text-ink-muted text-sm">/ hour</span>
              </div>
              <p className="text-sm text-ink-muted mt-2">
                Select date & duration on the next step
              </p>
              <Link
                href={`/book/${saathi.id}`}
                className="mt-6 block w-full text-center py-3.5 rounded-xl bg-ink text-cream font-semibold hover:bg-accent transition"
              >
                Book session
              </Link>
              <Link
                href="/find"
                className="mt-3 block w-full text-center py-3 rounded-xl border border-border text-ink text-sm font-medium hover:bg-cream-dark transition"
              >
                View other Saathis
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-ink-muted">
          © 2026 SaathiPro · Professional social support
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function SaathiProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const profile = await prisma.saathiProfile.findUnique({
    where: { userId: id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          isBanned: true,
          reviewsReceived: { select: { rating: true } },
        },
      },
    },
  });

  if (!profile || !profile.isActive || profile.user.isBanned) {
    notFound();
  }

  let services: string[] = [];
  try {
    services = profile.services ? JSON.parse(profile.services) : [];
  } catch {
    services = [];
  }

  const revs = profile.user.reviewsReceived || [];
  const count = revs.length;
  const avg =
    count > 0
      ? Math.round((revs.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
      : 4.8;

  const saathi = {
    id: profile.userId,
    name: profile.user.name || "Saathi",
    city: profile.city || "India",
    services,
    rate: profile.hourlyRate || 1500,
    rating: avg,
    reviews: count,
    bio: profile.bio || "Professional companion.",
    image: profile.user.image,
    verified: profile.isVerified,
  };

  const avatar =
    (saathi.image &&
      (saathi.image.startsWith("data:image/") || saathi.image.startsWith("https://"))
      ? saathi.image
      : null) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(saathi.name)}&background=7c3aed&color=fff&size=256&font-size=0.4`;

  return (
    <div className="min-h-screen bg-brand-soft">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center text-white font-display font-bold text-sm">
              S
            </div>
            <span className="font-display text-lg font-bold text-ink">
              Saathi<span className="text-pink">Pro</span>
            </span>
          </Link>
          <Link href="/find" className="text-sm font-medium text-ink-muted hover:text-accent">
            ← Back to Find
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
        <div className="grid lg:grid-cols-[1fr_320px] gap-10">
          <div>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <img
                src={avatar}
                alt={saathi.name}
                className="w-28 h-28 rounded-2xl object-cover shadow-soft border border-border"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-3xl font-bold text-ink">{saathi.name}</h1>
                  {saathi.verified && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-gradient text-white">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <p className="text-ink-muted mt-1">{saathi.city} · Professional Saathi</p>
                <div className="flex items-center gap-3 mt-3 text-sm">
                  <span className="text-gold font-bold">★ {saathi.rating}</span>
                  <span className="text-ink-muted">
                    {saathi.reviews > 0 ? `${saathi.reviews} reviews` : "New on platform"}
                  </span>
                </div>
              </div>
            </div>

            <section className="mt-10">
              <h2 className="font-display text-xl font-bold text-ink mb-3">About</h2>
              <p className="text-ink-muted leading-relaxed text-[15px]">{saathi.bio}</p>
            </section>

            <section className="mt-8">
              <h2 className="font-display text-xl font-bold text-ink mb-3">Services</h2>
              <div className="flex flex-wrap gap-2">
                {saathi.services.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1.5 rounded-full text-sm bg-pink-soft text-pink border border-border font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>

            <section className="mt-10 p-6 rounded-2xl bg-white border border-border shadow-card">
              <h2 className="font-display text-lg font-bold text-ink mb-2">Safety & professionalism</h2>
              <ul className="space-y-2 text-sm text-ink-muted">
                <li>· Consent-first, strictly professional interactions</li>
                <li>· Not a dating service</li>
                <li>· Clear boundaries maintained at all times</li>
                <li>· Report any concern from your bookings page</li>
              </ul>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-2xl border border-border shadow-soft p-6">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold text-brand-gradient">₹{saathi.rate}</span>
                <span className="text-ink-muted text-sm">/ hour</span>
              </div>
              <p className="text-sm text-ink-muted mt-2">Select date & duration on the next step</p>
              <Link
                href={`/book/${saathi.id}`}
                className="mt-6 block w-full text-center py-3.5 rounded-xl btn-brand"
              >
                Book session
              </Link>
              <Link
                href="/find"
                className="mt-3 block w-full text-center py-3 rounded-xl border border-border text-ink text-sm font-medium hover:border-accent/40"
              >
                View other Saathis
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-ink-muted">
          © 2026 Saathi<span className="text-pink font-semibold">Pro</span> · Professional social support
        </div>
      </footer>
    </div>
  );
}

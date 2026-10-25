import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hasActivePlan } from "@/lib/plans";
import { isAgentRole } from "@/lib/account-type";
import { isQualityProfile } from "@/lib/content-filter";

const SERVICES = [
  { title: "Movie Partner", emoji: "🎬", color: "from-violet-500 to-purple-600" },
  { title: "Hanging Out", emoji: "☕", color: "from-pink-400 to-rose-500" },
  { title: "Elder Care", emoji: "💚", color: "from-emerald-400 to-teal-500" },
  { title: "Clubbing", emoji: "🎉", color: "from-fuchsia-500 to-pink-600" },
  { title: "Shopping Buddy", emoji: "🛍️", color: "from-amber-400 to-orange-500" },
  { title: "Coffee Partner", emoji: "💬", color: "from-rose-400 to-pink-500" },
  { title: "Travel Partner", emoji: "✈️", color: "from-indigo-400 to-violet-500" },
  { title: "Medical Support", emoji: "🏥", color: "from-sky-400 to-blue-500" },
];

function avatar(name: string, image: string | null) {
  if (image && (image.startsWith("data:image/") || image.startsWith("https://"))) return image;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=256&bold=true`;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const dbUser = await prisma.user.findFirst({
    where: { email: { equals: session.user.email, mode: "insensitive" } },
    include: {
      saathiProfile: true,
      bookingsAsClient: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });

  if (!dbUser) redirect("/login");
  if (isAgentRole(dbUser.role)) redirect("/agent");

  const isAdmin = dbUser.role === "ADMIN";
  const hasProfile = !!dbUser.saathiProfile;
  const isProvider = dbUser.role === "SAATHI" || hasProfile;
  const active = isAdmin || hasActivePlan(dbUser);
  const pay = dbUser.paymentStatus || "NONE";

  // Featured live Saathis for dashboard (browse free)
  const profiles = await prisma.saathiProfile.findMany({
    where: { isActive: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          isBanned: true,
          role: true,
          paymentStatus: true,
          planExpiresAt: true,
          reviewsReceived: { select: { rating: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 24,
  });

  const featured = profiles
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
        services = [];
      }
      const revs = p.user.reviewsReceived || [];
      const rating =
        revs.length > 0
          ? Math.round((revs.reduce((s, r) => s + r.rating, 0) / revs.length) * 10) / 10
          : 4.8;
      return {
        id: p.userId,
        name: p.user.name || "Saathi",
        city: p.city || "India",
        services,
        rate: p.hourlyRate || 1500,
        rating,
        reviews: revs.length,
        bio: p.bio || "",
        image: p.user.image,
        verified: p.isVerified,
      };
    })
    .filter((s) =>
      isQualityProfile({
        name: s.name,
        bio: s.bio,
        services: s.services,
        rate: s.rate,
      })
    )
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-brand-soft">
      <header className="bg-white/90 backdrop-blur border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-white font-display font-bold text-sm">
                S
              </div>
              <span className="font-display text-lg font-bold text-ink">
                Saathi<span className="text-pink">Pro</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/find" className="hidden sm:inline text-sm font-medium text-ink-muted hover:text-accent">
                Find
              </Link>
              <Link href="/bookings" className="hidden sm:inline text-sm font-medium text-ink-muted hover:text-accent">
                Bookings
              </Link>
              <Link href="/become-saathi" className="hidden sm:inline text-sm font-medium text-ink-muted hover:text-accent">
                {hasProfile ? "My profile" : "Become Saathi"}
              </Link>
              <span className="text-sm text-ink-muted hidden md:inline max-w-[120px] truncate">
                {dbUser.name || dbUser.email}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="px-3 py-1.5 text-sm font-medium text-ink-muted hover:text-ink">
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-pink mb-1">Dashboard</p>
            <h1 className="font-display text-3xl font-bold text-ink">
              Hey{dbUser.name ? `, ${dbUser.name.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="text-ink-muted mt-1 text-sm">
              Browse free · membership unlocks booking & chat
              {dbUser.publicId && (
                <span className="font-mono text-xs"> · {dbUser.publicId}</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {active ? (
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
                ✓ Plan active
              </span>
            ) : pay === "PENDING" ? (
              <Link href="/pay" className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-100">
                Payment pending →
              </Link>
            ) : (
              <Link href="/pricing" className="btn-brand px-4 py-2 rounded-full text-sm">
                Unlock plan
              </Link>
            )}
          </div>
        </div>

        {/* Dual intent — same account */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <Link
            href="/find"
            className="rounded-2xl border border-border bg-white p-6 shadow-card hover:shadow-soft transition group"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-pink">Need a Saathi</p>
            <h2 className="mt-2 font-display text-xl font-bold text-ink group-hover:text-accent">
              Find & book partners
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              Explore profiles below. Plan needed only when you book or message.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-accent">Browse Find →</span>
          </Link>
          <Link
            href="/become-saathi"
            className="rounded-2xl p-6 bg-brand-gradient text-white shadow-glow hover:opacity-95 transition"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-white/80">Wanna be a Saathi</p>
            <h2 className="mt-2 font-display text-xl font-bold">
              {hasProfile ? "Edit your provider profile" : "Create provider profile"}
            </h2>
            <p className="mt-2 text-sm text-white/90">
              Same account. Save profile anytime — go live when plan is active.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold">
              {hasProfile ? "Open profile →" : "Start profile →"}
            </span>
          </Link>
        </div>

        {/* Services */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-ink">All services</h2>
            <Link href="/find" className="text-sm font-semibold text-accent">See all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SERVICES.map((s) => (
              <Link
                key={s.title}
                href={`/find?service=${encodeURIComponent(s.title)}`}
                className="group relative overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-card hover:shadow-soft transition"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-lg`}>
                  {s.emoji}
                </div>
                <p className="mt-3 font-semibold text-ink text-sm group-hover:text-accent">{s.title}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured partners — free browse */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-ink">Featured Saathis</h2>
            <Link href="/find" className="text-sm font-semibold text-accent">View more →</Link>
          </div>

          {featured.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-10 text-center shadow-card">
              <p className="font-display font-bold text-ink">Profiles coming soon</p>
              <p className="text-sm text-ink-muted mt-2">
                Be the first provider — set up your Saathi profile.
              </p>
              <Link href="/become-saathi" className="btn-brand inline-block mt-5 px-6 py-2.5 rounded-full text-sm">
                Wanna be a Saathi
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.map((s) => (
                <article
                  key={s.id}
                  className="bg-white rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-soft transition flex flex-col"
                >
                  <Link href={`/saathi/${s.id}`} className="block aspect-[4/3] bg-gradient-to-br from-violet-100 to-pink-100 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatar(s.name, s.image)}
                      alt={s.name}
                      className="w-full h-full object-cover"
                    />
                    {s.verified && (
                      <span className="absolute top-2 right-2 bg-brand-gradient text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        ✓ Verified
                      </span>
                    )}
                  </Link>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex justify-between gap-2">
                      <div>
                        <Link href={`/saathi/${s.id}`} className="font-display font-bold text-ink hover:text-accent">
                          {s.name}
                        </Link>
                        <p className="text-xs text-ink-muted">{s.city}</p>
                      </div>
                      <p className="text-sm font-bold text-gold">★ {s.rating}</p>
                    </div>
                    <p className="mt-2 text-xs text-ink-muted line-clamp-2 flex-1">{s.bio}</p>
                    <div className="mt-3 flex items-center justify-between pt-3 border-t border-border">
                      <span className="font-display font-bold text-brand-gradient">₹{s.rate}<span className="text-xs text-ink-muted font-normal">/hr</span></span>
                      <Link
                        href={active ? `/book/${s.id}` : `/pricing?next=/book/${s.id}`}
                        className="btn-brand px-3 py-1.5 text-xs rounded-full"
                      >
                        {active ? "Book" : "Unlock to book"}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {!active && (
          <section className="mb-10 rounded-2xl bg-brand-gradient text-white p-6 sm:p-8 shadow-glow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold">Ready to book or go live?</h2>
              <p className="mt-1 text-sm text-white/90">
                Membership unlocks booking, chat, and live Saathi listing. Browse stays free.
              </p>
            </div>
            <Link
              href="/pricing"
              className="shrink-0 px-6 py-3 bg-white text-accent font-bold rounded-full text-center text-sm"
            >
              View plans
            </Link>
          </section>
        )}

        <section className="bg-white rounded-2xl border border-border p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-ink">Recent bookings</h3>
            <Link href="/bookings" className="text-sm font-medium text-accent">All →</Link>
          </div>
          {dbUser.bookingsAsClient.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-6">
              No bookings yet.{" "}
              <Link href="/find" className="text-accent font-semibold">
                Find a Saathi
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {dbUser.bookingsAsClient.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-medium text-ink">{b.saathiName}</p>
                    <p className="text-sm text-ink-muted">
                      {b.service} · {b.date} · {b.time}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/chat/${b.id}`} className="text-sm text-accent font-medium">
                      Chat
                    </Link>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

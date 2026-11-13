import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hasActivePlan } from "@/lib/plans";
import { isAgentRole } from "@/lib/account-type";
import { isQualityProfile } from "@/lib/content-filter";

const SERVICES = [
  { title: "Movie Partner", emoji: "🎬" },
  { title: "Hanging Out", emoji: "☕" },
  { title: "Elder Care", emoji: "💚" },
  { title: "Clubbing", emoji: "🎉" },
  { title: "Shopping Buddy", emoji: "🛍️" },
  { title: "Coffee Partner", emoji: "💬" },
  { title: "Travel Partner", emoji: "✈️" },
  { title: "Medical Support", emoji: "🏥" },
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
  const active = isAdmin || hasActivePlan(dbUser);
  const pay = dbUser.paymentStatus || "NONE";
  const firstName = dbUser.name?.split(" ")[0] || "there";

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
    <div className="space-y-6 pb-2">
      {/* Greeting */}
      <section className="pt-1">
        <p className="text-sm text-ink-muted">Welcome back</p>
        <h1 className="font-display text-2xl font-bold text-ink tracking-tight">
          Hey, {firstName}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {active ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Plan active
            </span>
          ) : pay === "PENDING" ? (
            <Link
              href="/pay"
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-100"
            >
              Payment pending →
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold text-white bg-brand-gradient shadow-sm"
            >
              Unlock plan
            </Link>
          )}
          {dbUser.publicId && (
            <span className="text-[11px] font-mono text-ink-muted">{dbUser.publicId}</span>
          )}
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-3 gap-2.5">
        <Link
          href="/find"
          className="rounded-2xl bg-white border border-border p-3 shadow-card active:scale-[0.98] transition text-center"
        >
          <span className="text-2xl" aria-hidden>
            🔍
          </span>
          <p className="mt-1.5 text-xs font-bold text-ink">Find</p>
        </Link>
        <Link
          href="/bookings"
          className="rounded-2xl bg-white border border-border p-3 shadow-card active:scale-[0.98] transition text-center"
        >
          <span className="text-2xl" aria-hidden>
            📅
          </span>
          <p className="mt-1.5 text-xs font-bold text-ink">Bookings</p>
        </Link>
        <Link
          href={hasProfile ? "/become-saathi" : "/become-saathi"}
          className="rounded-2xl bg-brand-gradient p-3 shadow-glow active:scale-[0.98] transition text-center text-white"
        >
          <span className="text-2xl" aria-hidden>
            ✨
          </span>
          <p className="mt-1.5 text-xs font-bold">{hasProfile ? "Profile" : "Earn"}</p>
        </Link>
      </section>

      {/* Services — horizontal */}
      <section>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h2 className="text-sm font-bold text-ink">Services</h2>
          <Link href="/find" className="text-xs font-semibold text-violet-600">
            See all
          </Link>
        </div>
        <div className="-mx-1 overflow-x-auto scrollbar-none">
          <div className="flex gap-2 px-1 pb-1 min-w-min">
            {SERVICES.map((s) => (
              <Link
                key={s.title}
                href={`/find?service=${encodeURIComponent(s.title)}`}
                className="shrink-0 w-[4.75rem] rounded-2xl bg-white border border-border py-3 px-1 text-center shadow-sm active:bg-violet-50"
              >
                <span className="text-xl leading-none">{s.emoji}</span>
                <p className="mt-1.5 text-[10px] font-semibold text-ink leading-tight line-clamp-2">
                  {s.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Saathis */}
      <section>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h2 className="text-sm font-bold text-ink">Featured Saathis</h2>
          <Link href="/find" className="text-xs font-semibold text-violet-600">
            View more
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-2xl bg-white border border-border p-6 text-center shadow-card">
            <p className="font-semibold text-ink text-sm">Profiles coming soon</p>
            <p className="text-xs text-ink-muted mt-1">Be the first to create a Saathi profile.</p>
            <Link
              href="/become-saathi"
              className="inline-block mt-4 text-xs font-bold text-white bg-brand-gradient px-4 py-2 rounded-full"
            >
              Start profile
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {featured.map((s) => (
              <article
                key={s.id}
                className="flex gap-3 rounded-2xl bg-white border border-border p-3 shadow-card"
              >
                <Link href={`/saathi/${s.id}`} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatar(s.name, s.image)}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover bg-violet-100"
                  />
                </Link>
                <div className="min-w-0 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/saathi/${s.id}`}
                        className="font-bold text-ink text-sm truncate block hover:text-violet-700"
                      >
                        {s.name}
                        {s.verified ? " ✓" : ""}
                      </Link>
                      <p className="text-[11px] text-ink-muted truncate">
                        {s.city} · ★ {s.rating}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-violet-700 shrink-0">
                      ₹{s.rate}
                      <span className="text-[10px] font-medium text-ink-muted">/hr</span>
                    </p>
                  </div>
                  {s.bio ? (
                    <p className="mt-1 text-[11px] text-ink-muted line-clamp-1">{s.bio}</p>
                  ) : null}
                  <div className="mt-auto pt-2">
                    <Link
                      href={active ? `/book/${s.id}` : `/pricing?next=/book/${s.id}`}
                      className="inline-flex text-[11px] font-bold px-3 py-1.5 rounded-full text-white bg-brand-gradient"
                    >
                      {active ? "Book now" : "Unlock to book"}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Recent bookings */}
      <section className="rounded-2xl bg-white border border-border p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-ink">Recent bookings</h2>
          <Link href="/bookings" className="text-xs font-semibold text-violet-600">
            All
          </Link>
        </div>
        {dbUser.bookingsAsClient.length === 0 ? (
          <p className="text-xs text-ink-muted text-center py-4">
            No bookings yet.{" "}
            <Link href="/find" className="font-semibold text-violet-600">
              Find a Saathi
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {dbUser.bookingsAsClient.map((b) => (
              <li key={b.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{b.saathiName}</p>
                  <p className="text-[11px] text-ink-muted truncate">
                    {b.service} · {b.date} · {b.time}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/chat/${b.id}`} className="text-[11px] font-semibold text-violet-600">
                    Chat
                  </Link>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                    {b.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!active && pay !== "PENDING" && (
        <section className="rounded-2xl bg-brand-gradient p-4 text-white shadow-glow">
          <p className="font-bold text-sm">Ready to book or go live?</p>
          <p className="text-xs text-white/90 mt-1">
            Membership unlocks booking, chat, and live listing. Browse stays free.
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-flex text-xs font-bold px-4 py-2 rounded-full bg-white text-violet-700"
          >
            View plans
          </Link>
        </section>
      )}
    </div>
  );
}

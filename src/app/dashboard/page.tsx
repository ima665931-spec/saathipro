import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const SERVICES = [
  { title: "Movie Partner", emoji: "🎬", color: "from-violet-500 to-purple-600", href: "/find" },
  { title: "Hanging Out", emoji: "☕", color: "from-pink-400 to-rose-500", href: "/find" },
  { title: "Elder Care", emoji: "💚", color: "from-emerald-400 to-teal-500", href: "/find" },
  { title: "Clubbing", emoji: "🎉", color: "from-fuchsia-500 to-pink-600", href: "/find" },
  { title: "Shopping Buddy", emoji: "🛍️", color: "from-amber-400 to-orange-500", href: "/find" },
  { title: "Coffee Partner", emoji: "💬", color: "from-rose-400 to-pink-500", href: "/find" },
  { title: "Travel Partner", emoji: "✈️", color: "from-indigo-400 to-violet-500", href: "/find" },
  { title: "Medical Support", emoji: "🏥", color: "from-sky-400 to-blue-500", href: "/find" },
];

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findFirst({
    where: { email: { equals: session.user.email, mode: "insensitive" } },
    include: {
      saathiProfile: true,
      bookingsAsClient: { orderBy: { createdAt: "desc" }, take: 5 },
      bookingsAsSaathi: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!dbUser) redirect("/login");

  const role = dbUser.role || "USER";
  const isSaathi = role === "SAATHI";
  const isAdmin = role === "ADMIN";
  const isAgent = role === "AGENT";
  const clientBookings = dbUser.bookingsAsClient || [];
  const saathiBookings = dbUser.bookingsAsSaathi || [];
  const pay = dbUser.paymentStatus || "NONE";
  const needsPay = !isAdmin && pay !== "VERIFIED";
  const credit = dbUser.creditBalance || 0;
  const origin =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    "https://saathipro.vercel.app";
  const inviteCode = dbUser.referralCode || dbUser.publicId;
  const inviteLink = inviteCode
    ? `${origin.replace(/\/$/, "")}/register?ref=${inviteCode}&type=seeker`
    : null;

  const [clientCount, saathiCount] = await Promise.all([
    prisma.booking.count({ where: { clientId: dbUser.id } }),
    prisma.booking.count({ where: { saathiId: dbUser.id } }),
  ]);

  const recentBookings = isSaathi
    ? [...saathiBookings, ...clientBookings]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
    : clientBookings;

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
              <Link href="/find" className="hidden sm:inline text-sm font-medium text-ink-muted hover:text-accent">Find</Link>
              <Link href="/bookings" className="hidden sm:inline text-sm font-medium text-ink-muted hover:text-accent">Bookings</Link>
              {isAgent && (
                <Link href="/agent" className="hidden sm:inline text-sm font-medium text-accent">Agent hub</Link>
              )}
              {needsPay && (
                <Link href="/pricing" className="text-sm font-semibold text-pink hover:underline">Get plan</Link>
              )}
              <span className="text-sm text-ink-muted hidden md:inline">{dbUser.name || dbUser.email}</span>
              <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                <button type="submit" className="px-3 py-1.5 text-sm font-medium text-ink-muted hover:text-ink">Logout</button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-pink mb-1">Home</p>
            <h1 className="font-display text-3xl font-bold text-ink">
              Hey{dbUser.name ? `, ${dbUser.name.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="text-ink-muted mt-1 text-sm">
              {dbUser.publicId && (
                <span className="font-mono text-xs">Reg ID: {dbUser.publicId} · </span>
              )}
              Pick a service & find your Saathi
            </p>
          </div>
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
            isSaathi ? "bg-brand-gradient text-white" : "bg-white border border-border text-ink"
          }`}>
            {isSaathi ? "Saathi" : isAgent ? "Agent" : "Member"}
          </span>
        </div>

        {credit > 0 && (
          <div className="mb-6 p-4 rounded-2xl border border-pink/30 bg-white shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase text-ink-muted font-semibold">Referral credit</p>
              <p className="font-display text-2xl font-bold text-brand-gradient">₹{credit}</p>
              <p className="text-xs text-ink-muted mt-1">Auto-applied on next plan payment</p>
            </div>
            <Link href="/pricing" className="btn-brand px-5 py-2.5 rounded-full text-sm text-center">Use on next plan</Link>
          </div>
        )}

        {inviteLink && !isAgent && (
          <div className="mb-6 p-5 rounded-2xl bg-white border border-border shadow-card">
            <p className="font-display font-bold text-ink">Invite friends · earn ₹49 credit</p>
            <p className="text-sm text-ink-muted mt-1">
              When they buy a plan, you get ₹49 bill credit (not cash).
            </p>
            <p className="mt-3 text-xs font-mono text-ink-muted break-all">{inviteLink}</p>
            <p className="text-xs text-accent mt-2">Share code: <strong className="font-mono">{inviteCode}</strong></p>
          </div>
        )}

        {needsPay && (
          <div className="mb-8 p-5 rounded-2xl bg-brand-gradient text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-glow">
            <div>
              <p className="font-display font-bold text-lg">
                {pay === "PENDING" ? "Payment under review" : "Unlock full access"}
              </p>
              <p className="text-sm text-white/90 mt-1">
                {pay === "PENDING"
                  ? "Admin is verifying. Booking & listing unlock after approval."
                  : "Choose a membership plan to book & list."}
              </p>
            </div>
            <Link href={pay === "PENDING" ? "/pay" : "/pricing"} className="shrink-0 px-6 py-2.5 bg-white text-accent text-sm font-bold rounded-full text-center">
              {pay === "PENDING" ? "View status" : "View plans"}
            </Link>
          </div>
        )}

        {pay === "VERIFIED" && (
          <div className="mb-6 p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-900 font-medium">
            ✓ Membership active · booking & listing unlocked
          </div>
        )}

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-ink">Available services</h2>
            <Link href="/find" className="text-sm font-semibold text-accent hover:underline">See all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {SERVICES.map((s) => (
              <Link
                key={s.title}
                href={needsPay ? "/pricing" : s.href}
                className="group relative overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-card hover:shadow-soft transition"
              >
                <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full bg-gradient-to-br ${s.color} opacity-15 group-hover:opacity-25`} />
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-lg`}>{s.emoji}</div>
                <p className="mt-3 font-semibold text-ink text-sm group-hover:text-accent">{s.title}</p>
                <p className="text-[11px] text-ink-muted mt-0.5">{needsPay ? "Plan required" : "Book now"}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-border p-5 shadow-card">
            <p className="text-xs uppercase tracking-wide text-ink-muted">My bookings</p>
            <p className="font-display text-2xl font-bold text-ink mt-1">{clientCount}</p>
          </div>
          <div className="bg-white rounded-2xl border border-border p-5 shadow-card">
            <p className="text-xs uppercase tracking-wide text-ink-muted">Credit</p>
            <p className="font-display text-2xl font-bold text-pink mt-1">₹{credit}</p>
          </div>
          <div className="bg-white rounded-2xl border border-border p-5 shadow-card">
            <p className="text-xs uppercase tracking-wide text-ink-muted">Payment</p>
            <p className="font-display text-lg font-bold text-pink mt-1">{isAdmin ? "Admin" : pay}</p>
          </div>
          <div className="bg-white rounded-2xl border border-border p-5 shadow-card">
            <p className="text-xs uppercase tracking-wide text-ink-muted">Role</p>
            <p className="font-display text-lg font-bold text-ink mt-1">{role}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <Link href={needsPay ? "/pricing" : "/find"} className="bg-white rounded-2xl border border-border p-6 hover:shadow-soft transition shadow-card">
            <h3 className="font-display font-bold text-ink">Find a Saathi</h3>
            <p className="text-sm text-ink-muted mt-1">{needsPay ? "Plan required" : "Browse & book"}</p>
          </Link>
          <Link href="/bookings" className="bg-white rounded-2xl border border-border p-6 hover:shadow-soft transition shadow-card">
            <h3 className="font-display font-bold text-ink">My bookings</h3>
            <p className="text-sm text-ink-muted mt-1">{clientCount} total</p>
          </Link>
          <Link href="/become-saathi" className="rounded-2xl p-6 text-white bg-brand-gradient shadow-glow hover:opacity-95 transition">
            <h3 className="font-display font-bold">{isSaathi ? "Edit Saathi profile" : "Become a Saathi"}</h3>
            <p className="text-sm text-white/80 mt-1">Earn up to ₹2,000/hr</p>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-ink">Recent bookings</h3>
            <Link href="/bookings" className="text-sm font-medium text-accent">View all →</Link>
          </div>
          {recentBookings.length === 0 ? (
            <div className="text-center py-10 text-ink-muted text-sm">
              <p>No bookings yet</p>
              <Link href={needsPay ? "/pricing" : "/find"} className="inline-block mt-4 text-pink font-semibold hover:underline">
                {needsPay ? "Get a plan →" : "Book your first session →"}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-ink">{b.saathiName}</p>
                    <p className="text-sm text-ink-muted">{b.service} · {b.date} · {b.time}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      b.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-800"
                        : b.status === "CANCELLED" ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-800"
                    }`}>{b.status}</span>
                    <span className="font-display font-bold text-ink">₹{b.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

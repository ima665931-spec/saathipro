import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findFirst({
    where: { email: { equals: session.user.email, mode: "insensitive" } },
    include: {
      saathiProfile: true,
      bookingsAsClient: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      bookingsAsSaathi: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!dbUser) {
    redirect("/login");
  }

  const role = dbUser.role || "USER";
  const isSaathi = role === "SAATHI";
  const isAdmin = role === "ADMIN";
  const profile = dbUser.saathiProfile;
  const clientBookings = dbUser.bookingsAsClient || [];
  const saathiBookings = dbUser.bookingsAsSaathi || [];
  const pay = dbUser.paymentStatus || "NONE";
  const needsPay = !isAdmin && pay !== "VERIFIED";

  const [clientCount, saathiCount] = await Promise.all([
    prisma.booking.count({ where: { clientId: dbUser.id } }),
    prisma.booking.count({ where: { saathiId: dbUser.id } }),
  ]);

  const recentBookings = isSaathi
    ? [...saathiBookings, ...clientBookings]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5)
    : clientBookings;

  let servicesList: string[] = [];
  if (profile?.services) {
    try {
      servicesList = JSON.parse(profile.services);
    } catch {
      servicesList = [];
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-cream/90 backdrop-blur border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-cream font-display font-semibold text-sm">
                S
              </div>
              <span className="font-display text-lg font-semibold text-ink tracking-tight">
                SaathiPro
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/find"
                className="hidden sm:inline text-sm font-medium text-ink-muted hover:text-ink"
              >
                Find
              </Link>
              <Link
                href="/bookings"
                className="hidden sm:inline text-sm font-medium text-ink-muted hover:text-ink"
              >
                Bookings
              </Link>
              <Link
                href="/pay"
                className="hidden sm:inline text-sm font-medium text-ink-muted hover:text-ink"
              >
                Pay
              </Link>
              <span className="text-sm text-ink-muted hidden md:inline">
                {dbUser.name || dbUser.email}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm font-medium text-ink-muted hover:text-ink transition"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-accent-light mb-2">
              Account
            </p>
            <h1 className="font-display text-3xl font-semibold text-ink">
              Dashboard
            </h1>
            <p className="text-ink-muted mt-1 text-sm">
              Welcome back
              {dbUser.name ? `, ${dbUser.name.split(" ")[0]}` : ""}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              isSaathi
                ? "bg-ink text-cream"
                : "bg-cream-dark text-ink border border-border"
            }`}
          >
            {isSaathi ? "Saathi" : "Member"}
          </span>
        </div>

        {needsPay && (
          <div className="mb-8 p-5 rounded-2xl border border-amber-100 bg-amber-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-display font-semibold text-amber-950">
                {pay === "PENDING"
                  ? "Payment under review"
                  : "Complete registration — ₹499"}
              </p>
              <p className="text-sm text-amber-900 mt-1">
                {pay === "PENDING"
                  ? "Admin is verifying your payment. Booking unlocks after approval."
                  : "Pay once to unlock booking. Find remains open to browse."}
              </p>
            </div>
            <Link
              href="/pay"
              className="shrink-0 px-5 py-2.5 bg-ink text-cream text-sm font-semibold rounded-full text-center"
            >
              {pay === "PENDING" ? "View status" : "Pay ₹499"}
            </Link>
          </div>
        )}

        {pay === "VERIFIED" && (
          <div className="mb-8 p-4 rounded-2xl border border-emerald-100 bg-emerald-50 text-sm text-emerald-900">
            Registration paid · booking unlocked
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-border p-5 shadow-card">
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              My bookings
            </p>
            <p className="font-display text-2xl font-semibold text-ink mt-1">
              {clientCount}
            </p>
          </div>
          {isSaathi && (
            <div className="bg-white rounded-2xl border border-border p-5 shadow-card">
              <p className="text-xs uppercase tracking-wide text-ink-muted">
                Received
              </p>
              <p className="font-display text-2xl font-semibold text-ink mt-1">
                {saathiCount}
              </p>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-card">
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              Payment
            </p>
            <p className="font-display text-lg font-semibold text-ink mt-1">
              {isAdmin ? "Admin" : pay}
            </p>
          </div>
          {isSaathi && profile ? (
            <div className="bg-white rounded-2xl border border-border p-5 shadow-card">
              <p className="text-xs uppercase tracking-wide text-ink-muted">
                Rate
              </p>
              <p className="font-display text-2xl font-semibold text-ink mt-1">
                ₹{profile.hourlyRate || "—"}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border p-5 shadow-card">
              <p className="text-xs uppercase tracking-wide text-ink-muted">Role</p>
              <p className="font-display text-xl font-semibold text-ink mt-1">
                {role}
              </p>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <Link
            href="/find"
            className="bg-white rounded-2xl border border-border p-6 hover:shadow-soft transition group shadow-card"
          >
            <h3 className="font-display font-semibold text-ink group-hover:text-accent transition">
              Find a Saathi
            </h3>
            <p className="text-sm text-ink-muted mt-1">Browse professionals</p>
          </Link>

          <Link
            href="/bookings"
            className="bg-white rounded-2xl border border-border p-6 hover:shadow-soft transition group shadow-card"
          >
            <h3 className="font-display font-semibold text-ink group-hover:text-accent transition">
              My bookings
            </h3>
            <p className="text-sm text-ink-muted mt-1">{clientCount} total</p>
          </Link>

          {isSaathi ? (
            <Link
              href="/become-saathi"
              className="bg-white rounded-2xl border border-border p-6 hover:shadow-soft transition group shadow-card"
            >
              <h3 className="font-display font-semibold text-ink group-hover:text-accent transition">
                Edit profile
              </h3>
              <p className="text-sm text-ink-muted mt-1">
                {profile?.city || "Update details"}
              </p>
            </Link>
          ) : (
            <Link
              href="/become-saathi"
              className="bg-ink rounded-2xl p-6 text-cream hover:bg-accent transition"
            >
              <h3 className="font-display font-semibold">Become a Saathi</h3>
              <p className="text-sm text-cream/70 mt-1">Earn on your terms</p>
            </Link>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 mb-8 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-ink">
              Your profile
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-ink-muted text-xs uppercase tracking-wide">
                Name
              </span>
              <p className="font-medium text-ink mt-0.5">{dbUser.name || "—"}</p>
            </div>
            <div>
              <span className="text-ink-muted text-xs uppercase tracking-wide">
                Email
              </span>
              <p className="font-medium text-ink mt-0.5">{dbUser.email}</p>
            </div>
            <div>
              <span className="text-ink-muted text-xs uppercase tracking-wide">
                Payment
              </span>
              <p className="font-medium text-ink mt-0.5">{pay}</p>
            </div>
            <div>
              <span className="text-ink-muted text-xs uppercase tracking-wide">
                Role
              </span>
              <p className="font-medium text-ink mt-0.5">{role}</p>
            </div>
            {isSaathi && profile && (
              <>
                <div>
                  <span className="text-ink-muted text-xs uppercase tracking-wide">
                    City
                  </span>
                  <p className="font-medium text-ink mt-0.5">
                    {profile.city || "—"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-ink-muted text-xs uppercase tracking-wide">
                    Bio
                  </span>
                  <p className="font-medium text-ink mt-0.5">{profile.bio || "—"}</p>
                </div>
                {servicesList.length > 0 && (
                  <div className="sm:col-span-2">
                    <span className="text-ink-muted text-xs uppercase tracking-wide">
                      Services
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {servicesList.map((s) => (
                        <span
                          key={s}
                          className="text-xs bg-cream-dark text-ink-muted px-2 py-0.5 rounded-full border border-border"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-ink">
              Recent bookings
            </h3>
            <Link
              href="/bookings"
              className="text-sm font-medium text-ink-muted hover:text-ink"
            >
              View all →
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="text-center py-10 text-ink-muted text-sm">
              <p>No bookings yet</p>
              <Link
                href={needsPay ? "/pay" : "/find"}
                className="inline-block mt-4 text-ink font-medium hover:underline"
              >
                {needsPay ? "Pay ₹499 to unlock booking →" : "Book your first session →"}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
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
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        b.status === "CONFIRMED"
                          ? "bg-emerald-50 text-emerald-800"
                          : b.status === "CANCELLED"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {b.status}
                    </span>
                    <span className="font-display font-semibold text-ink">
                      ₹{b.amount}
                    </span>
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

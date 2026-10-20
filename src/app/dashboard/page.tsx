import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
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
  const profile = dbUser.saathiProfile;
  const clientBookings = dbUser.bookingsAsClient || [];
  const saathiBookings = dbUser.bookingsAsSaathi || [];
  const totalBookings = clientBookings.length; // recent 5 shown; count from length of fetch is limited - get counts separately

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                S
              </div>
              <span className="text-xl font-bold text-gray-900">SaathiPro</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/find"
                className="hidden sm:inline text-sm font-medium text-gray-600 hover:text-violet-600"
              >
                Find Saathi
              </Link>
              <Link
                href="/bookings"
                className="hidden sm:inline text-sm font-medium text-gray-600 hover:text-violet-600"
              >
                Bookings
              </Link>
              <span className="text-sm text-gray-600 hidden md:inline">
                Hi, {dbUser.name || dbUser.email}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-violet-600 transition"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back{dbUser.name ? `, ${dbUser.name.split(" ")[0]}` : ""}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
              isSaathi
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-violet-50 text-violet-700 border border-violet-200"
            }`}
          >
            {isSaathi ? "✓ Saathi" : "Member"}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500">My Bookings</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{clientCount}</p>
          </div>
          {isSaathi && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm text-gray-500">Received Bookings</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{saathiCount}</p>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500">Role</p>
            <p className="text-2xl font-bold text-violet-600 mt-1">{role}</p>
          </div>
          {isSaathi && profile && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm text-gray-500">Hourly Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{profile.hourlyRate || "—"}
              </p>
            </div>
          )}
          {!isSaathi && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-lg font-semibold text-gray-700 mt-1">Active</p>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          <Link
            href="/find"
            className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-violet-200 hover:shadow-md transition group"
          >
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-violet-700">
              Find a Saathi
            </h3>
            <p className="text-sm text-gray-500 mt-1">Browse partners near you</p>
          </Link>

          <Link
            href="/bookings"
            className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-violet-200 hover:shadow-md transition group"
          >
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-violet-700">
              My Bookings
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {clientCount} booking{clientCount !== 1 ? "s" : ""} total
            </p>
          </Link>

          {isSaathi ? (
            <Link
              href="/become-saathi"
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-violet-200 hover:shadow-md transition group"
            >
              <div className="text-3xl mb-3">✏️</div>
              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-violet-700">
                Edit Saathi Profile
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {profile?.city || "Update city, rate, services"}
              </p>
            </Link>
          ) : (
            <Link
              href="/become-saathi"
              className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-6 text-white hover:shadow-lg transition"
            >
              <div className="text-3xl mb-3">🤝</div>
              <h3 className="font-semibold text-lg">Become a Saathi</h3>
              <p className="text-sm text-violet-100 mt-1">
                Earn up to ₹2,000/hour
              </p>
            </Link>
          )}
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-900">Your Profile</h3>
            {!isSaathi && (
              <Link
                href="/become-saathi"
                className="text-sm font-medium text-violet-600 hover:underline"
              >
                Upgrade to Saathi →
              </Link>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Name</span>
              <p className="font-medium text-gray-900 mt-0.5">
                {dbUser.name || "—"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Email</span>
              <p className="font-medium text-gray-900 mt-0.5">{dbUser.email}</p>
            </div>
            <div>
              <span className="text-gray-500">Phone</span>
              <p className="font-medium text-gray-900 mt-0.5">
                {dbUser.phone || "—"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Role</span>
              <p className="font-medium text-gray-900 mt-0.5">{role}</p>
            </div>
            {isSaathi && profile && (
              <>
                <div>
                  <span className="text-gray-500">City</span>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {profile.city || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Verified</span>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {profile.isVerified ? "Yes ✓" : "Pending"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-500">Bio</span>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {profile.bio || "—"}
                  </p>
                </div>
                {profile.services && (
                  <div className="sm:col-span-2">
                    <span className="text-gray-500">Services</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {JSON.parse(profile.services).map((s: string) => (
                        <span
                          key={s}
                          className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full"
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

        {/* Recent bookings */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-900">Recent Bookings</h3>
            <Link
              href="/bookings"
              className="text-sm font-medium text-violet-600 hover:underline"
            >
              View all →
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              <p>No bookings yet</p>
              <Link
                href="/find"
                className="inline-block mt-4 text-violet-600 font-medium text-sm hover:underline"
              >
                Book your first session →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{b.saathiName}</p>
                    <p className="text-sm text-gray-500">
                      {b.service} · {b.date} · {b.time}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        b.status === "CONFIRMED"
                          ? "bg-green-50 text-green-700"
                          : b.status === "CANCELLED"
                          ? "bg-red-50 text-red-600"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {b.status}
                    </span>
                    <span className="font-semibold text-violet-600">
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

import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">S</div>
              <span className="text-xl font-bold text-gray-900">SaathiPro</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Hi, {user.name || user.email}</span>
              <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-violet-600 transition">Logout</button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome to SaathiPro. Your account is ready.</p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="font-semibold text-lg text-gray-900">Find a Saathi</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Browse verified partners near you</p>
            <Link href="/find" className="text-violet-600 font-medium text-sm hover:underline">Explore →</Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="text-3xl mb-3">🤝</div>
            <h3 className="font-semibold text-lg text-gray-900">Become a Saathi</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Start earning by helping others</p>
            <Link href="/become-saathi" className="text-violet-600 font-medium text-sm hover:underline">Apply →</Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-semibold text-lg text-gray-900">My Bookings</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">View your upcoming sessions</p>
            <Link href="/bookings" className="text-violet-600 font-medium text-sm hover:underline">View →</Link>
          </div>
        </div>

        <div className="mt-10 bg-violet-50 rounded-2xl p-6 border border-violet-100">
          <h3 className="font-semibold text-violet-900">Your Profile</h3>
          <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Name:</span> <span className="font-medium">{user.name || "—"}</span></div>
            <div><span className="text-gray-500">Email:</span> <span className="font-medium">{user.email}</span></div>
            <div><span className="text-gray-500">Role:</span> <span className="font-medium">{user.role || "USER"}</span></div>
          </div>
        </div>
      </main>
    </div>
  );
}

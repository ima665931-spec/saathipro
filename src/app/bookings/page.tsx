"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Booking = {
  id: string;
  saathiName: string;
  service: string;
  city: string | null;
  date: string;
  time: string;
  durationHours: number;
  amount: number;
  status: string;
  notes: string | null;
  createdAt: string;
};

export default function BookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/bookings");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/bookings")
        .then((r) => r.json())
        .then((data) => {
          setBookings(data.bookings || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                S
              </div>
              <span className="text-xl font-bold text-gray-900">SaathiPro</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/find" className="text-sm font-medium text-gray-600 hover:text-violet-600">
                Find Saathi
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-violet-600">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="mt-1 text-gray-600">Your upcoming and past sessions</p>
          </div>
          <Link
            href="/find"
            className="px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-full hover:bg-violet-700 transition"
          >
            Book New
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">📅</div>
            <h2 className="text-xl font-semibold text-gray-900">No bookings yet</h2>
            <p className="mt-2 text-gray-500">Find a Saathi and book your first session</p>
            <Link
              href="/find"
              className="inline-block mt-6 px-6 py-2.5 bg-violet-600 text-white font-medium rounded-full hover:bg-violet-700 transition"
            >
              Browse Saathis →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{b.saathiName}</h3>
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
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {b.service}
                    {b.city ? ` · ${b.city}` : ""}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    📅 {b.date} · 🕐 {b.time} · {b.durationHours} hr
                    {b.durationHours > 1 ? "s" : ""}
                  </p>
                  {b.notes && (
                    <p className="text-xs text-gray-400 mt-1">Note: {b.notes}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-violet-600">₹{b.amount}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

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
  hasReview?: boolean;
  isClient?: boolean;
  review?: { rating: number; comment: string | null } | null;
};

export default function BookingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = () => {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((data) => {
        setBookings(data.bookings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/bookings");
      return;
    }
    if (status === "authenticated") load();
  }, [status, router]);

  const submitReview = async (bookingId: string) => {
    setSubmitting(true);
    setMsg("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Failed");
        setSubmitting(false);
        return;
      }
      setReviewingId(null);
      setComment("");
      setRating(5);
      load();
    } catch {
      setMsg("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm("Cancel this booking?")) return;
    setCancellingId(bookingId);
    setMsg("");
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Cancel failed");
        setCancellingId(null);
        return;
      }
      load();
    } catch {
      setMsg("Network error");
    } finally {
      setCancellingId(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-ink-muted text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-cream font-display font-semibold text-sm">
                S
              </div>
              <span className="font-display text-lg font-semibold text-ink tracking-tight">
                SaathiPro
              </span>
            </Link>
            <div className="flex items-center gap-4 text-sm font-medium text-ink-muted">
              <Link href="/find" className="hover:text-ink transition">
                Find
              </Link>
              <Link href="/dashboard" className="hover:text-ink transition">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-accent-light mb-2">
              Account
            </p>
            <h1 className="font-display text-3xl font-semibold text-ink">
              My bookings
            </h1>
            <p className="mt-1 text-ink-muted text-sm">
              Review or cancel sessions here
            </p>
          </div>
          <Link
            href="/find"
            className="px-5 py-2.5 bg-ink text-cream text-sm font-semibold rounded-full hover:bg-accent transition text-center"
          >
            Book new
          </Link>
        </div>

        {msg && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl">
            {msg}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-card">
            <h2 className="font-display text-xl font-semibold text-ink">
              No bookings yet
            </h2>
            <p className="mt-2 text-ink-muted text-sm">
              Find a Saathi and book your first session
            </p>
            <Link
              href="/find"
              className="inline-block mt-6 px-6 py-2.5 bg-ink text-cream font-medium rounded-full hover:bg-accent transition"
            >
              Browse Saathis
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-border p-5 shadow-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display font-semibold text-ink">
                        {b.saathiName}
                      </h3>
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
                    </div>
                    <p className="text-sm text-ink-muted mt-1">
                      {b.service}
                      {b.city ? ` · ${b.city}` : ""}
                    </p>
                    <p className="text-sm text-ink-muted mt-0.5">
                      {b.date} · {b.time} · {b.durationHours} hr
                      {b.durationHours > 1 ? "s" : ""}
                    </p>
                    {b.hasReview && b.review && (
                      <p className="text-sm text-gold mt-1">
                        Your rating: {"★".repeat(b.review.rating)}
                        {b.review.comment ? ` — ${b.review.comment}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="sm:text-right shrink-0 flex flex-col items-start sm:items-end gap-2">
                    <p className="font-display text-xl font-semibold text-ink">
                      ₹{b.amount}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {b.isClient &&
                        b.status === "CONFIRMED" &&
                        !b.hasReview && (
                          <button
                            type="button"
                            onClick={() => cancelBooking(b.id)}
                            disabled={cancellingId === b.id}
                            className="text-sm font-medium text-red-700 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-50 transition disabled:opacity-50"
                          >
                            {cancellingId === b.id ? "Cancelling…" : "Cancel"}
                          </button>
                        )}
                      {b.isClient &&
                        b.status === "CONFIRMED" &&
                        !b.hasReview && (
                          <button
                            type="button"
                            onClick={() =>
                              setReviewingId(
                                reviewingId === b.id ? null : b.id
                              )
                            }
                            className="text-sm font-medium text-ink border border-border px-3 py-1.5 rounded-full hover:bg-cream-dark transition"
                          >
                            {reviewingId === b.id ? "Close" : "Leave review"}
                          </button>
                        )}
                    </div>
                  </div>
                </div>

                {reviewingId === b.id && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          className={`text-2xl ${
                            n <= rating ? "text-gold" : "text-border"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={2}
                      placeholder="Optional comment…"
                      className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-cream/30 focus:outline-none focus:ring-2 focus:ring-accent/20 text-ink"
                    />
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => submitReview(b.id)}
                      className="px-5 py-2 bg-ink text-cream text-sm font-semibold rounded-full hover:bg-accent disabled:opacity-50"
                    >
                      {submitting ? "Saving…" : "Submit review"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

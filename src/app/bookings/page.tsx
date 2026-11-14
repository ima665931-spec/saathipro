"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";
import BookingRulesCard from "@/components/BookingRulesCard";

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

type Tab = "upcoming" | "past";

function statusStyle(status: string) {
  if (status === "CONFIRMED") return "bg-emerald-50 text-emerald-800";
  if (status === "CANCELLED") return "bg-red-50 text-red-700";
  if (status === "COMPLETED") return "bg-violet-50 text-violet-800";
  return "bg-amber-50 text-amber-800";
}

function isPast(b: Booking) {
  if (b.status === "CANCELLED" || b.status === "COMPLETED") return true;
  // date is typically YYYY-MM-DD
  const d = Date.parse(b.date);
  if (!Number.isNaN(d)) {
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    return end.getTime() < Date.now();
  }
  return false;
}

export default function BookingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

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

  const pendingReview = bookings.filter(
    (b) => b.isClient && b.status === "CONFIRMED" && !b.hasReview && isPast(b)
  );

  const upcoming = useMemo(
    () => bookings.filter((b) => !isPast(b) && b.status !== "CANCELLED"),
    [bookings]
  );
  const past = useMemo(
    () => bookings.filter((b) => isPast(b) || b.status === "CANCELLED"),
    [bookings]
  );
  const shown = tab === "upcoming" ? upcoming : past;

  const submitReview = async (bookingId: string) => {
    setSubmitting(true);
    setMsg("");
    setOkMsg("");
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
      setOkMsg("Thanks — review published.");
      load();
    } catch {
      setMsg("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (
      !confirm(
        "Cancel this booking? Prefer 6+ hours notice. You can book a new slot afterward."
      )
    )
      return;
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
      <div className="py-16 text-center text-sm text-ink-muted">Loading bookings…</div>
    );
  }

  return (
    <div className="pb-2">
      <div className="hidden md:block -mx-4 mb-4">
        <BrandHeader active="bookings" />
      </div>

      {/* Segmented control */}
      <div className="flex rounded-2xl bg-white border border-border p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setTab("upcoming")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
            tab === "upcoming"
              ? "bg-brand-gradient text-white shadow-sm"
              : "text-ink-muted"
          }`}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("past")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
            tab === "past" ? "bg-brand-gradient text-white shadow-sm" : "text-ink-muted"
          }`}
        >
          Past ({past.length})
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-ink-muted">Chat, review or cancel here</p>
        <Link
          href="/find"
          className="text-xs font-bold text-white bg-brand-gradient px-3 py-1.5 rounded-full"
        >
          Book new
        </Link>
      </div>

      {pendingReview.length > 0 && tab === "past" && (
        <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-100 text-xs text-amber-900">
          <strong>{pendingReview.length}</strong> session
          {pendingReview.length > 1 ? "s" : ""} waiting for your review.
        </div>
      )}

      {msg && (
        <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl">{msg}</div>
      )}
      {okMsg && (
        <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl">{okMsg}</div>
      )}

      <div className="mt-4 space-y-3">
        {shown.length === 0 ? (
          <div className="rounded-2xl bg-white border border-border p-8 text-center shadow-card">
            <p className="font-semibold text-ink text-sm">
              {tab === "upcoming" ? "No upcoming bookings" : "No past bookings"}
            </p>
            <p className="text-xs text-ink-muted mt-1">
              {tab === "upcoming"
                ? "Find a Saathi and book your first session."
                : "Completed and cancelled sessions show here."}
            </p>
            {tab === "upcoming" && (
              <Link
                href="/find"
                className="inline-block mt-4 text-xs font-bold text-white bg-brand-gradient px-4 py-2 rounded-full"
              >
                Browse Saathis
              </Link>
            )}
          </div>
        ) : (
          shown.map((b) => (
            <article
              key={b.id}
              className="rounded-2xl bg-white border border-border p-4 shadow-card"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-ink text-sm truncate">{b.saathiName}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle(
                        b.status
                      )}`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    {b.service}
                    {b.city ? ` · ${b.city}` : ""}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {b.date} · {b.time} · {b.durationHours} hr
                    {b.durationHours > 1 ? "s" : ""}
                  </p>
                  {b.hasReview && b.review && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      Your rating: {"★".repeat(b.review.rating)}
                    </p>
                  )}
                </div>
                <p className="text-sm font-bold text-violet-700 shrink-0">₹{b.amount}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {b.status !== "CANCELLED" && (
                  <Link
                    href={`/chat/${b.id}`}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full border border-border text-ink"
                  >
                    Chat
                  </Link>
                )}
                {(b.status === "CONFIRMED" || b.status === "PENDING") && !isPast(b) && (
                  <button
                    type="button"
                    disabled={cancellingId === b.id}
                    onClick={() => cancelBooking(b.id)}
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full text-red-600 border border-red-100 disabled:opacity-50"
                  >
                    {cancellingId === b.id ? "Cancelling…" : "Cancel"}
                  </button>
                )}
                {b.isClient && b.status === "CONFIRMED" && !b.hasReview && (
                  <button
                    type="button"
                    onClick={() => setReviewingId(reviewingId === b.id ? null : b.id)}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full text-white bg-brand-gradient"
                  >
                    {reviewingId === b.id ? "Close" : "★ Review"}
                  </button>
                )}
              </div>

              {reviewingId === b.id && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <p className="text-xs font-semibold text-ink">How was your session?</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        className={`text-xl ${n <= rating ? "text-amber-400" : "text-border"}`}
                        aria-label={`${n} stars`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="Optional comment…"
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-cream/50 text-ink"
                  />
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => submitReview(b.id)}
                    className="text-xs font-bold px-4 py-2 rounded-full text-white bg-brand-gradient disabled:opacity-50"
                  >
                    {submitting ? "Saving…" : "Submit review"}
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </div>

      <div className="mt-6">
        <BookingRulesCard compact />
      </div>
    </div>
  );
}

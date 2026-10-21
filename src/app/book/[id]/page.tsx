"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const DUMMY_SAATHIS: Record<
  string,
  {
    id: string;
    name: string;
    city: string;
    services: string[];
    rate: number;
    rating: number;
    bio: string;
  }
> = {
  "1": {
    id: "1",
    name: "Priya Sharma",
    city: "Delhi",
    services: ["Movie Partner", "Coffee Partner", "Hanging Out"],
    rate: 1500,
    rating: 4.9,
    bio: "Friendly and professional. Love movies and deep conversations.",
  },
  "2": {
    id: "2",
    name: "Anjali Mehta",
    city: "Mumbai",
    services: ["Clubbing", "Event Partner", "Hanging Out"],
    rate: 2000,
    rating: 4.8,
    bio: "Nightlife expert. Safe and fun companion for parties and events.",
  },
  "3": {
    id: "3",
    name: "Sneha Reddy",
    city: "Bangalore",
    services: ["Elder Care", "Medical Support", "Shopping Buddy"],
    rate: 1200,
    rating: 5.0,
    bio: "Patient and caring. Experienced in elder care and hospital visits.",
  },
  "4": {
    id: "4",
    name: "Kavita Patel",
    city: "Pune",
    services: ["Travel Partner", "City Tour Partner", "Coffee Partner"],
    rate: 1800,
    rating: 4.7,
    bio: "Love exploring cities. Great for local tours and travel companionship.",
  },
  "5": {
    id: "5",
    name: "Riya Kapoor",
    city: "Delhi",
    services: ["Shopping Buddy", "Cafe & Food Partner", "Hanging Out"],
    rate: 1400,
    rating: 4.8,
    bio: "Fashion and food enthusiast. Perfect shopping and cafe buddy.",
  },
  "6": {
    id: "6",
    name: "Neha Singh",
    city: "Mumbai",
    services: ["Movie Partner", "Concert Partner", "Event Partner"],
    rate: 1600,
    rating: 4.9,
    bio: "Movie buff and music lover. Always up for a good film or concert.",
  },
  "7": {
    id: "7",
    name: "Pooja Iyer",
    city: "Bangalore",
    services: ["Professional Networking Partner", "Coffee Partner", "Hanging Out"],
    rate: 1500,
    rating: 4.6,
    bio: "Startup enthusiast. Great for brainstorming and professional chats.",
  },
  "8": {
    id: "8",
    name: "Meera Joshi",
    city: "Hyderabad",
    services: ["Elder Care", "Domestic Help", "Shopping Buddy"],
    rate: 1100,
    rating: 4.9,
    bio: "Warm and reliable. Specialized in senior care and daily support.",
  },
};

const TIME_SLOTS = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
];

type SaathiInfo = {
  id: string;
  name: string;
  city: string;
  services: string[];
  rate: number;
  rating: number;
  bio: string;
};

export default function BookPage() {
  const params = useParams();
  const id = String(params.id || "");
  const { data: session, status } = useSession();
  const router = useRouter();

  const [saathi, setSaathi] = useState<SaathiInfo | null>(
    DUMMY_SAATHIS[id] || null
  );
  const [resolved, setResolved] = useState(!!DUMMY_SAATHIS[id]);
  const [payStatus, setPayStatus] = useState<string | null>(null);

  const [service, setService] = useState(DUMMY_SAATHIS[id]?.services[0] || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (DUMMY_SAATHIS[id]) return;
    fetch("/api/saathis")
      .then((r) => r.json())
      .then((data) => {
        const found = (data.saathis || []).find(
          (s: SaathiInfo) => s.id === id
        );
        if (found) {
          setSaathi(found);
          setService(found.services?.[0] || "Hanging Out");
        }
      })
      .catch(() => {})
      .finally(() => setResolved(true));
  }, [id]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/payments")
      .then((r) => r.json())
      .then((d) => setPayStatus(d.paymentStatus || "NONE"))
      .catch(() => setPayStatus("NONE"));
  }, [status]);

  const total = useMemo(
    () => (saathi ? saathi.rate * duration : 0),
    [saathi, duration]
  );

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  const needsPay =
    status === "authenticated" &&
    payStatus !== null &&
    payStatus !== "VERIFIED";

  const avatar = saathi
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
        saathi.name
      )}&background=5b4a3f&color=fff&size=128&font-size=0.4`
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!session?.user) {
      router.push(`/login?callbackUrl=/book/${id}`);
      return;
    }
    if (needsPay) {
      router.push("/pay");
      return;
    }
    if (!saathi || !date || !time || !service) {
      setError("Please fill date, time and service");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saathiId: saathi.id,
          saathiName: saathi.name,
          service,
          city: saathi.city,
          date,
          time,
          durationHours: duration,
          amount: total,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402 || data.code === "PAYMENT_REQUIRED" || data.code === "PENDING") {
          router.push("/pay");
          return;
        }
        setError(data.error || "Booking failed");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/bookings"), 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || (!resolved && !saathi)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-ink-muted text-sm">Loading…</div>
      </div>
    );
  }

  if (!saathi) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="text-center">
          <h1 className="font-display text-xl font-semibold text-ink">
            Saathi not found
          </h1>
          <Link
            href="/find"
            className="mt-4 inline-block text-sm font-medium text-ink-muted hover:text-ink"
          >
            ← Back to Find
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="bg-white rounded-2xl border border-border shadow-soft p-10 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-ink text-cream flex items-center justify-center mx-auto text-lg">
            ✓
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
            Booking confirmed
          </h1>
          <p className="mt-2 text-ink-muted text-sm">
            Session with {saathi.name} is booked. Redirecting…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-cream font-display font-semibold text-sm">
                S
              </div>
              <span className="font-display text-lg font-semibold text-ink tracking-tight">
                SaathiPro
              </span>
            </Link>
            <Link
              href={`/saathi/${id}`}
              className="text-sm font-medium text-ink-muted hover:text-ink"
            >
              ← Profile
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-xs font-semibold tracking-widest uppercase text-accent-light mb-2">
          Booking
        </p>
        <h1 className="font-display text-3xl font-semibold text-ink mb-8">
          Book a session
        </h1>

        <div className="bg-white rounded-2xl border border-border p-5 mb-6 flex items-center gap-4 shadow-card">
          <img
            src={avatar}
            alt={saathi.name}
            className="w-16 h-16 rounded-xl object-cover shrink-0"
          />
          <div>
            <h2 className="font-display font-semibold text-lg text-ink">
              {saathi.name}
            </h2>
            <p className="text-sm text-ink-muted">
              {saathi.city} · ★ {saathi.rating} · ₹{saathi.rate}/hr
            </p>
          </div>
        </div>

        {!session && (
          <div className="mb-6 p-4 bg-cream-dark border border-border rounded-xl text-ink text-sm">
            Please{" "}
            <Link
              href={`/login?callbackUrl=/book/${id}`}
              className="font-semibold underline"
            >
              sign in
            </Link>{" "}
            to complete booking.
          </div>
        )}

        {needsPay && (
          <div className="mb-6 p-5 bg-amber-50 border border-amber-100 rounded-2xl">
            <p className="font-display font-semibold text-amber-950">
              {payStatus === "PENDING"
                ? "Payment under review"
                : "Registration fee required"}
            </p>
            <p className="text-sm text-amber-900 mt-1">
              {payStatus === "PENDING"
                ? "Admin is verifying your ₹499 payment. Booking unlocks after approval."
                : "Pay ₹499 once to unlock booking on SaathiPro."}
            </p>
            <Link
              href="/pay"
              className="inline-block mt-3 px-5 py-2.5 bg-ink text-cream text-sm font-semibold rounded-full"
            >
              {payStatus === "PENDING" ? "View payment status" : "Pay ₹499 now"}
            </Link>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-5"
        >
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
              {error}
              {(error.includes("499") || error.includes("Payment")) && (
                <Link href="/pay" className="block mt-2 font-semibold underline">
                  Go to payment →
                </Link>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Service
            </label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              required
              disabled={needsPay}
              className="w-full px-4 py-3 border border-border rounded-xl bg-cream/30 focus:outline-none focus:ring-2 focus:ring-accent/20 text-ink disabled:opacity-50"
            >
              {(saathi.services?.length
                ? saathi.services
                : ["Hanging Out"]
              ).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Date
              </label>
              <input
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={needsPay}
                className="w-full px-4 py-3 border border-border rounded-xl bg-cream/30 focus:outline-none focus:ring-2 focus:ring-accent/20 text-ink disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Time
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                disabled={needsPay}
                className="w-full px-4 py-3 border border-border rounded-xl bg-cream/30 focus:outline-none focus:ring-2 focus:ring-accent/20 text-ink disabled:opacity-50"
              >
                <option value="">Select time</option>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Duration
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setDuration(h)}
                  disabled={needsPay}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    duration === h
                      ? "bg-ink text-cream"
                      : "bg-cream-dark text-ink-muted hover:text-ink border border-border"
                  } disabled:opacity-50`}
                >
                  {h} hr{h > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={needsPay}
              placeholder="Preferences or special requests…"
              className="w-full px-4 py-3 border border-border rounded-xl bg-cream/30 focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none text-ink disabled:opacity-50"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <p className="text-xs text-ink-muted uppercase tracking-wide">
                Total
              </p>
              <p className="font-display text-2xl font-semibold text-ink">
                ₹{total}
              </p>
            </div>
            {needsPay ? (
              <Link
                href="/pay"
                className="px-8 py-3.5 bg-ink hover:bg-accent text-cream font-semibold rounded-xl transition"
              >
                Pay ₹499 to book
              </Link>
            ) : (
              <button
                type="submit"
                disabled={loading || !session}
                className="px-8 py-3.5 bg-ink hover:bg-accent text-cream font-semibold rounded-xl transition disabled:opacity-50"
              >
                {loading
                  ? "Booking…"
                  : session
                  ? "Confirm booking"
                  : "Sign in to book"}
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}

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
    bio: "Friendly and professional.",
  },
  "2": {
    id: "2",
    name: "Anjali Mehta",
    city: "Mumbai",
    services: ["Clubbing", "Event Partner", "Hanging Out"],
    rate: 2000,
    rating: 4.8,
    bio: "Nightlife expert.",
  },
  "3": {
    id: "3",
    name: "Sneha Reddy",
    city: "Bangalore",
    services: ["Elder Care", "Medical Support", "Shopping Buddy"],
    rate: 1200,
    rating: 5.0,
    bio: "Patient and caring.",
  },
  "4": {
    id: "4",
    name: "Kavita Patel",
    city: "Pune",
    services: ["Travel Partner", "City Tour Partner", "Coffee Partner"],
    rate: 1800,
    rating: 4.7,
    bio: "Love exploring cities.",
  },
  "5": {
    id: "5",
    name: "Riya Kapoor",
    city: "Delhi",
    services: ["Shopping Buddy", "Cafe & Food Partner", "Hanging Out"],
    rate: 1400,
    rating: 4.8,
    bio: "Fashion and food enthusiast.",
  },
  "6": {
    id: "6",
    name: "Neha Singh",
    city: "Mumbai",
    services: ["Movie Partner", "Concert Partner", "Event Partner"],
    rate: 1600,
    rating: 4.9,
    bio: "Movie buff and music lover.",
  },
  "7": {
    id: "7",
    name: "Pooja Iyer",
    city: "Bangalore",
    services: ["Professional Networking Partner", "Coffee Partner", "Hanging Out"],
    rate: 1500,
    rating: 4.6,
    bio: "Startup enthusiast.",
  },
  "8": {
    id: "8",
    name: "Meera Joshi",
    city: "Hyderabad",
    services: ["Elder Care", "Domestic Help", "Shopping Buddy"],
    rate: 1100,
    rating: 4.9,
    bio: "Warm and reliable.",
  },
};

const TIME_SLOTS = [
  "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM",
  "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM",
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

  const [saathi, setSaathi] = useState<SaathiInfo | null>(DUMMY_SAATHIS[id] || null);
  const [resolved, setResolved] = useState(!!DUMMY_SAATHIS[id]);

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
        const found = (data.saathis || []).find((s: SaathiInfo) => s.id === id);
        if (found) {
          setSaathi(found);
          setService(found.services?.[0] || "Hanging Out");
        }
      })
      .catch(() => {})
      .finally(() => setResolved(true));
  }, [id]);

  const total = useMemo(() => (saathi ? saathi.rate * duration : 0), [saathi, duration]);

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  const avatar = saathi
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(saathi.name)}&background=5b4a3f&color=fff&size=128&font-size=0.4`
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!session?.user) {
      router.push(`/login?callbackUrl=/book/${id}`);
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
          <h1 className="font-display text-xl font-semibold text-ink">Saathi not found</h1>
          <Link href="/find" className="mt-4 inline-block text-sm font-medium text-ink-muted hover:text-ink">
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
          <div className="w-12 h-12 rounded-full bg-ink text-cream flex items-center justify-center mx-auto text-lg">✓</div>
          <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Booking confirmed</h1>
          <p className="mt-2 text-ink-muted text-sm">Session with {saathi.name} is booked. Redirecting…</p>
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
              <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-cream font-display font-semibold text-sm">S</div>
              <span className="font-display text-lg font-semibold text-ink tracking-tight">SaathiPro</span>
            </Link>
            <Link href={`/saathi/${id}`} className="text-sm font-medium text-ink-muted hover:text-ink">← Profile</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-xs font-semibold tracking-widest uppercase text-accent-light mb-2">Booking</p>
        <h1 className="font-display text-3xl font-semibold text-ink mb-8">Book a session</h1>

        <div className="bg-white rounded-2xl border border-border p-5 mb-6 flex items-center gap-4 shadow-card">
          <img src={avatar} alt={saathi.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
          <div>
            <h2 className="font-display font-semibold text-lg text-ink">{saathi.name}</h2>
            <p className="text-sm text-ink-muted">{saathi.city} · ★ {saathi.rating} · ₹{saathi.rate}/hr</p>
          </div>
        </div>

        {!session && (
          <div className="mb-6 p-4 bg-cream-dark border border-border rounded-xl text-ink text-sm">
            Please{" "}
            <Link href={`/login?callbackUrl=/book/${id}`} className="font-semibold underline">sign in</Link>{" "}
            to complete booking. Free for clients.
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Service</label>
            <select value={service} onChange={(e) => setService(e.target.value)} required className="w-full px-4 py-3 border border-border rounded-xl bg-cream/30 text-ink">
              {(saathi.services?.length ? saathi.services : ["Hanging Out"]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Date</label>
              <input type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-4 py-3 border border-border rounded-xl bg-cream/30 text-ink" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Time</label>
              <select value={time} onChange={(e) => setTime(e.target.value)} required className="w-full px-4 py-3 border border-border rounded-xl bg-cream/30 text-ink">
                <option value="">Select time</option>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Duration</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((h) => (
                <button key={h} type="button" onClick={() => setDuration(h)} className={`px-4 py-2 rounded-xl text-sm font-medium ${
                  duration === h ? "bg-ink text-cream" : "bg-cream-dark text-ink-muted border border-border"
                }`}>{h} hr{h > 1 ? "s" : ""}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Preferences…" className="w-full px-4 py-3 border border-border rounded-xl bg-cream/30 resize-none text-ink" />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <p className="text-xs text-ink-muted uppercase tracking-wide">Total</p>
              <p className="font-display text-2xl font-semibold text-ink">₹{total}</p>
            </div>
            <button type="submit" disabled={loading || !session} className="px-8 py-3.5 bg-ink hover:bg-accent text-cream font-semibold rounded-xl disabled:opacity-50">
              {loading ? "Booking…" : session ? "Confirm booking" : "Sign in to book"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

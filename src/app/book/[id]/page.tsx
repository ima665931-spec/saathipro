"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";

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

type FreeSlot = { id: string; date: string; time: string };

export default function BookPage() {
  const params = useParams();
  const id = String(params.id || "");
  const { data: session, status } = useSession();
  const router = useRouter();

  const [saathi, setSaathi] = useState<SaathiInfo | null>(null);
  const [resolved, setResolved] = useState(false);
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slotId, setSlotId] = useState("");
  const [duration, setDuration] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [planActive, setPlanActive] = useState<boolean | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [hasSchedule, setHasSchedule] = useState(false);
  const [freeSlots, setFreeSlots] = useState<FreeSlot[]>([]);

  useEffect(() => {
    if (!id) {
      setResolved(true);
      return;
    }
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

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/payments")
      .then((r) => r.json())
      .then((d) => {
        setPaymentStatus(d.paymentStatus || "NONE");
        setPlanActive(!!d.active);
      })
      .catch(() => {
        setPlanActive(false);
        setPaymentStatus("NONE");
      });
  }, [status]);

  useEffect(() => {
    if (!id) return;
    const q = date
      ? `/api/slots?saathiId=${encodeURIComponent(id)}&date=${encodeURIComponent(date)}`
      : `/api/slots?saathiId=${encodeURIComponent(id)}`;
    fetch(q)
      .then((r) => r.json())
      .then((d) => {
        setHasSchedule(!!d.hasSchedule);
        setFreeSlots(d.slots || []);
        setTime("");
        setSlotId("");
      })
      .catch(() => {
        setHasSchedule(false);
        setFreeSlots([]);
      });
  }, [id, date]);

  const needsPay =
    status === "authenticated" &&
    planActive !== null &&
    planActive === false;

  const total = useMemo(() => (saathi ? saathi.rate * duration : 0), [saathi, duration]);
  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);
  const avatar = saathi
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(saathi.name)}&background=7c3aed&color=fff&size=128&font-size=0.4`
    : "";

  const timeOptions = hasSchedule
    ? freeSlots.filter((s) => !date || s.date === date).map((s) => s.time)
    : TIME_SLOTS;

  const onPickTime = (t: string) => {
    setTime(t);
    const match = freeSlots.find(
      (s) => s.time === t && (!date || s.date === date)
    );
    setSlotId(match?.id || "");
    if (match && !date) setDate(match.date);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!session?.user) {
      router.push(`/login?callbackUrl=/book/${id}`);
      return;
    }
    if (needsPay) {
      router.push("/pricing");
      return;
    }
    if (!saathi || !date || !time || !service) {
      setError("Fill date, time and service");
      return;
    }
    if (hasSchedule && timeOptions.length === 0) {
      setError("No open slots on this date — try another day");
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
          slotId: slotId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.redirect === "/pricing" || data.redirect === "/pay" || res.status === 402) {
          router.push("/pricing");
          return;
        }
        setError(data.error || "Booking failed");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/bookings"), 2000);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || !resolved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-soft text-ink-muted text-sm">
        Loading…
      </div>
    );
  }

  if (!saathi) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-soft px-4">
        <div className="text-center">
          <h1 className="font-display text-xl font-bold text-ink">Saathi not found</h1>
          <p className="text-sm text-ink-muted mt-2">Only live verified profiles can be booked.</p>
          <Link href="/find" className="mt-4 inline-block text-accent font-medium">
            ← Back to Find
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-soft px-4">
        <div className="bg-white rounded-2xl border border-border shadow-soft p-10 text-center max-w-md">
          <div className="w-14 h-14 rounded-full bg-brand-gradient text-white flex items-center justify-center mx-auto text-xl">✓</div>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">Booking confirmed</h1>
          <p className="mt-2 text-ink-muted text-sm">Session with {saathi.name} booked.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-soft">
      <BrandHeader />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-xs font-bold tracking-widest uppercase text-pink mb-2">Booking</p>
        <h1 className="font-display text-3xl font-bold text-ink mb-8">Book a session</h1>

        {needsPay && (
          <div className="mb-6 p-4 rounded-2xl bg-brand-gradient text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm font-medium">
              {paymentStatus === "PENDING"
                ? "Payment under review — booking unlocks after approval."
                : "Active membership required to book."}
            </p>
            <Link
              href={paymentStatus === "PENDING" ? "/pay" : "/pricing"}
              className="px-5 py-2 bg-white text-accent text-sm font-bold rounded-full text-center"
            >
              {paymentStatus === "PENDING" ? "View status" : "View plans"}
            </Link>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-border p-5 mb-6 flex items-center gap-4 shadow-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt={saathi.name} className="w-16 h-16 rounded-xl object-cover" />
          <div>
            <h2 className="font-display font-bold text-lg text-ink">{saathi.name}</h2>
            <p className="text-sm text-ink-muted">
              {saathi.city} · ★ {saathi.rating} · ₹{saathi.rate}/hr
            </p>
          </div>
        </div>

        {!session && (
          <div className="mb-6 p-4 bg-pink-soft border border-border rounded-xl text-sm">
            <Link href={`/login?callbackUrl=/book/${id}`} className="font-semibold text-accent underline">
              Sign in
            </Link>{" "}
            to book.
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Service</label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              required
              className="w-full px-4 py-3 border border-border rounded-xl bg-cream/50"
            >
              {(saathi.services?.length ? saathi.services : ["Hanging Out"]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Date</label>
              <input
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-3 border border-border rounded-xl bg-cream/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Time{hasSchedule ? " (open only)" : ""}
              </label>
              <select
                value={time}
                onChange={(e) => onPickTime(e.target.value)}
                required
                className="w-full px-4 py-3 border border-border rounded-xl bg-cream/50"
              >
                <option value="">Select</option>
                {timeOptions.length === 0 && hasSchedule ? (
                  <option value="" disabled>
                    No open slots this day
                  </option>
                ) : (
                  timeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Duration</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setDuration(h)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    duration === h ? "btn-brand" : "bg-white border border-border text-ink-muted"
                  }`}
                >
                  {h} hr
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-border rounded-xl bg-cream/50"
            />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <p className="text-xs text-ink-muted uppercase">Total</p>
              <p className="font-display text-2xl font-bold text-brand-gradient">₹{total}</p>
            </div>
            <button
              type="submit"
              disabled={loading || !session || needsPay}
              className="px-8 py-3.5 btn-brand rounded-xl disabled:opacity-50"
            >
              {loading
                ? "Booking…"
                : needsPay
                  ? "Plan required"
                  : session
                    ? "Confirm booking"
                    : "Sign in"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

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

type Slot = {
  id: string;
  date: string;
  time: string;
  isBooked: boolean;
};

export default function AvailabilityManager() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [date, setDate] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/slots?mine=1")
      .then((r) => r.json())
      .then((d) => setSlots(d.slots || []))
      .catch(() => setErr("Could not load slots"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleTime = (t: string) => {
    setPicked((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const addSlots = async () => {
    setErr("");
    setMsg("");
    if (!date || picked.length === 0) {
      setErr("Pick a date and at least one time");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, times: picked }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Failed");
        return;
      }
      setMsg(`Added ${data.created} slot(s)`);
      setPicked([]);
      load();
    } catch {
      setErr("Network error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setErr("");
    try {
      const res = await fetch("/api/slots", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Failed");
        return;
      }
      load();
    } catch {
      setErr("Network error");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">Availability</h2>
        <p className="text-sm text-ink-muted mt-1">
          Open times clients can book. If you add any slots, only those times are
          bookable. Leave empty to allow any standard time.
        </p>
      </div>

      {err && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl">{err}</div>
      )}
      {msg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-sm rounded-xl">
          {msg}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Date</label>
        <input
          type="date"
          min={minDate}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3 border border-border rounded-xl bg-cream/50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-2">Times</label>
        <div className="flex flex-wrap gap-2">
          {TIME_SLOTS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTime(t)}
              className={`px-3 py-1.5 rounded-full text-sm ${
                picked.includes(t)
                  ? "btn-brand"
                  : "bg-white border border-border text-ink-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={addSlots}
        disabled={saving}
        className="w-full py-3 btn-brand rounded-xl disabled:opacity-50 text-sm font-semibold"
      >
        {saving ? "Saving…" : "Add open slots"}
      </button>

      <div className="pt-2 border-t border-border">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-2">
          Upcoming
        </p>
        {loading ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-ink-muted">No slots yet — open schedule optional.</p>
        ) : (
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {slots.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between text-sm gap-2 py-1.5 border-b border-border last:border-0"
              >
                <span className="text-ink">
                  {s.date} · {s.time}
                  {s.isBooked && (
                    <span className="ml-2 text-[10px] font-bold uppercase text-amber-700">
                      booked
                    </span>
                  )}
                </span>
                {!s.isBooked && (
                  <button
                    type="button"
                    onClick={() => remove(s.id)}
                    className="text-xs text-red-600 font-medium"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

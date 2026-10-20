"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Tab = "stats" | "users" | "saathis" | "bookings" | "reviews" | "payments";

export default function AdminPage() {
  const { status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [saathis, setSaathis] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async (section: Tab, search = "") => {
    setLoading(true);
    setError("");
    try {
      const url = `/api/admin?section=${section}${search ? `&q=${encodeURIComponent(search)}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Access denied");
        setLoading(false);
        return;
      }
      if (section === "stats") setStats(data.stats);
      if (section === "users") setUsers(data.users || []);
      if (section === "saathis") setSaathis(data.saathis || []);
      if (section === "bookings") setBookings(data.bookings || []);
      if (section === "reviews") setReviews(data.reviews || []);
      if (section === "payments") setPayments(data.payments || []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin");
      return;
    }
    if (status === "authenticated") load(tab, q);
  }, [status, tab, router, load]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (body: Record<string, unknown>) => {
    setBusy(String(body.action));
    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed");
      } else {
        await load(tab, q);
      }
    } catch {
      alert("Network error");
    } finally {
      setBusy("");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream text-ink-muted text-sm">
        Loading…
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "stats", label: "Overview" },
    { id: "payments", label: "Payments" },
    { id: "users", label: "Users" },
    { id: "saathis", label: "Saathis" },
    { id: "bookings", label: "Bookings" },
    { id: "reviews", label: "Reviews" },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-50 bg-ink text-cream border-b border-ink">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-display font-semibold tracking-tight">
              SaathiPro
            </Link>
            <span className="text-xs bg-cream/20 px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
          <Link href="/dashboard" className="text-sm text-cream/70 hover:text-cream">
            Dashboard →
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-ink mb-6">
          Control panel
        </h1>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                tab === t.id
                  ? "bg-ink text-cream"
                  : "bg-white border border-border text-ink-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
            {error}
            <p className="mt-2 text-xs">
              Set <code className="bg-red-100 px-1">ADMIN_EMAILS</code> in
              Vercel to your login email, or role = ADMIN.
            </p>
          </div>
        )}

        {loading && <p className="text-ink-muted text-sm py-10">Loading…</p>}

        {!loading && tab === "stats" && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Users", stats.users],
              ["Saathis", stats.saathis],
              ["Bookings", stats.bookings],
              ["Reviews", stats.reviews],
              ["Booking revenue (₹)", stats.revenue],
              ["Active bookings", stats.activeBookings],
              ["Verified Saathis", stats.verified],
              ["Pending payments", stats.pendingPay],
              ["Banned", stats.banned],
            ].map(([label, val]) => (
              <div
                key={String(label)}
                className="bg-white border border-border rounded-2xl p-5 shadow-card"
              >
                <p className="text-xs uppercase tracking-wide text-ink-muted">
                  {label}
                </p>
                <p className="font-display text-2xl font-semibold text-ink mt-1">
                  {val}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* PAYMENTS */}
        {!loading && tab === "payments" && (
          <div className="space-y-4">
            <p className="text-sm text-ink-muted">
              ₹499 registration — check UTR in your UPI app, then Approve or
              Reject.
            </p>
            {payments.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-border rounded-2xl p-4 shadow-card"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">
                      {p.user?.name || "—"}{" "}
                      <span
                        className={`text-xs font-normal ${
                          p.status === "PENDING"
                            ? "text-amber-700"
                            : p.status === "APPROVED"
                            ? "text-emerald-700"
                            : "text-red-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    </p>
                    <p className="text-sm text-ink-muted">{p.user?.email}</p>
                    <p className="text-sm text-ink mt-1">
                      UTR: <span className="font-mono">{p.utr || "—"}</span> ·
                      ₹{p.amount}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {new Date(p.createdAt).toLocaleString("en-IN")}
                    </p>
                    {p.screenshot && (
                      <a
                        href={p.screenshot}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-2"
                      >
                        <img
                          src={p.screenshot}
                          alt="Screenshot"
                          className="max-h-32 rounded-lg border border-border"
                        />
                      </a>
                    )}
                  </div>
                  {p.status === "PENDING" && (
                    <div className="flex flex-col gap-1.5">
                      <Btn
                        onClick={() =>
                          act({ action: "approve_payment", paymentId: p.id })
                        }
                        label="Approve ✓"
                      />
                      <Btn
                        onClick={() =>
                          act({ action: "reject_payment", paymentId: p.id })
                        }
                        label="Reject"
                        danger
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <p className="text-ink-muted text-sm">No payment submissions</p>
            )}
          </div>
        )}

        {!loading && tab === "users" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name or email…"
                className="flex-1 px-4 py-2 border border-border rounded-xl bg-white text-sm"
              />
              <button
                type="button"
                onClick={() => load("users", q)}
                className="px-4 py-2 bg-ink text-cream rounded-xl text-sm font-medium"
              >
                Search
              </button>
            </div>
            {users.map((u) => (
              <div
                key={u.id}
                className="bg-white border border-border rounded-2xl p-4 shadow-card"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">
                      {u.name || "—"}{" "}
                      {u.isBanned && (
                        <span className="text-xs text-red-600">BANNED</span>
                      )}{" "}
                      <span className="text-xs text-ink-muted">
                        pay:{u.paymentStatus || "NONE"}
                      </span>
                    </p>
                    <p className="text-sm text-ink-muted">{u.email}</p>
                    <p className="text-xs text-ink-muted mt-1">
                      Role: {u.role} · Bookings:{" "}
                      {u._count?.bookingsAsClient || 0}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {!u.isBanned ? (
                      <Btn
                        onClick={() => act({ action: "ban_user", userId: u.id })}
                        label="Ban"
                        danger
                      />
                    ) : (
                      <Btn
                        onClick={() =>
                          act({ action: "unban_user", userId: u.id })
                        }
                        label="Unban"
                      />
                    )}
                    <Btn
                      onClick={() =>
                        act({ action: "set_role", userId: u.id, role: "USER" })
                      }
                      label="→ User"
                    />
                    <Btn
                      onClick={() =>
                        act({ action: "promote_to_saathi", userId: u.id })
                      }
                      label="→ Saathi"
                    />
                    <Btn
                      onClick={() =>
                        act({ action: "set_role", userId: u.id, role: "ADMIN" })
                      }
                      label="→ Admin"
                    />
                    <Btn
                      onClick={() => {
                        if (confirm("Delete user permanently?"))
                          act({ action: "delete_user", userId: u.id });
                      }}
                      label="Delete"
                      danger
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "saathis" && (
          <div className="space-y-4">
            {saathis.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-border rounded-2xl p-4 shadow-card"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">
                      {s.user?.name || "—"}{" "}
                      {s.isVerified && (
                        <span className="text-xs text-emerald-700">Verified</span>
                      )}
                    </p>
                    <p className="text-sm text-ink-muted">{s.user?.email}</p>
                    <p className="text-xs text-ink-muted mt-1">
                      {s.city} · ₹{s.hourlyRate}/hr
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Btn
                      onClick={() =>
                        act({
                          action: s.isVerified
                            ? "unverify_saathi"
                            : "verify_saathi",
                          saathiUserId: s.userId,
                        })
                      }
                      label={s.isVerified ? "Unverify" : "Verify"}
                    />
                    <Btn
                      onClick={() =>
                        act({
                          action: s.isActive
                            ? "deactivate_saathi"
                            : "activate_saathi",
                          saathiUserId: s.userId,
                        })
                      }
                      label={s.isActive ? "Hide" : "Show"}
                      danger={s.isActive}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "bookings" && (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-white border border-border rounded-2xl p-4 shadow-card"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">
                      {b.saathiName} · {b.service} · {b.status}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {b.client?.email} · {b.date} {b.time} · ₹{b.amount}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Btn
                      onClick={() =>
                        act({ action: "confirm_booking", bookingId: b.id })
                      }
                      label="Confirm"
                    />
                    <Btn
                      onClick={() =>
                        act({ action: "complete_booking", bookingId: b.id })
                      }
                      label="Complete"
                    />
                    <Btn
                      onClick={() =>
                        act({ action: "cancel_booking", bookingId: b.id })
                      }
                      label="Cancel"
                      danger
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "reviews" && (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-border rounded-2xl p-4 shadow-card flex justify-between gap-2"
              >
                <div>
                  <p className="text-gold text-sm">{"★".repeat(r.rating)}</p>
                  <p className="text-sm text-ink">{r.comment || "—"}</p>
                </div>
                <Btn
                  onClick={() => {
                    if (confirm("Delete?"))
                      act({ action: "delete_review", reviewId: r.id });
                  }}
                  label="Delete"
                  danger
                />
              </div>
            ))}
          </div>
        )}

        {busy && (
          <p className="fixed bottom-4 right-4 bg-ink text-cream text-xs px-3 py-2 rounded-full">
            Working…
          </p>
        )}
      </main>
    </div>
  );
}

function Btn({
  onClick,
  label,
  danger,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-medium px-2.5 py-1 rounded-full border transition ${
        danger
          ? "border-red-200 text-red-700 hover:bg-red-50"
          : "border-border text-ink hover:bg-cream-dark"
      }`}
    >
      {label}
    </button>
  );
}

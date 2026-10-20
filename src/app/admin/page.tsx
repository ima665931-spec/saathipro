"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Tab =
  | "stats"
  | "users"
  | "saathis"
  | "bookings"
  | "reviews"
  | "payments"
  | "upi";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [saathis, setSaathis] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [upiList, setUpiList] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const [newUpi, setNewUpi] = useState("");
  const [newName, setNewName] = useState("SaathiPro");
  const [newLimit, setNewLimit] = useState(50);

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
      if (section === "upi") setUpiList(data.upiList || []);
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
        if (body.action === "add_upi") {
          setNewUpi("");
          setNewName("SaathiPro");
          setNewLimit(50);
        }
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
    { id: "upi", label: "UPI Pool" },
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
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-xl text-sm border border-red-100 space-y-2">
            <p className="font-medium">{error}</p>
            <p>
              Logged in as:{" "}
              <code className="bg-red-100 px-1">
                {session?.user?.email || "unknown"}
              </code>
            </p>
            <ol className="list-decimal ml-4 text-xs space-y-1">
              <li>
                Vercel → saathipro → Settings → Environment Variables
              </li>
              <li>
                <code className="bg-red-100 px-1">ADMIN_EMAILS</code> = exact
                same email (no spaces, no quotes)
              </li>
              <li>Environment: Production (+ Preview if needed)</li>
              <li>
                <strong>Redeploy</strong> after saving env (Deployments →
                ⋮ → Redeploy)
              </li>
              <li>Logout + login again, then open /admin</li>
            </ol>
          </div>
        )}

        {loading && <p className="text-ink-muted text-sm py-10">Loading…</p>}

        {!loading && tab === "stats" && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Users", stats.users],
              ["Active UPIs", stats.upiCount],
              ["Pending payments", stats.pendingPay],
              ["Bookings", stats.bookings],
              ["Saathis", stats.saathis],
              ["Reviews", stats.reviews],
              ["Booking ₹", stats.revenue],
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

        {!loading && tab === "upi" && (
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
              <h2 className="font-display font-semibold text-ink mb-3">
                Add UPI
              </h2>
              <p className="text-xs text-ink-muted mb-4">
                Limit full → next UPI. Daily limit 0 = unlimited.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newUpi}
                  onChange={(e) => setNewUpi(e.target.value)}
                  placeholder="name@ybl"
                  className="flex-1 px-3 py-2 border border-border rounded-xl text-sm"
                />
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name"
                  className="sm:w-36 px-3 py-2 border border-border rounded-xl text-sm"
                />
                <input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(Number(e.target.value))}
                  className="sm:w-28 px-3 py-2 border border-border rounded-xl text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    act({
                      action: "add_upi",
                      upiId: newUpi,
                      displayName: newName,
                      dailyLimit: newLimit,
                      priority: upiList.length,
                    })
                  }
                  className="px-4 py-2 bg-ink text-cream rounded-xl text-sm font-medium"
                >
                  Add
                </button>
              </div>
            </div>
            {upiList.map((u) => {
              const full = u.dailyLimit > 0 && u.usedToday >= u.dailyLimit;
              return (
                <div
                  key={u.id}
                  className="bg-white border border-border rounded-2xl p-4 shadow-card"
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-mono font-medium text-ink">{u.upiId}</p>
                      <p className="text-sm text-ink-muted">{u.displayName}</p>
                      <p className="text-xs text-ink-muted mt-1">
                        Today: {u.usedToday}
                        {u.dailyLimit > 0 ? ` / ${u.dailyLimit}` : ""}
                        {full && " · LIMIT FULL"}
                        {!u.isActive && " · OFF"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Btn
                        onClick={() =>
                          act({ action: "toggle_upi", poolId: u.id })
                        }
                        label={u.isActive ? "Disable" : "Enable"}
                        danger={u.isActive}
                      />
                      <Btn
                        onClick={() =>
                          act({ action: "reset_upi_count", poolId: u.id })
                        }
                        label="Reset"
                      />
                      <Btn
                        onClick={() => {
                          if (confirm("Delete?"))
                            act({ action: "delete_upi", poolId: u.id });
                        }}
                        label="Delete"
                        danger
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {upiList.length === 0 && !error && (
              <p className="text-sm text-ink-muted">No UPIs yet.</p>
            )}
          </div>
        )}

        {!loading && tab === "payments" && (
          <div className="space-y-4">
            {payments.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-border rounded-2xl p-4 shadow-card"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">
                      {p.user?.name} · {p.status}
                    </p>
                    <p className="text-sm text-ink-muted">{p.user?.email}</p>
                    <p className="text-sm font-mono mt-1">UTR: {p.utr}</p>
                    {p.screenshot && (
                      <a href={p.screenshot} target="_blank" rel="noreferrer">
                        <img
                          src={p.screenshot}
                          alt="shot"
                          className="mt-2 max-h-28 rounded-lg border"
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
                        label="Approve"
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
          </div>
        )}

        {!loading && tab === "users" && (
          <div className="space-y-4">
            {users.map((u) => (
              <div
                key={u.id}
                className="bg-white border rounded-2xl p-4 flex flex-wrap justify-between gap-2"
              >
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-sm text-ink-muted">{u.email}</p>
                </div>
                <div className="flex gap-1.5">
                  <Btn
                    onClick={() =>
                      act({
                        action: u.isBanned ? "unban_user" : "ban_user",
                        userId: u.id,
                      })
                    }
                    label={u.isBanned ? "Unban" : "Ban"}
                    danger={!u.isBanned}
                  />
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
                className="bg-white border rounded-2xl p-4 flex justify-between"
              >
                <div>
                  <p className="font-medium">{s.user?.name}</p>
                  <p className="text-sm text-ink-muted">{s.user?.email}</p>
                </div>
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
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "bookings" && (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-white border rounded-2xl p-4 flex justify-between"
              >
                <div>
                  <p className="font-medium">
                    {b.saathiName} · {b.status}
                  </p>
                  <p className="text-sm text-ink-muted">{b.client?.email}</p>
                </div>
                <Btn
                  onClick={() =>
                    act({ action: "cancel_booking", bookingId: b.id })
                  }
                  label="Cancel"
                  danger
                />
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "reviews" && (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="bg-white border rounded-2xl p-4 flex justify-between"
              >
                <p className="text-sm">{"★".repeat(r.rating)} {r.comment}</p>
                <Btn
                  onClick={() =>
                    act({ action: "delete_review", reviewId: r.id })
                  }
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

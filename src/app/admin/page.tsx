"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Tab = "stats" | "users" | "saathis" | "bookings" | "reviews" | "payments" | "upi" | "agents";

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
  const [agents, setAgents] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [newUpi, setNewUpi] = useState("");
  const [bulkUpi, setBulkUpi] = useState("");
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
      if (section === "agents") {
        setAgents(data.agents || []);
        setApplications(data.applications || []);
        setWithdrawals(data.withdrawals || []);
      }
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
  }, [status, tab, router, load]);

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
        if (data.message) alert(data.message);
        if (data.referralCode) alert(`Agent code: ${data.referralCode}`);
        if (body.action === "approve_payment" && body.paymentId) {
          fetch("/api/admin/notify-verified", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId: body.paymentId }),
          }).catch(() => {});
        }
        await load(tab, q);
        if (body.action === "add_upi") setNewUpi("");
        if (body.action === "bulk_add_upi") setBulkUpi("");
      }
    } catch {
      alert("Network error");
    } finally {
      setBusy("");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-soft text-ink-muted text-sm">Loading…</div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "stats", label: "Overview" },
    { id: "agents", label: "Agents" },
    { id: "upi", label: "UPI Pool" },
    { id: "payments", label: "Payments" },
    { id: "users", label: "Users" },
    { id: "saathis", label: "Saathis" },
    { id: "bookings", label: "Bookings" },
    { id: "reviews", label: "Reviews" },
  ];

  return (
    <div className="min-h-screen bg-brand-soft">
      <header className="sticky top-0 z-50 bg-brand-gradient text-white shadow-soft">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-display font-bold tracking-tight">Saathi<span className="opacity-90">Pro</span></Link>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">Admin</span>
          </div>
          <Link href="/dashboard" className="text-sm text-white/80 hover:text-white">Dashboard →</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-ink mb-6">Control panel</h1>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                tab === t.id ? "btn-brand shadow-soft" : "bg-white border border-border text-ink-muted hover:text-accent"
              }`}>{t.label}</button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-xl text-sm border border-red-100 space-y-2">
            <p className="font-medium">{error}</p>
            <p>Logged in as: <code className="bg-red-100 px-1">{session?.user?.email || "unknown"}</code></p>
          </div>
        )}

        {loading && <p className="text-ink-muted text-sm py-10">Loading…</p>}

        {!loading && tab === "stats" && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Users", stats.users], ["Agents", stats.agents],
              ["Agent apps", stats.agentApps], ["Cashouts pending", stats.pendingWithdrawals],
              ["Commission ₹", stats.pendingCommission], ["Pending payments", stats.pendingPay],
              ["Bookings", stats.bookings], ["Banned", stats.banned],
            ].map(([label, val]) => (
              <div key={String(label)} className="bg-white border border-border rounded-2xl p-5 shadow-card">
                <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
                <p className="font-display text-2xl font-bold text-brand-gradient mt-1">{val ?? 0}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "agents" && (
          <div className="space-y-10">
            {/* KYC applications */}
            <div className="space-y-3">
              <h2 className="font-display font-bold text-ink">Agent applications (KYC)</h2>
              <p className="text-xs text-ink-muted">Mobile + Aadhaar required. Approve → 50% commission + referral code.</p>
              {applications.map((a) => (
                <div key={a.id} className="bg-white border border-border rounded-2xl p-4 shadow-card">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div className="text-sm">
                      <p className="font-medium text-ink">{a.name} · {a.email}</p>
                      <p className="text-ink-muted mt-1">Phone: <strong>{a.phone}</strong></p>
                      <p className="text-ink-muted">Aadhaar: <strong className="font-mono">{a.aadhaar}</strong></p>
                      <p className="text-ink-muted">UPI: {a.agentUpi || "—"}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Btn onClick={() => act({ action: "approve_agent_application", userId: a.id, commissionPct: 50 })} label="Approve agent" />
                      <Btn onClick={() => act({ action: "reject_agent_application", userId: a.id })} label="Reject" danger />
                    </div>
                  </div>
                </div>
              ))}
              {applications.length === 0 && <p className="text-sm text-ink-muted">No pending applications</p>}
            </div>

            {/* Cashouts */}
            <div className="space-y-3">
              <h2 className="font-display font-bold text-ink">Cashout requests</h2>
              <p className="text-xs text-ink-muted">Pay to the UPI shown, then mark Paid.</p>
              {withdrawals.filter((w) => w.status === "PENDING").map((w) => (
                <div key={w.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-card">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div className="text-sm">
                      <p className="font-medium">{w.agent?.name} · {w.agent?.email}</p>
                      <p className="mt-1">Pay <strong className="text-lg text-brand-gradient">₹{w.amount}</strong> to</p>
                      <p className="font-mono font-bold text-ink">{w.upiId}</p>
                      <p className="text-xs text-ink-muted mt-1">Phone: {w.phone || w.agent?.phone} · Aadhaar: {w.aadhaar}</p>
                      <p className="text-xs text-ink-muted">Code: {w.agent?.referralCode}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Btn onClick={() => act({ action: "pay_withdrawal", withdrawalId: w.id })} label="Mark paid" />
                      <Btn onClick={() => act({ action: "reject_withdrawal", withdrawalId: w.id })} label="Reject" danger />
                    </div>
                  </div>
                </div>
              ))}
              {withdrawals.filter((w) => w.status === "PENDING").length === 0 && (
                <p className="text-sm text-ink-muted">No pending cashouts</p>
              )}
              {withdrawals.filter((w) => w.status !== "PENDING").slice(0, 10).map((w) => (
                <div key={w.id} className="bg-white border border-border rounded-xl p-3 text-sm flex justify-between">
                  <span>{w.agent?.name} · ₹{w.amount} · {w.upiId}</span>
                  <span className="font-medium">{w.status}</span>
                </div>
              ))}
            </div>

            {/* Agent list */}
            <div className="space-y-3">
              <h2 className="font-display font-bold text-ink">Active agents ({agents.length})</h2>
              {agents.map((a) => (
                <div key={a.id} className="bg-white border border-border rounded-2xl p-4 shadow-card">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">{a.name} · <span className="font-mono text-accent">{a.referralCode}</span></p>
                      <p className="text-sm text-ink-muted">{a.email} · {a.phone}</p>
                      <p className="text-xs text-ink-muted mt-1">
                        UPI: {a.agentUpi || "—"} · Aadhaar: {a.aadhaar || "—"}
                      </p>
                      <p className="text-xs text-ink-muted">
                        Refs: {a._count?.referrals ?? 0} · Available ₹{a.pendingPay} · Locked ₹{a.lockedPay} · Paid ₹{a.paidTotal} · {a.commissionPct}%
                      </p>
                    </div>
                    <Btn onClick={() => act({ action: "demote_agent", userId: a.id })} label="Demote" danger />
                  </div>
                </div>
              ))}
              {agents.length === 0 && <p className="text-sm text-ink-muted">No agents yet</p>}
            </div>
          </div>
        )}

        {!loading && tab === "upi" && (
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-2xl p-5 shadow-card space-y-4">
              <h2 className="font-display font-bold text-ink">UPI Pool (platform collection)</h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <input value={newUpi} onChange={(e) => setNewUpi(e.target.value)} placeholder="name@ybl" className="flex-1 px-3 py-2 border border-border rounded-xl text-sm" />
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="sm:w-36 px-3 py-2 border border-border rounded-xl text-sm" />
                <input type="number" value={newLimit} onChange={(e) => setNewLimit(Number(e.target.value))} className="sm:w-24 px-3 py-2 border border-border rounded-xl text-sm" />
                <button type="button" onClick={() => act({ action: "add_upi", upiId: newUpi, displayName: newName, dailyLimit: newLimit })} className="btn-brand px-4 py-2 rounded-xl text-sm">Add</button>
              </div>
              <textarea value={bulkUpi} onChange={(e) => setBulkUpi(e.target.value)} rows={3} className="w-full px-3 py-2 border border-border rounded-xl text-sm font-mono" placeholder="Bulk UPI one per line" />
              <button type="button" onClick={() => act({ action: "bulk_add_upi", upiBulk: bulkUpi, displayName: newName, dailyLimit: newLimit })} className="btn-brand px-4 py-2 rounded-xl text-sm">Add all</button>
            </div>
            {upiList.map((u) => (
              <div key={u.id} className="bg-white border border-border rounded-2xl p-4 shadow-card flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-mono font-medium">{u.upiId}</p>
                  <p className="text-xs text-ink-muted">{u.usedToday}/{u.dailyLimit || "∞"} · {u.isActive ? "ON" : "OFF"}</p>
                </div>
                <div className="flex gap-1">
                  <Btn onClick={() => act({ action: "toggle_upi", poolId: u.id })} label={u.isActive ? "Off" : "On"} />
                  <Btn onClick={() => act({ action: "delete_upi", poolId: u.id })} label="Del" danger />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "payments" && (
          <div className="space-y-4">
            {payments.map((p) => (
              <div key={p.id} className="bg-white border border-border rounded-2xl p-4 shadow-card">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-medium">{p.user?.name} · {p.status} · {p.plan}</p>
                    <p className="text-sm text-ink-muted">{p.user?.email}</p>
                    <p className="text-sm font-mono">UTR: {p.utr} · ₹{p.amount}</p>
                    {p.screenshot && <a href={p.screenshot} target="_blank" rel="noreferrer"><img src={p.screenshot} alt="" className="mt-2 max-h-24 rounded border" /></a>}
                  </div>
                  {p.status === "PENDING" && (
                    <div className="flex flex-col gap-1">
                      <Btn onClick={() => act({ action: "approve_payment", paymentId: p.id })} label="Approve" />
                      <Btn onClick={() => act({ action: "reject_payment", paymentId: p.id })} label="Reject" danger />
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
              <div key={u.id} className="bg-white border border-border rounded-2xl p-4 flex flex-wrap justify-between gap-2 shadow-card">
                <div>
                  <p className="font-medium text-ink">{u.name} · <span className="text-xs">{u.role}</span></p>
                  <p className="text-sm text-ink-muted">{u.email}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {u.role !== "AGENT" && (
                    <Btn onClick={() => act({ action: "promote_to_agent", userId: u.id, commissionPct: 50 })} label="→ Agent" />
                  )}
                  <Btn onClick={() => act({ action: u.isBanned ? "unban_user" : "ban_user", userId: u.id })} label={u.isBanned ? "Unban" : "Ban"} danger={!u.isBanned} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "saathis" && saathis.map((s) => (
          <div key={s.id} className="bg-white border rounded-2xl p-4 flex justify-between mb-2 shadow-card">
            <div><p className="font-medium">{s.user?.name}</p><p className="text-sm text-ink-muted">{s.user?.email}</p></div>
            <Btn onClick={() => act({ action: s.isVerified ? "unverify_saathi" : "verify_saathi", saathiUserId: s.userId })} label={s.isVerified ? "Unverify" : "Verify"} />
          </div>
        ))}

        {!loading && tab === "bookings" && bookings.map((b) => (
          <div key={b.id} className="bg-white border rounded-2xl p-4 flex justify-between mb-2 shadow-card">
            <div><p className="font-medium">{b.saathiName} · {b.status}</p><p className="text-sm text-ink-muted">{b.client?.email}</p></div>
            <Btn onClick={() => act({ action: "cancel_booking", bookingId: b.id })} label="Cancel" danger />
          </div>
        ))}

        {!loading && tab === "reviews" && reviews.map((r) => (
          <div key={r.id} className="bg-white border rounded-2xl p-4 flex justify-between mb-2 shadow-card">
            <p className="text-sm">{"★".repeat(r.rating)} {r.comment}</p>
            <Btn onClick={() => act({ action: "delete_review", reviewId: r.id })} label="Delete" danger />
          </div>
        ))}

        {busy && <p className="fixed bottom-4 right-4 bg-brand-gradient text-white text-xs px-3 py-2 rounded-full">Working…</p>}
      </main>
    </div>
  );
}

function Btn({ onClick, label, danger }: { onClick: () => void; label: string; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick}
      className={`text-xs font-medium px-2.5 py-1 rounded-full border transition ${
        danger ? "border-red-200 text-red-700 hover:bg-red-50" : "border-border text-ink hover:border-accent/40"
      }`}>{label}</button>
  );
}

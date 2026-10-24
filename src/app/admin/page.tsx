"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Zone = "platform" | "agents";
type PlatformTab = "stats" | "users" | "saathis" | "bookings" | "reviews" | "payments" | "upi";
type AgentTab = "overview" | "kyc" | "list" | "cashouts";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [zone, setZone] = useState<Zone>("platform");
  const [pTab, setPTab] = useState<PlatformTab>("stats");
  const [aTab, setATab] = useState<AgentTab>("kyc");

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
  const [kycView, setKycView] = useState<any>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [newUpi, setNewUpi] = useState("");

  const section =
    zone === "agents"
      ? "agents"
      : pTab;

  const load = useCallback(async (sec: string, search = "") => {
    setLoading(true);
    setError("");
    try {
      const url = `/api/admin?section=${sec}${search ? `&q=${encodeURIComponent(search)}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Access denied");
        setLoading(false);
        return;
      }
      if (sec === "stats") setStats(data.stats);
      if (sec === "users") setUsers(data.users || []);
      if (sec === "saathis") setSaathis(data.saathis || []);
      if (sec === "bookings") setBookings(data.bookings || []);
      if (sec === "reviews") setReviews(data.reviews || []);
      if (sec === "payments") setPayments(data.payments || []);
      if (sec === "upi") setUpiList(data.upiList || []);
      if (sec === "agents") {
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
    if (status === "authenticated") load(section, q);
  }, [status, section, router, load]);

  const act = async (body: Record<string, unknown>) => {
    setBusy(String(body.action));
    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Failed");
      else {
        if (data.referralCode) alert(`Agent ID: ${data.referralCode}`);
        await load(section, q);
      }
    } catch {
      alert("Network error");
    } finally {
      setBusy("");
    }
  };

  const viewKyc = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/agent-kyc?userId=${userId}`);
      const data = await res.json();
      if (!res.ok) alert(data.error || "Failed");
      else setKycView(data.user);
    } catch {
      alert("Network error");
    }
  };

  const copyText = (t: string) => {
    navigator.clipboard.writeText(t).catch(() => {});
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-soft text-ink-muted text-sm">Loading…</div>
    );
  }

  const platformTabs: { id: PlatformTab; label: string }[] = [
    { id: "stats", label: "Overview" },
    { id: "payments", label: "Payments" },
    { id: "users", label: "Users" },
    { id: "saathis", label: "Saathis" },
    { id: "bookings", label: "Bookings" },
    { id: "reviews", label: "Reviews" },
    { id: "upi", label: "UPI Pool" },
  ];

  const agentTabs: { id: AgentTab; label: string }[] = [
    { id: "kyc", label: "KYC queue" },
    { id: "cashouts", label: "Cashouts" },
    { id: "list", label: "Active agents" },
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
        <h1 className="font-display text-2xl font-bold text-ink mb-2">Control panel</h1>
        <p className="text-sm text-ink-muted mb-6">Two sides — Platform users vs Agents. No mixing.</p>

        {/* Zone switch */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => { setZone("platform"); setPTab("stats"); }}
            className={`flex-1 py-3 rounded-2xl text-sm font-semibold border transition ${
              zone === "platform"
                ? "btn-brand shadow-soft border-transparent"
                : "bg-white border-border text-ink-muted"
            }`}
          >
            ① Platform
            <span className="block text-xs font-normal opacity-80 mt-0.5">Seekers · Providers · Payments</span>
          </button>
          <button
            type="button"
            onClick={() => { setZone("agents"); setATab("kyc"); }}
            className={`flex-1 py-3 rounded-2xl text-sm font-semibold border transition ${
              zone === "agents"
                ? "btn-brand shadow-soft border-transparent"
                : "bg-white border-border text-ink-muted"
            }`}
          >
            ② Agents
            <span className="block text-xs font-normal opacity-80 mt-0.5">KYC · Agent ID · Cashouts</span>
          </button>
        </div>

        {zone === "platform" && (
          <div className="flex flex-wrap gap-2 mb-6">
            {platformTabs.map((t) => (
              <button key={t.id} type="button" onClick={() => setPTab(t.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  pTab === t.id ? "btn-brand" : "bg-white border border-border text-ink-muted"
                }`}>{t.label}</button>
            ))}
          </div>
        )}

        {zone === "agents" && (
          <div className="flex flex-wrap gap-2 mb-6">
            {agentTabs.map((t) => (
              <button key={t.id} type="button" onClick={() => setATab(t.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  aTab === t.id ? "btn-brand" : "bg-white border border-border text-ink-muted"
                }`}>{t.label}</button>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-xl text-sm">
            {error} · {session?.user?.email}
          </div>
        )}

        {loading && <p className="text-ink-muted text-sm py-10">Loading…</p>}

        {/* —— PLATFORM —— */}
        {!loading && zone === "platform" && pTab === "stats" && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Users", stats.users],
              ["Pending payments", stats.pendingPay],
              ["Saathis", stats.saathis],
              ["Bookings", stats.bookings],
              ["Agents (info)", stats.agents],
              ["Banned", stats.banned],
            ].map(([l, v]) => (
              <div key={String(l)} className="bg-white border border-border rounded-2xl p-5 shadow-card">
                <p className="text-xs uppercase text-ink-muted">{l}</p>
                <p className="font-display text-2xl font-bold text-brand-gradient mt-1">{v ?? 0}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && zone === "platform" && pTab === "payments" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search Reg ID / email / UTR"
                className="flex-1 px-4 py-2 border border-border rounded-xl text-sm font-mono"
              />
              <button type="button" onClick={() => load("payments", q)} className="btn-brand px-4 py-2 rounded-xl text-sm">Search</button>
            </div>
            <p className="text-xs text-ink-muted">Paste Registration ID (SP……) for fast approve.</p>
            {payments.map((p) => (
              <div key={p.id} className="bg-white border border-border rounded-2xl p-4 shadow-card">
                <div className="flex flex-wrap justify-between gap-3">
                  <div className="text-sm">
                    <p className="font-medium">{p.user?.name} · {p.status} · ₹{p.amount}</p>
                    <p className="text-ink-muted">{p.user?.email}</p>
                    <p className="font-mono text-xs mt-1">
                      Reg ID:{" "}
                      <strong className="text-accent">{p.user?.publicId || "—"}</strong>{" "}
                      {p.user?.publicId && (
                        <button type="button" className="text-accent underline" onClick={() => copyText(p.user.publicId)}>Copy</button>
                      )}
                    </p>
                    <p className="font-mono text-xs">UTR: {p.utr || "—"} · {p.plan}</p>
                    {p.screenshot && (
                      <a href={p.screenshot} target="_blank" rel="noreferrer">
                        <img src={p.screenshot} alt="" className="mt-2 max-h-24 rounded border" />
                      </a>
                    )}
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
            {payments.length === 0 && <p className="text-sm text-ink-muted">No payments</p>}
          </div>
        )}

        {!loading && zone === "platform" && pTab === "users" && (
          <div className="space-y-3">
            <div className="flex gap-2 mb-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Reg ID or email"
                className="flex-1 px-4 py-2 border rounded-xl text-sm font-mono" />
              <button type="button" onClick={() => load("users", q)} className="btn-brand px-4 py-2 rounded-xl text-sm">Search</button>
            </div>
            {users.map((u) => (
              <div key={u.id} className="bg-white border rounded-2xl p-4 flex flex-wrap justify-between gap-2 shadow-card">
                <div className="text-sm">
                  <p className="font-medium">{u.name} · {u.role}</p>
                  <p className="text-ink-muted">{u.email}</p>
                  <p className="font-mono text-xs mt-1">
                    Reg ID: <strong>{u.publicId || "—"}</strong>{" "}
                    {u.publicId && <button type="button" className="text-accent underline" onClick={() => copyText(u.publicId)}>Copy</button>}
                  </p>
                </div>
                <Btn onClick={() => act({ action: u.isBanned ? "unban_user" : "ban_user", userId: u.id })}
                  label={u.isBanned ? "Unban" : "Ban"} danger={!u.isBanned} />
              </div>
            ))}
          </div>
        )}

        {!loading && zone === "platform" && pTab === "saathis" && saathis.map((s) => (
          <div key={s.id} className="bg-white border rounded-2xl p-4 mb-2 flex justify-between shadow-card">
            <p className="text-sm">{s.user?.name} · {s.user?.email}</p>
            <Btn onClick={() => act({ action: s.isVerified ? "unverify_saathi" : "verify_saathi", saathiUserId: s.userId })}
              label={s.isVerified ? "Unverify" : "Verify"} />
          </div>
        ))}

        {!loading && zone === "platform" && pTab === "bookings" && bookings.map((b) => (
          <div key={b.id} className="bg-white border rounded-2xl p-4 mb-2 flex justify-between shadow-card">
            <p className="text-sm">{b.saathiName} · {b.status}</p>
            <Btn onClick={() => act({ action: "cancel_booking", bookingId: b.id })} label="Cancel" danger />
          </div>
        ))}

        {!loading && zone === "platform" && pTab === "reviews" && reviews.map((r) => (
          <div key={r.id} className="bg-white border rounded-2xl p-4 mb-2 flex justify-between shadow-card">
            <p className="text-sm">{"★".repeat(r.rating)} {r.comment}</p>
            <Btn onClick={() => act({ action: "delete_review", reviewId: r.id })} label="Delete" danger />
          </div>
        ))}

        {!loading && zone === "platform" && pTab === "upi" && (
          <div className="space-y-4">
            <div className="bg-white border rounded-2xl p-4 flex gap-2 shadow-card">
              <input value={newUpi} onChange={(e) => setNewUpi(e.target.value)} placeholder="name@ybl"
                className="flex-1 px-3 py-2 border rounded-xl text-sm" />
              <button type="button" onClick={() => act({ action: "add_upi", upiId: newUpi })} className="btn-brand px-4 py-2 rounded-xl text-sm">Add</button>
            </div>
            {upiList.map((u) => (
              <div key={u.id} className="bg-white border rounded-2xl p-4 flex justify-between shadow-card">
                <p className="font-mono text-sm">{u.upiId}</p>
                <Btn onClick={() => act({ action: "toggle_upi", poolId: u.id })} label={u.isActive ? "Off" : "On"} />
              </div>
            ))}
          </div>
        )}

        {/* —— AGENTS —— */}
        {!loading && zone === "agents" && (
          <div className="space-y-6">
            {kycView && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setKycView(null)}>
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <h3 className="font-display font-bold text-lg">KYC — {kycView.name}</h3>
                  <p className="text-sm text-ink-muted">{kycView.email}</p>
                  <p className="mt-2 text-sm">Phone: <strong>{kycView.phone}</strong></p>
                  <p className="text-sm">Aadhaar: <strong className="font-mono">{kycView.aadhaar}</strong></p>
                  <p className="text-sm">Agent ID: <strong className="font-mono">{kycView.referralCode || "—"}</strong></p>
                  {kycView.aadhaarPhoto && <img src={kycView.aadhaarPhoto} alt="" className="mt-4 w-full rounded-xl border" />}
                  <button type="button" onClick={() => setKycView(null)} className="mt-4 btn-brand px-4 py-2 rounded-full text-sm">Close</button>
                </div>
              </div>
            )}

            {aTab === "kyc" && (
              <div className="space-y-3">
                <h2 className="font-display font-bold">KYC queue</h2>
                <p className="text-xs text-ink-muted">Approve only after checking mobile + Aadhaar photo.</p>
                {applications.map((a) => (
                  <div key={a.id} className="bg-white border rounded-2xl p-4 shadow-card">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div className="text-sm">
                        <p className="font-medium">{a.name} · {a.email}</p>
                        <p>Phone: <strong>{a.phone}</strong></p>
                        <p>Aadhaar: <strong className="font-mono">{a.aadhaar}</strong></p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Btn onClick={() => viewKyc(a.id)} label="View photo" />
                        <Btn onClick={() => act({ action: "approve_agent_application", userId: a.id, commissionPct: 50 })} label="Approve" />
                        <Btn onClick={() => act({ action: "reject_agent_application", userId: a.id })} label="Reject" danger />
                      </div>
                    </div>
                  </div>
                ))}
                {applications.length === 0 && <p className="text-sm text-ink-muted">No pending KYC</p>}
              </div>
            )}

            {aTab === "cashouts" && (
              <div className="space-y-3">
                <h2 className="font-display font-bold">Cashouts</h2>
                {withdrawals.filter((w) => w.status === "PENDING").map((w) => (
                  <div key={w.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <p className="font-medium text-sm">{w.agent?.name}</p>
                    <p className="text-lg font-bold text-brand-gradient">₹{w.amount} → {w.upiId}</p>
                    <p className="text-xs">Phone {w.phone} · Aadhaar {w.aadhaar}</p>
                    <div className="mt-2 flex gap-2">
                      <Btn onClick={() => act({ action: "pay_withdrawal", withdrawalId: w.id })} label="Mark paid" />
                      <Btn onClick={() => act({ action: "reject_withdrawal", withdrawalId: w.id })} label="Reject" danger />
                    </div>
                  </div>
                ))}
                {withdrawals.filter((w) => w.status === "PENDING").length === 0 && (
                  <p className="text-sm text-ink-muted">No pending cashouts</p>
                )}
              </div>
            )}

            {aTab === "list" && (
              <div className="space-y-3">
                <h2 className="font-display font-bold">Active agents ({agents.length})</h2>
                {agents.map((a) => (
                  <div key={a.id} className="bg-white border rounded-2xl p-4 shadow-card">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div className="text-sm">
                        <p className="font-medium">{a.name}</p>
                        <p className="font-mono text-accent">
                          Agent ID: {a.referralCode}{" "}
                          <button type="button" className="underline text-xs" onClick={() => copyText(a.referralCode || "")}>Copy</button>
                        </p>
                        <p className="text-ink-muted">{a.email} · {a.phone}</p>
                        <p className="text-xs">₹{a.pendingPay} avail · ₹{a.paidTotal} paid · {a.commissionPct}%</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Btn onClick={() => viewKyc(a.id)} label="View KYC" />
                        <Btn onClick={() => act({ action: "demote_agent", userId: a.id })} label="Demote" danger />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {busy && <p className="fixed bottom-4 right-4 bg-brand-gradient text-white text-xs px-3 py-2 rounded-full">Working…</p>}
      </main>
    </div>
  );
}

function Btn({ onClick, label, danger }: { onClick: () => void; label: string; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick}
      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
        danger ? "border-red-200 text-red-700" : "border-border text-ink"
      }`}>{label}</button>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Zone = "platform" | "agents";
type AgentTab = "kyc" | "fees" | "cashouts" | "list";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [zone, setZone] = useState<Zone>("platform");
  const [tab, setTab] = useState("payments");
  const [agentTab, setAgentTab] = useState<AgentTab>("kyc");
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [saathis, setSaathis] = useState<any[]>([]);
  const [upiList, setUpiList] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [agentFees, setAgentFees] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [kycView, setKycView] = useState<any>(null);
  const [shotView, setShotView] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newUpi, setNewUpi] = useState("");

  const section = zone === "agents" ? "agents" : tab;

  const load = useCallback(async (sec: string, search = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin?section=${sec}${search ? `&q=${encodeURIComponent(search)}` : ""}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Access denied");
        setLoading(false);
        return;
      }
      if (sec === "stats") setStats(data.stats);
      if (sec === "users") setUsers(data.users || []);
      if (sec === "payments") setPayments(data.payments || []);
      if (sec === "saathis") setSaathis(data.saathis || []);
      if (sec === "upi") setUpiList(data.upiList || []);
      if (sec === "agents") {
        setAgents(data.agents || []);
        setApplications(data.applications || []);
        setWithdrawals(data.withdrawals || []);
        const payRes = await fetch("/api/admin?section=payments");
        const payData = await payRes.json();
        if (payRes.ok) {
          setAgentFees(
            (payData.payments || []).filter(
              (p: any) => p.type === "AGENT_ENTRY" && p.status === "PENDING"
            )
          );
        }
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
    if (status !== "authenticated") return;
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!role) return;
    if (role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }
    load(section, q);
  }, [status, section, router, load, session, q]);

  const act = async (body: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Failed");
      else {
        if (data.referralCode) alert("Agent ID: " + data.referralCode);
        await load(section, q);
      }
    } catch {
      alert("Network error");
    }
  };

  const approvePayment = async (p: any) => {
    if (p.type === "AGENT_ENTRY") {
      const res = await fetch("/api/admin/approve-agent-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: p.id }),
      });
      const d = await res.json();
      if (!res.ok) alert(d.error || "Failed");
      else {
        alert(d.agentId ? "Agent fee OK · " + d.agentId : "Fee approved");
        load(section, q);
      }
      return;
    }
    const res = await fetch("/api/admin/approve-membership", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: p.id }),
    });
    const d = await res.json();
    if (!res.ok) alert(d.error || "Failed");
    else load(section, q);
  };

  const approveKyc = async (userId: string) => {
    const res = await fetch("/api/admin/approve-kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, commissionPct: 50 }),
    });
    const d = await res.json();
    if (!res.ok) alert(d.error || "Failed");
    else {
      alert("KYC OK · Agent ID " + (d.referralCode || ""));
      load(section, q);
    }
  };

  const viewKyc = async (userId: string) => {
    const res = await fetch(`/api/admin/agent-kyc?userId=${userId}`);
    const d = await res.json();
    if (res.ok) setKycView(d);
    else alert(d.error || "Failed");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream text-ink-muted text-sm">
        Loading admin…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm font-medium text-ink-muted hover:text-ink">
              ← App
            </Link>
            <h1 className="font-display font-bold text-ink">Admin</h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setZone("platform")}
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                zone === "platform" ? "btn-brand" : "bg-white border border-border"
              }`}
            >
              Platform
            </button>
            <button
              type="button"
              onClick={() => setZone("agents")}
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                zone === "agents" ? "btn-brand" : "bg-white border border-border"
              }`}
            >
              Agents
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        {zone === "platform" && (
          <div className="flex flex-wrap gap-2 mb-4">
            {["payments", "users", "saathis", "upi", "stats"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${
                  tab === t ? "bg-brand-gradient text-white" : "bg-white border border-border"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {zone === "agents" && (
          <div className="flex flex-wrap gap-2 mb-4">
            {(
              [
                ["kyc", "KYC queue"],
                ["fees", "Fees"],
                ["cashouts", "Cashouts"],
                ["list", "All agents"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setAgentTab(id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                  agentTab === id ? "bg-brand-gradient text-white" : "bg-white border border-border"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="mb-4 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="flex-1 px-3 py-2 rounded-xl border border-border text-sm bg-white"
          />
          <button
            type="button"
            onClick={() => load(section, q)}
            className="btn-brand px-4 py-2 rounded-xl text-sm"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : zone === "platform" && tab === "payments" ? (
          <div className="space-y-3">
            {payments.length === 0 && <p className="text-sm text-ink-muted">No payments</p>}
            {payments.map((p) => (
              <div key={p.id} className="bg-white border border-border rounded-2xl p-4 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{p.user?.email || p.userId}</p>
                    <p className="text-ink-muted text-xs">
                      {p.type} · ₹{p.amount} · {p.status} · UTR {p.utr || "—"}
                    </p>
                  </div>
                  {p.status === "PENDING" && (
                    <button
                      type="button"
                      onClick={() => approvePayment(p)}
                      className="btn-brand text-xs px-3 py-1.5 rounded-full"
                    >
                      Approve
                    </button>
                  )}
                </div>
                {p.screenshot && (
                  <button
                    type="button"
                    className="text-xs text-accent mt-2"
                    onClick={() => setShotView(p.screenshot)}
                  >
                    View screenshot
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : zone === "platform" && tab === "users" ? (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="bg-white border border-border rounded-xl p-3 text-sm flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-medium">{u.email}</p>
                  <p className="text-xs text-ink-muted">{u.role} · {u.paymentStatus} · {u.publicId}</p>
                </div>
                <div className="flex gap-2">
                  {u.role !== "ADMIN" && (
                    <button
                      type="button"
                      className="text-xs text-red-600"
                      onClick={() => {
                        if (confirm("Delete user permanently?")) act({ action: "delete_user", userId: u.id });
                      }}
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-xs"
                    onClick={() => act({ action: u.isBanned ? "unban" : "ban", userId: u.id })}
                  >
                    {u.isBanned ? "Unban" : "Ban"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : zone === "platform" && tab === "upi" ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={newUpi}
                onChange={(e) => setNewUpi(e.target.value)}
                placeholder="name@upi"
                className="flex-1 px-3 py-2 rounded-xl border border-border text-sm"
              />
              <button
                type="button"
                className="btn-brand px-4 py-2 rounded-xl text-sm"
                onClick={() => {
                  act({ action: "add_upi", upiId: newUpi });
                  setNewUpi("");
                }}
              >
                Add
              </button>
            </div>
            {upiList.map((u) => (
              <div key={u.id} className="bg-white border rounded-xl p-3 text-sm flex justify-between">
                <span>{u.upiId} {u.isActive ? "· active" : "· off"}</span>
                <button type="button" className="text-xs text-accent" onClick={() => act({ action: "toggle_upi", id: u.id })}>
                  Toggle
                </button>
              </div>
            ))}
          </div>
        ) : zone === "platform" && tab === "saathis" ? (
          <div className="space-y-2">
            {saathis.map((s) => (
              <div key={s.id || s.userId} className="bg-white border rounded-xl p-3 text-sm">
                <p className="font-medium">{s.user?.name || s.userId}</p>
                <p className="text-xs text-ink-muted">{s.city} · ₹{s.hourlyRate}/hr · {s.isActive ? "live" : "off"}</p>
              </div>
            ))}
          </div>
        ) : zone === "platform" && tab === "stats" ? (
          <pre className="text-xs bg-white border rounded-xl p-4 overflow-auto">{JSON.stringify(stats, null, 2)}</pre>
        ) : zone === "agents" && agentTab === "kyc" ? (
          <div className="space-y-3">
            {applications.map((a) => (
              <div key={a.id} className="bg-white border rounded-2xl p-4 text-sm">
                <p className="font-semibold">{a.email || a.name}</p>
                <p className="text-xs text-ink-muted">{a.phone} · {a.agentApplyStatus}</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" className="text-xs text-accent" onClick={() => viewKyc(a.id)}>KYC</button>
                  <button type="button" className="btn-brand text-xs px-3 py-1 rounded-full" onClick={() => approveKyc(a.id)}>Approve</button>
                  <button type="button" className="text-xs text-red-600" onClick={() => act({ action: "reject_kyc", userId: a.id })}>Reject</button>
                </div>
              </div>
            ))}
            {applications.length === 0 && <p className="text-sm text-ink-muted">No KYC pending</p>}
          </div>
        ) : zone === "agents" && agentTab === "fees" ? (
          <div className="space-y-3">
            {agentFees.map((p) => (
              <div key={p.id} className="bg-white border rounded-xl p-3 text-sm flex justify-between gap-2">
                <span>{p.user?.email} · ₹{p.amount} · {p.utr}</span>
                <button type="button" className="btn-brand text-xs px-3 py-1 rounded-full" onClick={() => approvePayment(p)}>Approve</button>
              </div>
            ))}
            {agentFees.length === 0 && <p className="text-sm text-ink-muted">No pending agent fees</p>}
          </div>
        ) : zone === "agents" && agentTab === "cashouts" ? (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w.id} className="bg-white border rounded-xl p-3 text-sm flex justify-between gap-2">
                <span>{w.user?.email} · ₹{w.amount} · {w.upiId} · {w.status}</span>
                {w.status === "PENDING" && (
                  <button type="button" className="text-xs text-accent" onClick={() => act({ action: "mark_paid", withdrawalId: w.id })}>Mark paid</button>
                )}
              </div>
            ))}
          </div>
        ) : zone === "agents" && agentTab === "list" ? (
          <div className="space-y-2">
            {agents.map((a) => (
              <div key={a.id} className="bg-white border rounded-xl p-3 text-sm">
                <p className="font-medium">{a.email} · {a.referralCode}</p>
                <p className="text-xs text-ink-muted">{a.agentApplyStatus} · fee {a.agentFeeStatus}</p>
              </div>
            ))}
          </div>
        ) : null}

        {shotView && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShotView(null)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shotView} alt="Screenshot" className="max-h-[90vh] max-w-full rounded-xl" />
          </div>
        )}

        {kycView && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={() => setKycView(null)}>
            <div className="bg-white rounded-2xl p-5 max-w-md w-full text-sm" onClick={(e) => e.stopPropagation()}>
              <p className="font-bold mb-2">KYC details</p>
              <pre className="text-xs overflow-auto max-h-80">{JSON.stringify(kycView, null, 2)}</pre>
              <button type="button" className="mt-3 text-accent" onClick={() => setKycView(null)}>Close</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

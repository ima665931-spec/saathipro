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
    if (status === "authenticated") load(section, q);
  }, [status, section, router, load]);

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
    const data = await res.json();
    if (!res.ok) alert(data.error || "Failed");
    else setKycView(data.user);
  };

  const copyText = (t: string) => navigator.clipboard.writeText(t).catch(() => {});

  const deleteUser = async (u: { id: string; email?: string; name?: string | null; role?: string }) => {
    const label = u.email || u.name || u.id;
    if (
      !confirm(
        `PERMANENT DELETE\n\n${label}\nRole: ${u.role || "?"}\n\nAll data will be removed. Same Gmail can register again.`
      )
    )
      return;
    if (!confirm("Sure? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id }),
      });
      const d = await res.json();
      if (!res.ok) alert(d.error || "Delete failed");
      else {
        alert("Deleted: " + (d.deleted?.email || label));
        await load(section, q);
      }
    } catch {
      alert("Network error");
    }
  };

  const pendingCashouts = withdrawals.filter((w) => w.status === "PENDING");

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-brand-soft text-sm text-ink-muted">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-brand-soft">
      <header className="sticky top-0 z-50 bg-brand-gradient text-white shadow-soft">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-display font-bold">SaathiPro Admin</Link>
          <Link href="/dashboard" className="text-sm text-white/80">Dashboard →</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-ink mb-2">Control panel</h1>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setZone("platform");
              setTab("payments");
            }}
            className={`flex-1 py-3 rounded-2xl text-sm font-semibold border ${
              zone === "platform" ? "btn-brand border-transparent" : "bg-white border-border text-ink-muted"
            }`}
          >
            ① Platform
            <span className="block text-xs font-normal opacity-80">Users · Payments · Saathis</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setZone("agents");
              setAgentTab("kyc");
            }}
            className={`flex-1 py-3 rounded-2xl text-sm font-semibold border ${
              zone === "agents" ? "btn-brand border-transparent" : "bg-white border-border text-ink-muted"
            }`}
          >
            ② Agents
            <span className="block text-xs font-normal opacity-80">KYC · Fees · Cashouts · List</span>
          </button>
        </div>

        {zone === "platform" && (
          <div className="flex flex-wrap gap-2 mb-6">
            {["payments", "users", "saathis", "upi", "stats"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  tab === t ? "btn-brand" : "bg-white border border-border text-ink-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {zone === "agents" && (
          <div className="flex flex-wrap gap-2 mb-6">
            {(
              [
                { id: "kyc" as const, label: `KYC queue (${applications.length})` },
                { id: "fees" as const, label: `Fees ₹199 (${agentFees.length})` },
                { id: "cashouts" as const, label: `Cashouts (${pendingCashouts.length})` },
                { id: "list" as const, label: `All agents (${agents.length})` },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setAgentTab(t.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  agentTab === t.id ? "btn-brand" : "bg-white border border-border text-ink-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-xl text-sm">
            {error} · {session?.user?.email}
          </div>
        )}
        {loading && <p className="text-sm text-ink-muted py-8">Loading…</p>}

        {!loading && zone === "platform" && tab === "stats" && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats).map(([k, v]) => (
              <div key={k} className="bg-white border rounded-2xl p-4 shadow-card">
                <p className="text-xs uppercase text-ink-muted">{k}</p>
                <p className="font-display text-xl font-bold text-brand-gradient">{v as number}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && zone === "platform" && tab === "payments" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Reg ID / email / UTR"
                className="flex-1 px-4 py-2 border rounded-xl text-sm font-mono"
              />
              <button type="button" onClick={() => load("payments", q)} className="btn-brand px-4 py-2 rounded-xl text-sm">
                Search
              </button>
            </div>
            {payments.map((p) => (
              <div key={p.id} className="bg-white border rounded-2xl p-4 shadow-card flex flex-wrap justify-between gap-3">
                <div className="text-sm">
                  <p className="font-medium">
                    {p.user?.name} · {p.status} · ₹{p.amount}{" "}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cream-dark">
                      {p.type === "AGENT_ENTRY" ? "AGENT FEE ₹199" : p.plan || "MEMBERSHIP"}
                    </span>
                  </p>
                  <p className="text-ink-muted">{p.user?.email}</p>
                  <p className="font-mono text-xs mt-1">
                    Reg ID: <strong>{p.user?.publicId || "—"}</strong>{" "}
                    {p.user?.publicId && (
                      <button type="button" className="text-accent underline" onClick={() => copyText(p.user.publicId)}>
                        Copy
                      </button>
                    )}
                  </p>
                  <p className="font-mono text-xs">UTR: {p.utr || "—"}</p>
                  {p.creditUsed > 0 && (
                    <p className="text-xs text-accent mt-0.5">Credit used: ₹{p.creditUsed}</p>
                  )}
                  {p.screenshot && String(p.screenshot).startsWith("data:image/") && (
                    <button
                      type="button"
                      onClick={() => setShotView(p.screenshot)}
                      className="mt-2 block text-left"
                    >
                      <img
                        src={p.screenshot}
                        alt="Payment screenshot"
                        className="max-h-28 rounded-lg border border-border object-contain bg-cream/40"
                      />
                      <span className="text-[11px] text-accent underline">View full size</span>
                    </button>
                  )}
                  {!p.screenshot && p.status === "PENDING" && (
                    <p className="text-[11px] text-amber-700 mt-1">No screenshot on file</p>
                  )}
                </div>
                {p.status === "PENDING" && (
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={() => approvePayment(p)} className="text-xs px-2.5 py-1 rounded-full border">
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => act({ action: "reject_payment", paymentId: p.id })}
                      className="text-xs px-2.5 py-1 rounded-full border border-red-200 text-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && zone === "platform" && tab === "users" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Reg ID or email"
                className="flex-1 px-4 py-2 border rounded-xl text-sm font-mono"
              />
              <button type="button" onClick={() => load("users", q)} className="btn-brand px-4 py-2 rounded-xl text-sm">
                Search
              </button>
            </div>
            {users.map((u) => (
              <div key={u.id} className="bg-white border rounded-2xl p-4 flex flex-wrap justify-between gap-3 shadow-card text-sm">
                <div>
                  <p className="font-medium">
                    {u.name} · {u.role}
                  </p>
                  <p className="text-ink-muted">{u.email}</p>
                  <p className="font-mono text-xs">Reg ID: {u.publicId || "—"}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => act({ action: u.isBanned ? "unban_user" : "ban_user", userId: u.id })}
                    className="text-xs px-2.5 py-1 rounded-full border border-red-200 text-red-700"
                  >
                    {u.isBanned ? "Unban" : "Ban"}
                  </button>
                  {u.role !== "ADMIN" && (
                    <button
                      type="button"
                      onClick={() => deleteUser(u)}
                      className="text-xs px-2.5 py-1 rounded-full bg-red-600 text-white"
                    >
                      Delete forever
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading &&
          zone === "platform" &&
          tab === "saathis" &&
          saathis.map((s) => (
            <div key={s.id} className="bg-white border rounded-2xl p-4 mb-2 flex justify-between shadow-card text-sm">
              <p>{s.user?.name}</p>
              <button
                type="button"
                onClick={() =>
                  act({
                    action: s.isVerified ? "unverify_saathi" : "verify_saathi",
                    saathiUserId: s.userId,
                  })
                }
                className="text-xs px-2.5 py-1 rounded-full border"
              >
                {s.isVerified ? "Unverify" : "Verify"}
              </button>
            </div>
          ))}

        {!loading && zone === "platform" && tab === "upi" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={newUpi}
                onChange={(e) => setNewUpi(e.target.value)}
                placeholder="name@ybl"
                className="flex-1 px-3 py-2 border rounded-xl text-sm"
              />
              <button
                type="button"
                onClick={() => act({ action: "add_upi", upiId: newUpi })}
                className="btn-brand px-4 py-2 rounded-xl text-sm"
              >
                Add
              </button>
            </div>
            {upiList.map((u) => (
              <div key={u.id} className="bg-white border rounded-2xl p-3 flex justify-between text-sm">
                <span className="font-mono">{u.upiId}</span>
                <button
                  type="button"
                  onClick={() => act({ action: "toggle_upi", poolId: u.id })}
                  className="text-xs border px-2 py-1 rounded-full"
                >
                  {u.isActive ? "Off" : "On"}
                </button>
              </div>
            ))}
          </div>
        )}

        {shotView && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShotView(null)}>
            <div
              className="bg-white rounded-2xl max-w-lg w-full p-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-ink">Payment screenshot</h3>
                <button type="button" onClick={() => setShotView(null)} className="text-sm text-ink-muted">
                  Close
                </button>
              </div>
              <img src={shotView} alt="Payment proof" className="w-full rounded-xl border object-contain" />
            </div>
          </div>
        )}

        {zone === "agents" && kycView && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setKycView(null)}>
            <div
              className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold">{kycView.name}</h3>
              <p className="text-sm">{kycView.email}</p>
              <p className="text-sm mt-2">Phone: {kycView.phone}</p>
              <p className="text-sm">Aadhaar: {kycView.aadhaar}</p>
              <p className="text-sm font-mono">Agent ID: {kycView.referralCode}</p>
              {kycView.aadhaarPhoto && (
                <img src={kycView.aadhaarPhoto} alt="" className="mt-3 w-full rounded-xl border" />
              )}
              <button
                type="button"
                onClick={() => setKycView(null)}
                className="mt-4 btn-brand px-4 py-2 rounded-full text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {!loading && zone === "agents" && agentTab === "kyc" && (
          <div className="space-y-3">
            <p className="text-xs text-ink-muted">Approve KYC first — ₹199 fee is last step for the agent.</p>
            {applications.map((a) => (
              <div
                key={a.id}
                className="bg-white border rounded-2xl p-4 flex flex-wrap justify-between gap-2 shadow-card text-sm"
              >
                <div>
                  <p className="font-medium">
                    {a.name} · {a.email}
                  </p>
                  <p>
                    Phone: {a.phone} · Aadhaar: {a.aadhaar}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => viewKyc(a.id)} className="text-xs border px-2 py-1 rounded-full">
                    View photo
                  </button>
                  <button type="button" onClick={() => approveKyc(a.id)} className="text-xs border px-2 py-1 rounded-full bg-emerald-50 text-emerald-800">
                    Approve KYC
                  </button>
                  <button
                    type="button"
                    onClick={() => act({ action: "reject_agent_application", userId: a.id })}
                    className="text-xs border border-red-200 text-red-700 px-2 py-1 rounded-full"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {applications.length === 0 && <p className="text-sm text-ink-muted py-6">No pending KYC</p>}
          </div>
        )}

        {!loading && zone === "agents" && agentTab === "fees" && (
          <div className="space-y-3">
            {agentFees.map((p) => (
              <div
                key={p.id}
                className="bg-white border rounded-2xl p-4 flex flex-wrap justify-between gap-2 shadow-card text-sm"
              >
                <div>
                  <p className="font-medium">
                    {p.user?.name} · {p.user?.email}
                  </p>
                  <p className="font-mono text-xs">
                    UTR: {p.utr} · ₹{p.amount}
                  </p>
                  {p.screenshot && String(p.screenshot).startsWith("data:image/") && (
                    <button type="button" onClick={() => setShotView(p.screenshot)} className="mt-2 block text-left">
                      <img src={p.screenshot} alt="Fee screenshot" className="max-h-24 rounded-lg border object-contain" />
                      <span className="text-[11px] text-accent underline">View screenshot</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => approvePayment(p)}
                    className="text-xs border px-2 py-1 rounded-full"
                  >
                    Approve fee
                  </button>
                  <button
                    type="button"
                    onClick={() => act({ action: "reject_payment", paymentId: p.id })}
                    className="text-xs border border-red-200 text-red-700 px-2 py-1 rounded-full"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {agentFees.length === 0 && <p className="text-sm text-ink-muted py-6">No pending agent fees</p>}
          </div>
        )}

        {!loading && zone === "agents" && agentTab === "cashouts" && (
          <div className="space-y-3">
            {pendingCashouts.map((w) => (
              <div
                key={w.id}
                className="bg-white border rounded-2xl p-4 text-sm shadow-card flex flex-wrap justify-between gap-2"
              >
                <div>
                  <p className="font-medium">
                    {w.agent?.name} · ₹{w.amount}
                  </p>
                  <p className="font-mono text-xs">UPI: {w.upiId}</p>
                  <p className="text-xs">{w.agent?.email}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => act({ action: "pay_withdrawal", withdrawalId: w.id })}
                    className="text-xs border px-2 py-1 rounded-full"
                  >
                    Mark paid
                  </button>
                  <button
                    type="button"
                    onClick={() => act({ action: "reject_withdrawal", withdrawalId: w.id })}
                    className="text-xs border border-red-200 text-red-700 px-2 py-1 rounded-full"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {pendingCashouts.length === 0 && <p className="text-sm text-ink-muted py-6">No pending cashouts</p>}
          </div>
        )}

        {!loading && zone === "agents" && agentTab === "list" && (
          <div className="space-y-3">
            <p className="text-xs text-ink-muted">Active agents — ban, demote, or delete.</p>
            {agents.map((a) => (
              <div
                key={a.id}
                className="bg-white border rounded-2xl p-4 text-sm shadow-card flex flex-wrap justify-between gap-2"
              >
                <div>
                  <p className="font-medium">
                    {a.name} {a.isBanned ? "· BANNED" : ""}
                  </p>
                  <p className="font-mono text-accent">Agent ID: {a.referralCode}</p>
                  <p className="text-xs">{a.email}</p>
                  <p className="text-xs">
                    ₹{a.pendingPay} avail · refs {a._count?.referrals ?? 0} · {a.commissionPct}%
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => viewKyc(a.id)} className="text-xs border px-2 py-1 rounded-full">
                    KYC
                  </button>
                  <button
                    type="button"
                    onClick={() => act({ action: a.isBanned ? "unban_user" : "ban_user", userId: a.id })}
                    className="text-xs border border-red-200 text-red-700 px-2 py-1 rounded-full"
                  >
                    {a.isBanned ? "Unban" : "Ban"}
                  </button>
                  <button
                    type="button"
                    onClick={() => act({ action: "demote_agent", userId: a.id })}
                    className="text-xs border px-2 py-1 rounded-full"
                  >
                    Demote
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteUser(a)}
                    className="text-xs bg-red-600 text-white px-2 py-1 rounded-full"
                  >
                    Delete forever
                  </button>
                </div>
              </div>
            ))}
            {agents.length === 0 && <p className="text-sm text-ink-muted py-6">No active agents</p>}
          </div>
        )}
      </main>
    </div>
  );
}

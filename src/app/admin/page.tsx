"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Zone = "platform" | "agents";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [zone, setZone] = useState<Zone>("platform");
  const [tab, setTab] = useState("payments");
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
        // Agent entry fees from payments list
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
    act({ action: "approve_payment", paymentId: p.id });
  };

  const viewKyc = async (userId: string) => {
    const res = await fetch(`/api/admin/agent-kyc?userId=${userId}`);
    const data = await res.json();
    if (!res.ok) alert(data.error || "Failed");
    else setKycView(data.user);
  };

  const copyText = (t: string) => navigator.clipboard.writeText(t).catch(() => {});

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
          <button type="button" onClick={() => { setZone("platform"); setTab("payments"); }}
            className={`flex-1 py-3 rounded-2xl text-sm font-semibold border ${
              zone === "platform" ? "btn-brand border-transparent" : "bg-white border-border text-ink-muted"
            }`}>① Platform<span className="block text-xs font-normal opacity-80">Users · Payments · Saathis</span></button>
          <button type="button" onClick={() => { setZone("agents"); setTab("agents"); }}
            className={`flex-1 py-3 rounded-2xl text-sm font-semibold border ${
              zone === "agents" ? "btn-brand border-transparent" : "bg-white border-border text-ink-muted"
            }`}>② Agents<span className="block text-xs font-normal opacity-80">KYC · Fees · Ban · Cashouts</span></button>
        </div>

        {zone === "platform" && (
          <div className="flex flex-wrap gap-2 mb-6">
            {["payments", "users", "saathis", "upi", "stats"].map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  tab === t ? "btn-brand" : "bg-white border border-border text-ink-muted"
                }`}>{t}</button>
            ))}
          </div>
        )}

        {error && <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-xl text-sm">{error} · {session?.user?.email}</div>}
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
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Reg ID / email / UTR"
                className="flex-1 px-4 py-2 border rounded-xl text-sm font-mono" />
              <button type="button" onClick={() => load("payments", q)} className="btn-brand px-4 py-2 rounded-xl text-sm">Search</button>
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
                      <button type="button" className="text-accent underline" onClick={() => copyText(p.user.publicId)}>Copy</button>
                    )}
                  </p>
                  <p className="font-mono text-xs">UTR: {p.utr || "—"}</p>
                  {p.screenshot && (
                    <a href={p.screenshot} target="_blank" rel="noreferrer">
                      <img src={p.screenshot} alt="" className="mt-2 max-h-20 rounded border" />
                    </a>
                  )}
                </div>
                {p.status === "PENDING" && (
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={() => approvePayment(p)} className="text-xs px-2.5 py-1 rounded-full border">Approve</button>
                    <button type="button" onClick={() => act({ action: "reject_payment", paymentId: p.id })}
                      className="text-xs px-2.5 py-1 rounded-full border border-red-200 text-red-700">Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && zone === "platform" && tab === "users" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Reg ID or email"
                className="flex-1 px-4 py-2 border rounded-xl text-sm font-mono" />
              <button type="button" onClick={() => load("users", q)} className="btn-brand px-4 py-2 rounded-xl text-sm">Search</button>
            </div>
            {users.map((u) => (
              <div key={u.id} className="bg-white border rounded-2xl p-4 flex justify-between shadow-card text-sm">
                <div>
                  <p className="font-medium">{u.name} · {u.role}</p>
                  <p className="text-ink-muted">{u.email}</p>
                  <p className="font-mono text-xs">Reg ID: {u.publicId || "—"}</p>
                </div>
                <button type="button" onClick={() => act({ action: u.isBanned ? "unban_user" : "ban_user", userId: u.id })}
                  className="text-xs px-2.5 py-1 rounded-full border border-red-200 text-red-700">{u.isBanned ? "Unban" : "Ban"}</button>
              </div>
            ))}
          </div>
        )}

        {!loading && zone === "platform" && tab === "saathis" && saathis.map((s) => (
          <div key={s.id} className="bg-white border rounded-2xl p-4 mb-2 flex justify-between shadow-card text-sm">
            <p>{s.user?.name}</p>
            <button type="button" onClick={() => act({ action: s.isVerified ? "unverify_saathi" : "verify_saathi", saathiUserId: s.userId })}
              className="text-xs px-2.5 py-1 rounded-full border">{s.isVerified ? "Unverify" : "Verify"}</button>
          </div>
        ))}

        {!loading && zone === "platform" && tab === "upi" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input value={newUpi} onChange={(e) => setNewUpi(e.target.value)} placeholder="name@ybl" className="flex-1 px-3 py-2 border rounded-xl text-sm" />
              <button type="button" onClick={() => act({ action: "add_upi", upiId: newUpi })} className="btn-brand px-4 py-2 rounded-xl text-sm">Add</button>
            </div>
            {upiList.map((u) => (
              <div key={u.id} className="bg-white border rounded-2xl p-3 flex justify-between text-sm">
                <span className="font-mono">{u.upiId}</span>
                <button type="button" onClick={() => act({ action: "toggle_upi", poolId: u.id })} className="text-xs border px-2 py-1 rounded-full">{u.isActive ? "Off" : "On"}</button>
              </div>
            ))}
          </div>
        )}

        {!loading && zone === "agents" && (
          <div className="space-y-10">
            {kycView && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setKycView(null)}>
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <h3 className="font-bold">{kycView.name}</h3>
                  <p className="text-sm">{kycView.email}</p>
                  <p className="text-sm mt-2">Phone: {kycView.phone}</p>
                  <p className="text-sm">Aadhaar: {kycView.aadhaar}</p>
                  <p className="text-sm font-mono">Agent ID: {kycView.referralCode}</p>
                  {kycView.aadhaarPhoto && <img src={kycView.aadhaarPhoto} alt="" className="mt-3 w-full rounded-xl border" />}
                  <button type="button" onClick={() => setKycView(null)} className="mt-4 btn-brand px-4 py-2 rounded-full text-sm">Close</button>
                </div>
              </div>
            )}

            <section>
              <h2 className="font-display font-bold mb-1">1 · KYC queue</h2>
              <p className="text-xs text-ink-muted mb-3">Approve KYC first — fee is paid after this.</p>
              {applications.map((a) => (
                <div key={a.id} className="bg-white border rounded-2xl p-4 mb-2 flex flex-wrap justify-between gap-2 shadow-card text-sm">
                  <div>
                    <p className="font-medium">{a.name} · {a.email}</p>
                    <p>Phone: {a.phone} · Aadhaar: {a.aadhaar}</p>
                    {a.referralCode && <p className="font-mono text-xs text-accent">ID: {a.referralCode}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={() => viewKyc(a.id)} className="text-xs border px-2 py-1 rounded-full">View photo</button>
                    <button type="button" onClick={() => act({ action: "approve_agent_application", userId: a.id, commissionPct: 50 })} className="text-xs border px-2 py-1 rounded-full">Approve KYC</button>
                    <button type="button" onClick={() => act({ action: "reject_agent_application", userId: a.id })} className="text-xs border border-red-200 text-red-700 px-2 py-1 rounded-full">Reject</button>
                  </div>
                </div>
              ))}
              {applications.length === 0 && <p className="text-sm text-ink-muted">No pending KYC</p>}
            </section>

            <section>
              <h2 className="font-display font-bold mb-1">2 · Agent fee ₹199 pending</h2>
              <p className="text-xs text-ink-muted mb-3">Last step — approve after KYC is done.</p>
              {agentFees.map((p) => (
                <div key={p.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-2 flex flex-wrap justify-between gap-2 text-sm">
                  <div>
                    <p className="font-medium">{p.user?.name} · {p.user?.email}</p>
                    <p className="font-mono text-xs">UTR: {p.utr} · ₹{p.amount}</p>
                    {p.screenshot && (
                      <a href={p.screenshot} target="_blank" rel="noreferrer">
                        <img src={p.screenshot} alt="" className="mt-2 max-h-16 rounded border" />
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={() => approvePayment(p)} className="text-xs border px-2 py-1 rounded-full bg-white">Approve fee</button>
                    <button type="button" onClick={() => act({ action: "reject_payment", paymentId: p.id })}
                      className="text-xs border border-red-200 text-red-700 px-2 py-1 rounded-full">Reject</button>
                  </div>
                </div>
              ))}
              {agentFees.length === 0 && <p className="text-sm text-ink-muted">No pending agent fees</p>}
            </section>

            <section>
              <h2 className="font-display font-bold mb-2">3 · Cashouts</h2>
              {withdrawals.filter((w) => w.status === "PENDING").map((w) => (
                <div key={w.id} className="bg-white border rounded-2xl p-4 mb-2 text-sm">
                  <p className="font-medium">{w.agent?.name}</p>
                  <p className="text-lg font-bold text-brand-gradient">₹{w.amount} → {w.upiId}</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => act({ action: "pay_withdrawal", withdrawalId: w.id })} className="text-xs border px-2 py-1 rounded-full">Mark paid</button>
                    <button type="button" onClick={() => act({ action: "reject_withdrawal", withdrawalId: w.id })} className="text-xs border border-red-200 text-red-700 px-2 py-1 rounded-full">Reject</button>
                  </div>
                </div>
              ))}
              {withdrawals.filter((w) => w.status === "PENDING").length === 0 && (
                <p className="text-sm text-ink-muted">No pending cashouts</p>
              )}
            </section>

            <section>
              <h2 className="font-display font-bold mb-2">4 · Active agents ({agents.length})</h2>
              {agents.map((a) => (
                <div key={a.id} className="bg-white border rounded-2xl p-4 mb-2 text-sm shadow-card flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-medium">{a.name} {a.isBanned ? "· BANNED" : ""}</p>
                    <p className="font-mono text-accent">Agent ID: {a.referralCode}</p>
                    <p className="text-xs">{a.email} · {a.phone}</p>
                    <p className="text-xs">₹{a.pendingPay} avail · refs {a._count?.referrals ?? 0} · {a.commissionPct}%</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={() => viewKyc(a.id)} className="text-xs border px-2 py-1 rounded-full">KYC</button>
                    <button type="button" onClick={() => act({ action: a.isBanned ? "unban_user" : "ban_user", userId: a.id })}
                      className="text-xs border border-red-200 text-red-700 px-2 py-1 rounded-full">{a.isBanned ? "Unban" : "Ban"}</button>
                    <button type="button" onClick={() => act({ action: "demote_agent", userId: a.id })}
                      className="text-xs border px-2 py-1 rounded-full">Demote</button>
                  </div>
                </div>
              ))}
              {agents.length === 0 && <p className="text-sm text-ink-muted">No active agents yet</p>}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

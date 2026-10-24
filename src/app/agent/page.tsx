"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";

export default function AgentPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // Apply form
  const [phone, setPhone] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [applyUpi, setApplyUpi] = useState("");

  // UPI edit
  const [upiEdit, setUpiEdit] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/agent")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) setError(d.error || "Error");
        else {
          setData(d);
          setError("");
          if (d.agent?.agentUpi) setUpiEdit(d.agent.agentUpi);
        }
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/agent");
      return;
    }
    if (status === "authenticated") load();
  }, [status, router]);

  const act = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/agent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) setError(d.error || "Failed");
      else load();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!data?.agent?.shareLink) return;
    try {
      await navigator.clipboard.writeText(data.agent.shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* */ }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-soft text-ink-muted text-sm">Loading…</div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-soft">
      <BrandHeader />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-xs font-bold tracking-widest uppercase text-pink mb-2">Partner</p>
        <h1 className="font-display text-3xl font-bold text-ink">Agent hub</h1>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-xl text-sm border border-red-100">{error}</div>
        )}

        {/* ——— Not agent: apply form ——— */}
        {data && !data.isAgent && (
          <div className="mt-8 bg-white border border-border rounded-2xl p-6 shadow-card">
            {data.agentStatus === "PENDING" ? (
              <>
                <h2 className="font-display text-xl font-bold text-ink">Application under review</h2>
                <p className="text-sm text-ink-muted mt-2">
                  Admin is checking your mobile + Aadhaar. You will get agent access after approval.
                </p>
              </>
            ) : data.agentStatus === "REJECTED" ? (
              <>
                <h2 className="font-display text-xl font-bold text-ink">Application rejected</h2>
                <p className="text-sm text-red-700 mt-2">{data.agentNote || "Contact support"}</p>
                <p className="text-sm text-ink-muted mt-2">You can re-apply below with correct details.</p>
              </>
            ) : (
              <h2 className="font-display text-xl font-bold text-ink">Become an agent</h2>
            )}

            {data.agentStatus !== "PENDING" && (
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  act({ action: "apply_agent", phone, aadhaar, agentUpi: applyUpi || undefined });
                }}
              >
                <p className="text-sm text-ink-muted">
                  Required: <strong>10-digit mobile</strong> + <strong>12-digit Aadhaar</strong>.
                  Commission after approval: <strong>50%</strong> of membership plans.
                </p>
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile number</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} required
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm" placeholder="9876543210" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Aadhaar number</label>
                  <input value={aadhaar} onChange={(e) => setAadhaar(e.target.value)} required
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm" placeholder="12 digits" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Your UPI (optional now)</label>
                  <input value={applyUpi} onChange={(e) => setApplyUpi(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm" placeholder="name@ybl" />
                </div>
                <button type="submit" disabled={busy} className="btn-brand px-6 py-3 rounded-full text-sm disabled:opacity-50">
                  {busy ? "Submitting…" : "Submit application"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ——— Active agent ——— */}
        {data?.isAgent && (
          <>
            <p className="text-ink-muted text-sm mt-1">
              Earn <strong className="text-accent">{data.agent.commissionPct}%</strong> on every membership from your link
            </p>

            <div className="mt-8 bg-white border border-border rounded-2xl p-6 shadow-card">
              <p className="text-xs uppercase text-ink-muted font-semibold">Your referral code</p>
              <p className="font-display text-2xl font-bold text-brand-gradient mt-1">{data.agent.referralCode || "—"}</p>
              <p className="mt-3 text-sm text-ink-muted break-all">{data.agent.shareLink}</p>
              <button type="button" onClick={copy} className="mt-4 btn-brand px-5 py-2.5 rounded-full text-sm">
                {copied ? "Copied!" : "Copy share link"}
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ["Referrals", data.stats.referrals],
                ["Paid members", data.stats.paidMembers],
                ["Available ₹", data.stats.pendingCommission],
                ["Paid out ₹", data.stats.paidCommission],
              ].map(([l, v]) => (
                <div key={String(l)} className="bg-white border border-border rounded-2xl p-4 shadow-card">
                  <p className="text-xs text-ink-muted uppercase">{l}</p>
                  <p className="font-display text-xl font-bold text-ink mt-1">{v}</p>
                </div>
              ))}
            </div>
            {data.stats.lockedCommission > 0 && (
              <p className="mt-2 text-xs text-amber-700">Cashout in progress: ₹{data.stats.lockedCommission} locked</p>
            )}

            {/* UPI manage */}
            <section className="mt-10 bg-white border border-border rounded-2xl p-6 shadow-card">
              <h2 className="font-display text-lg font-bold text-ink">Your payout UPI</h2>
              <p className="text-xs text-ink-muted mt-1">Cashouts go to this UPI. You can change anytime.</p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <input value={upiEdit} onChange={(e) => setUpiEdit(e.target.value)}
                  className="flex-1 px-4 py-3 border border-border rounded-xl text-sm" placeholder="name@ybl" />
                <button type="button" disabled={busy} onClick={() => act({ action: "set_upi", agentUpi: upiEdit })}
                  className="btn-brand px-4 py-2.5 rounded-xl text-sm">Save UPI</button>
                {data.agent.agentUpi && (
                  <button type="button" disabled={busy} onClick={() => act({ action: "clear_upi" })}
                    className="px-4 py-2.5 border border-red-200 text-red-700 rounded-xl text-sm">Remove</button>
                )}
              </div>
            </section>

            {/* Cashout */}
            <section className="mt-6 bg-white border border-border rounded-2xl p-6 shadow-card">
              <h2 className="font-display text-lg font-bold text-ink">Cashout</h2>
              <p className="text-sm text-ink-muted mt-1">
                Available: <strong>₹{data.stats.pendingCommission}</strong> · Min ₹{data.stats.minCashout}
              </p>
              <button
                type="button"
                disabled={busy || data.stats.pendingCommission < data.stats.minCashout || !data.agent.agentUpi}
                onClick={() => {
                  if (confirm(`Request cashout of ₹${data.stats.pendingCommission} to ${data.agent.agentUpi}?`)) {
                    act({ action: "request_cashout" });
                  }
                }}
                className="mt-4 btn-brand px-6 py-3 rounded-full text-sm disabled:opacity-40"
              >
                Apply cashout
              </button>
              {data.withdrawals?.length > 0 && (
                <div className="mt-4 space-y-2">
                  {data.withdrawals.map((w: any) => (
                    <div key={w.id} className="text-sm flex justify-between border-t border-border pt-2">
                      <span>₹{w.amount} → {w.upiId}</span>
                      <span className="font-medium">{w.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-10">
              <h2 className="font-display text-lg font-bold text-ink mb-3">Referrals</h2>
              {data.referrals?.length === 0 ? (
                <p className="text-sm text-ink-muted">No referrals yet — share your link.</p>
              ) : (
                <div className="space-y-2">
                  {data.referrals.map((r: any) => (
                    <div key={r.id} className="bg-white border border-border rounded-xl p-4 flex justify-between text-sm shadow-card">
                      <div>
                        <p className="font-medium">{r.name || r.email}</p>
                        <p className="text-xs text-ink-muted">{r.email}</p>
                      </div>
                      <div className="text-right">
                        <p>{r.paymentStatus}</p>
                        <p className="text-xs text-ink-muted">{r.plan || "—"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-10">
              <h2 className="font-display text-lg font-bold text-ink mb-3">Commission log</h2>
              {data.commissions?.length === 0 ? (
                <p className="text-sm text-ink-muted">Commissions appear after referred users pay & admin approves.</p>
              ) : (
                <div className="space-y-2">
                  {data.commissions.map((c: any) => (
                    <div key={c.id} className="bg-white border border-border rounded-xl p-4 flex justify-between text-sm shadow-card">
                      <div>
                        <p className="font-medium">{c.user?.name || c.user?.email}</p>
                        <p className="text-xs text-ink-muted">{c.plan} · {c.percent}%</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-brand-gradient">₹{c.amount}</p>
                        <p className="text-xs">{c.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <p className="mt-10 text-center text-sm">
          <Link href="/dashboard" className="text-accent font-medium">← Dashboard</Link>
        </p>
      </main>
    </div>
  );
}

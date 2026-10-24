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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/agent");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/agent")
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) setError(d.error || "Access denied");
          else setData(d);
        })
        .catch(() => setError("Network error"))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

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
        <h1 className="font-display text-3xl font-bold text-ink">Agent dashboard</h1>
        <p className="text-ink-muted text-sm mt-1">Share your link · earn {data?.agent?.commissionPct ?? 20}% on membership</p>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-800 rounded-xl text-sm border border-red-100">
            {error}
            <p className="mt-2 text-xs">Admin must promote your account to AGENT role.</p>
          </div>
        )}

        {data && (
          <>
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
                ["Pending ₹", data.stats.pendingCommission],
                ["Paid ₹", data.stats.paidCommission],
              ].map(([l, v]) => (
                <div key={String(l)} className="bg-white border border-border rounded-2xl p-4 shadow-card">
                  <p className="text-xs text-ink-muted uppercase">{l}</p>
                  <p className="font-display text-xl font-bold text-ink mt-1">{v}</p>
                </div>
              ))}
            </div>

            <section className="mt-10">
              <h2 className="font-display text-lg font-bold text-ink mb-3">Your referrals</h2>
              {data.referrals?.length === 0 ? (
                <p className="text-sm text-ink-muted">No one signed up with your link yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.referrals.map((r: any) => (
                    <div key={r.id} className="bg-white border border-border rounded-xl p-4 flex justify-between gap-2 text-sm shadow-card">
                      <div>
                        <p className="font-medium text-ink">{r.name || r.email}</p>
                        <p className="text-ink-muted text-xs">{r.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{r.paymentStatus}</p>
                        <p className="text-xs text-ink-muted">{r.plan || "—"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-10">
              <h2 className="font-display text-lg font-bold text-ink mb-3">Commissions</h2>
              {data.commissions?.length === 0 ? (
                <p className="text-sm text-ink-muted">Commissions appear after admin approves a referred member's payment.</p>
              ) : (
                <div className="space-y-2">
                  {data.commissions.map((c: any) => (
                    <div key={c.id} className="bg-white border border-border rounded-xl p-4 flex justify-between text-sm shadow-card">
                      <div>
                        <p className="font-medium text-ink">{c.user?.name || c.user?.email}</p>
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

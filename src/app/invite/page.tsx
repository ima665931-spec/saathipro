"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type InviteData = {
  code: string;
  creditBalance: number;
  rewardPerFriend: number;
  minCashout: number;
  links: { share: string; seeker: string; provider: string };
  stats: { invited: number; successful: number };
  referrals: { id: string; name: string; status: string; at: string }[];
  pendingCashouts: { id: string; amount: number; upiId: string; status: string }[];
};

export default function InvitePage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upi, setUpi] = useState("");
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/invite")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErr(d.error);
        else setData(d);
      })
      .catch(() => setErr("Network error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/invite");
      return;
    }
    if (status === "authenticated") load();
  }, [status, router]);

  const copy = async () => {
    if (!data?.links.share) return;
    try {
      await navigator.clipboard.writeText(data.links.share);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr("Could not copy — long-press the link");
    }
  };

  const shareNative = async () => {
    if (!data?.links.share) return;
    const text = `Join SaathiPro with my invite — you get the app, I get ₹${data.rewardPerFriend} when you take a plan.\n${data.links.share}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "SaathiPro", text, url: data.links.share });
      } catch {
        /* cancelled */
      }
    } else {
      await copy();
    }
  };

  const cashout = async () => {
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upiId: upi,
          amount: Number(amount) || data?.creditBalance || 0,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErr(d.error || "Failed");
        setBusy(false);
        return;
      }
      setMsg(`Cashout ₹${d.amount} requested → ${d.upiId}. Admin will pay soon.`);
      setUpi("");
      setAmount("");
      load();
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading" || loading) {
    return <div className="py-16 text-center text-sm text-ink-muted">Loading…</div>;
  }

  if (!data) {
    return (
      <div className="py-10 text-center text-sm text-red-600">{err || "Could not load"}</div>
    );
  }

  return (
    <div className="space-y-4 pb-2">
      <section>
        <p className="text-xs font-bold tracking-widest uppercase text-pink">Refer & earn</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1">Invite friends</h1>
        <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
          Friend joins with your link and buys a plan → you get{" "}
          <strong className="text-violet-700">₹{data.rewardPerFriend}</strong> credit.
          Use on next plan or cash out to UPI.
        </p>
      </section>

      <div className="rounded-2xl bg-brand-gradient text-white p-4 shadow-glow">
        <p className="text-xs text-white/80 font-semibold">Your credit balance</p>
        <p className="font-display text-3xl font-bold mt-1">₹{data.creditBalance}</p>
        <p className="text-[11px] text-white/85 mt-1">
          {data.stats.successful} successful · {data.stats.invited} invited
        </p>
        {data.creditBalance > 0 && (
          <Link
            href="/pricing"
            className="inline-block mt-3 text-xs font-bold px-3 py-1.5 rounded-full bg-white text-violet-700"
          >
            Use on next plan →
          </Link>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-border p-4 shadow-card space-y-3">
        <p className="text-xs font-bold text-ink">Your invite code</p>
        <p className="font-mono text-lg font-bold tracking-widest text-violet-700">{data.code}</p>
        <p className="text-[10px] text-ink-muted break-all">{data.links.share}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copy}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-border"
          >
            {copied ? "Copied ✓" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={shareNative}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-gradient"
          >
            Share
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-border p-4 shadow-card space-y-2">
        <p className="text-xs font-bold text-ink">Cash out to UPI</p>
        <p className="text-[11px] text-ink-muted">
          Min ₹{data.minCashout}. Admin pays manually after review.
        </p>
        {data.pendingCashouts.length > 0 && (
          <p className="text-[11px] text-amber-800 bg-amber-50 rounded-lg px-2 py-1.5">
            Pending: ₹{data.pendingCashouts[0].amount} → {data.pendingCashouts[0].upiId}
          </p>
        )}
        <input
          value={upi}
          onChange={(e) => setUpi(e.target.value)}
          placeholder="yourname@upi"
          className="w-full px-3 py-2.5 rounded-xl border border-border text-sm"
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          inputMode="numeric"
          placeholder={`Amount (max ₹${data.creditBalance})`}
          className="w-full px-3 py-2.5 rounded-xl border border-border text-sm"
        />
        <button
          type="button"
          disabled={busy || data.creditBalance < data.minCashout}
          onClick={cashout}
          className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-brand-gradient disabled:opacity-40"
        >
          {busy ? "Submitting…" : "Request cashout"}
        </button>
      </div>

      {err && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs">{err}</div>}
      {msg && <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs">{msg}</div>}

      <div className="rounded-2xl bg-white border border-border p-4 shadow-card">
        <p className="text-xs font-bold text-ink mb-2">Your invites</p>
        {data.referrals.length === 0 ? (
          <p className="text-xs text-ink-muted text-center py-4">No friends yet — share your link.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.referrals.map((r) => (
              <li key={r.id} className="py-2.5 flex justify-between gap-2 text-xs">
                <span className="font-semibold text-ink truncate">{r.name}</span>
                <span className="text-ink-muted shrink-0">{r.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-center text-[11px] text-ink-muted">
        Want to offer services?{" "}
        <Link href="/become-saathi" className="font-semibold text-violet-600">
          Become a Saathi →
        </Link>
      </p>
    </div>
  );
}

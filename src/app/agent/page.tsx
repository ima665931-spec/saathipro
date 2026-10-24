"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1000;
        let w = img.width, h = img.height;
        if (w > max || h > max) {
          if (w > h) { h = Math.round((h * max) / w); w = max; }
          else { w = Math.round((w * max) / h); h = max; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = () => reject(new Error("bad image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("read fail"));
    reader.readAsDataURL(file);
  });
}

export default function AgentPage() {
  const { status } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const [phone, setPhone] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [applyUpi, setApplyUpi] = useState("");
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
          if (d.profile?.phone) setPhone(d.profile.phone);
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

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setPhoto(await compressImage(f));
      setError("");
    } catch {
      setError("Could not read photo");
    }
  };

  const submitKyc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo) {
      setError("Upload Aadhaar card photo");
      return;
    }
    const action = data?.isAgent ? "complete_kyc" : "apply_agent";
    act({
      action,
      phone,
      aadhaar,
      aadhaarPhoto: photo,
      agentUpi: applyUpi || undefined,
    });
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

  const showKycForm =
    data &&
    (data.needsKyc ||
      !data.isAgent ||
      data.agentStatus === "REJECTED" ||
      (data.agentStatus === "PENDING" && !data.isAgent));

  return (
    <div className="min-h-screen bg-brand-soft">
      <BrandHeader />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-xs font-bold tracking-widest uppercase text-pink mb-2">Partner</p>
        <h1 className="font-display text-3xl font-bold text-ink">Agent hub</h1>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-xl text-sm border border-red-100">{error}</div>
        )}

        {/* KYC gate */}
        {showKycForm && data?.agentStatus !== "PENDING" && (
          <div className="mt-8 bg-white border border-border rounded-2xl p-6 shadow-card">
            <h2 className="font-display text-xl font-bold text-ink">
              {data.isAgent ? "Complete your KYC" : "Become an agent"}
            </h2>
            <p className="text-sm text-ink-muted mt-2">
              One-time: <strong>mobile number</strong>, <strong>12-digit Aadhaar</strong>, and{" "}
              <strong>Aadhaar card photo</strong>. Saved permanently for admin verification.
              Commission: <strong>50%</strong> on membership plans.
            </p>

            <form className="mt-6 space-y-4" onSubmit={submitKyc}>
              <div>
                <label className="block text-sm font-medium mb-1">Mobile number *</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm" placeholder="9876543210" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Aadhaar number (12 digits) *</label>
                <input value={aadhaar} onChange={(e) => setAadhaar(e.target.value)} required
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm" placeholder="XXXX XXXX XXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Aadhaar card photo *</label>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full py-3 border border-dashed border-border rounded-xl text-sm text-ink-muted">
                  {photo ? "Change photo" : "Upload / take Aadhaar photo"}
                </button>
                {photo && <img src={photo} alt="Aadhaar" className="mt-2 max-h-48 rounded-lg border mx-auto" />}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payout UPI (optional)</label>
                <input value={applyUpi} onChange={(e) => setApplyUpi(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm" placeholder="name@ybl" />
              </div>
              <button type="submit" disabled={busy} className="btn-brand px-6 py-3 rounded-full text-sm disabled:opacity-50">
                {busy ? "Saving…" : data.isAgent ? "Save KYC" : "Submit application"}
              </button>
            </form>
          </div>
        )}

        {!data?.isAgent && data?.agentStatus === "PENDING" && (
          <div className="mt-8 p-6 bg-amber-50 border border-amber-100 rounded-2xl">
            <h2 className="font-display text-lg font-bold text-amber-900">Under review</h2>
            <p className="text-sm text-amber-800 mt-1">
              Admin is verifying your mobile + Aadhaar. Access unlocks after approval.
            </p>
          </div>
        )}

        {data?.isAgent && !data.needsKyc && (
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
              <p className="mt-3 text-xs text-ink-muted">
                KYC: {data.agent.phone} · {data.agent.aadhaarMasked}
              </p>
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

            <section className="mt-10 bg-white border border-border rounded-2xl p-6 shadow-card">
              <h2 className="font-display text-lg font-bold text-ink">Your payout UPI</h2>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <input value={upiEdit} onChange={(e) => setUpiEdit(e.target.value)}
                  className="flex-1 px-4 py-3 border border-border rounded-xl text-sm" placeholder="name@ybl" />
                <button type="button" disabled={busy} onClick={() => act({ action: "set_upi", agentUpi: upiEdit })}
                  className="btn-brand px-4 py-2.5 rounded-xl text-sm">Save UPI</button>
              </div>
            </section>

            <section className="mt-6 bg-white border border-border rounded-2xl p-6 shadow-card">
              <h2 className="font-display text-lg font-bold text-ink">Cashout</h2>
              <p className="text-sm text-ink-muted mt-1">Available: <strong>₹{data.stats.pendingCommission}</strong></p>
              <button
                type="button"
                disabled={busy || data.stats.pendingCommission < data.stats.minCashout || !data.agent.agentUpi}
                onClick={() => {
                  if (confirm(`Cashout ₹${data.stats.pendingCommission} to ${data.agent.agentUpi}?`)) {
                    act({ action: "request_cashout" });
                  }
                }}
                className="mt-4 btn-brand px-6 py-3 rounded-full text-sm disabled:opacity-40"
              >
                Apply cashout
              </button>
              {data.withdrawals?.map((w: any) => (
                <div key={w.id} className="mt-2 text-sm flex justify-between border-t pt-2">
                  <span>₹{w.amount} → {w.upiId}</span>
                  <span>{w.status}</span>
                </div>
              ))}
            </section>

            <section className="mt-10">
              <h2 className="font-display text-lg font-bold mb-3">Referrals</h2>
              {data.referrals?.length === 0 ? (
                <p className="text-sm text-ink-muted">Share your link to get referrals.</p>
              ) : data.referrals.map((r: any) => (
                <div key={r.id} className="bg-white border rounded-xl p-4 flex justify-between text-sm mb-2 shadow-card">
                  <div><p className="font-medium">{r.name || r.email}</p><p className="text-xs text-ink-muted">{r.email}</p></div>
                  <div className="text-right"><p>{r.paymentStatus}</p><p className="text-xs">{r.plan || "—"}</p></div>
                </div>
              ))}
            </section>

            <section className="mt-10">
              <h2 className="font-display text-lg font-bold mb-3">Commission log</h2>
              {data.commissions?.map((c: any) => (
                <div key={c.id} className="bg-white border rounded-xl p-4 flex justify-between text-sm mb-2 shadow-card">
                  <div><p className="font-medium">{c.user?.name || c.user?.email}</p><p className="text-xs">{c.plan} · {c.percent}%</p></div>
                  <div className="text-right"><p className="font-bold text-brand-gradient">₹{c.amount}</p><p className="text-xs">{c.status}</p></div>
                </div>
              ))}
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

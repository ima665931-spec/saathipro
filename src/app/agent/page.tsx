"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";

function compressImage(file: File, max = 1000, q = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
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
        resolve(canvas.toDataURL("image/jpeg", q));
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
  const feeShotRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fee, setFee] = useState<any>(null);
  const [utr, setUtr] = useState("");
  const [feeShot, setFeeShot] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [applyUpi, setApplyUpi] = useState("");
  const [upiEdit, setUpiEdit] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/agent").then((r) => r.json()),
      fetch("/api/agent/fee").then((r) => r.json()),
    ])
      .then(([d, f]) => {
        if (d.error && !d.step) setError(d.error);
        else {
          setData(d);
          setError("");
          if (d.agent?.agentUpi) setUpiEdit(d.agent.agentUpi);
          if (d.profile?.phone) setPhone(d.profile.phone);
        }
        setFee(f);
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

  const submitFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (utr.replace(/\D/g, "").length !== 12) {
      setError("UTR must be exactly 12 digits");
      return;
    }
    if (!feeShot) {
      setError("Upload payment screenshot");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/agent/fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utr: utr.replace(/\D/g, ""),
          screenshot: feeShot,
          upiPoolId: fee?.upiPoolId,
        }),
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

  const submitKyc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo) {
      setError("Upload Aadhaar photo");
      return;
    }
    act({
      action: "apply_agent",
      phone: phone.replace(/\D/g, "").slice(-10),
      aadhaar: aadhaar.replace(/\D/g, "").slice(0, 12),
      aadhaarPhoto: photo,
      agentUpi: applyUpi || undefined,
    });
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* */ }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-soft text-ink-muted text-sm">Loading…</div>
    );
  }

  const step = data?.step || "kyc";
  const feeAmt = data?.feeAmount || fee?.amount || 199;
  const paidMembers = data?.stats?.paidMembers || 0;
  const milestoneNeed = data?.rewards?.milestoneRefs || 3;
  const milestoneBonus = data?.rewards?.milestoneBonus || 69;
  const milestonePct = Math.min(100, Math.round((paidMembers / milestoneNeed) * 100));
  const upiLink = fee?.upiId
    ? `upi://pay?pa=${encodeURIComponent(fee.upiId)}&pn=${encodeURIComponent(fee.upiName || "SaathiPro")}&am=${feeAmt}&cu=INR&tn=${encodeURIComponent("SaathiPro Agent Fee")}`
    : "";
  const qrUrl = upiLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`
    : "";

  const inviteCards = [
    {
      key: "seeker",
      title: "Invite seeker",
      reward: `${data?.agent?.commissionPct || 50}% of their plan`,
      link: data?.agent?.inviteLinks?.seeker,
    },
    {
      key: "provider",
      title: "Invite Saathi (provider)",
      reward: `${data?.agent?.commissionPct || 50}% of their plan`,
      link: data?.agent?.inviteLinks?.provider,
    },
    {
      key: "agent",
      title: "Invite agent",
      reward: `₹49 on KYC + 10% of their earnings`,
      link: data?.agent?.inviteLinks?.registerAgent,
    },
  ];

  return (
    <div className="min-h-screen bg-brand-soft">
      <BrandHeader />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-xs font-bold tracking-widest uppercase text-pink mb-2">Partner</p>
        <h1 className="font-display text-3xl font-bold text-ink">Agent hub</h1>

        {step !== "hub" && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
            {[
              { n: 1, label: "KYC", on: step === "kyc" || step === "kyc_pending" || step === "kyc_rejected" },
              { n: 2, label: "Admin OK", on: step === "pay_fee" || step === "fee_pending" },
              { n: 3, label: "Pay ₹199", on: step === "pay_fee" || step === "fee_pending" },
            ].map((s) => (
              <span key={s.n} className={`px-3 py-1 rounded-full ${s.on ? "bg-brand-gradient text-white" : "bg-white border border-border text-ink-muted"}`}>
                {s.n}. {s.label}
              </span>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-xl text-sm border border-red-100">{error}</div>
        )}

        {(step === "kyc" || step === "kyc_rejected") && (
          <div className="mt-8 bg-white border border-border rounded-2xl p-6 shadow-card">
            <h2 className="font-display text-xl font-bold text-ink">Step 1 · KYC</h2>
            {step === "kyc_rejected" && (
              <p className="text-sm text-red-700 mt-2">{data.agentNote || "Rejected — resubmit"}</p>
            )}
            <p className="text-sm text-ink-muted mt-2">Mobile + Aadhaar + photo. Fee ₹{feeAmt} is paid only after admin approves KYC.</p>
            <form className="mt-6 space-y-4" onSubmit={submitKyc}>
              <div>
                <label className="block text-sm font-medium mb-1">Mobile (10 digits) *</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  inputMode="numeric" maxLength={10} required
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm font-mono" placeholder="9876543210" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Aadhaar (12 digits) *</label>
                <input value={aadhaar} onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  inputMode="numeric" maxLength={12} required
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Aadhaar photo *</label>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhoto(await compressImage(f)); }} />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full py-3 border border-dashed border-border rounded-xl text-sm text-ink-muted">
                  {photo ? "Change photo" : "Upload photo"}
                </button>
                {photo && <img src={photo} alt="" className="mt-2 max-h-48 mx-auto rounded-lg border" />}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payout UPI (optional)</label>
                <input value={applyUpi} onChange={(e) => setApplyUpi(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm" placeholder="name@ybl" />
              </div>
              <button type="submit" disabled={busy || phone.length !== 10 || aadhaar.length !== 12}
                className="btn-brand px-6 py-3 rounded-full text-sm disabled:opacity-50">
                {busy ? "Saving…" : "Submit KYC"}
              </button>
            </form>
          </div>
        )}

        {step === "kyc_pending" && (
          <div className="mt-8 p-6 bg-amber-50 border border-amber-100 rounded-2xl">
            <h2 className="font-display text-lg font-bold text-amber-900">KYC under review</h2>
            <p className="text-sm text-amber-800 mt-1">
              Agent ID: <strong className="font-mono">{data.agentId}</strong>{" "}
              <button type="button" className="underline text-xs" onClick={() => copy(data.agentId || "")}>Copy</button>
            </p>
            <p className="text-sm text-amber-800 mt-2">After admin approves, you pay ₹{feeAmt} (last step).</p>
            {data.telegramKycUrl && (
              <a href={data.telegramKycUrl} target="_blank" rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 btn-brand px-6 py-3 rounded-full text-sm">
                ✈ Fast KYC on Telegram
              </a>
            )}
          </div>
        )}

        {step === "pay_fee" && (
          <div className="mt-8 space-y-6">
            <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
              <h2 className="font-display text-xl font-bold text-ink">Step 3 · Entry fee ₹{feeAmt} (last)</h2>
              <p className="text-sm text-ink-muted mt-2">KYC approved. Pay once — hub unlocks after admin verifies.</p>
              {data?.agentId && (
                <p className="text-sm mt-2">Agent ID: <strong className="font-mono text-accent">{data.agentId}</strong></p>
              )}
              {!fee?.upiId ? (
                <p className="mt-4 text-sm text-red-600">{fee?.error || "No UPI available"}</p>
              ) : (
                <div className="mt-4 text-center">
                  {qrUrl && <img src={qrUrl} alt="QR" className="mx-auto rounded-xl border" width={220} height={220} />}
                  <p className="mt-3 font-mono text-sm font-semibold">{fee.upiId}</p>
                  <p className="font-display text-2xl font-bold text-brand-gradient mt-2">₹{feeAmt}</p>
                  <a href={upiLink} className="inline-block mt-3 btn-brand px-6 py-2.5 rounded-full text-sm">Open UPI app</a>
                </div>
              )}
            </div>
            <form onSubmit={submitFee} className="bg-white border border-border rounded-2xl p-6 shadow-card space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">UTR (12 digits)</label>
                <input value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  inputMode="numeric" maxLength={12} required
                  className="w-full px-4 py-3 border border-border rounded-xl font-mono text-sm" />
                <p className="text-xs text-ink-muted mt-1">{utr.length}/12</p>
              </div>
              <div>
                <input ref={feeShotRef} type="file" accept="image/*" className="hidden"
                  onChange={async (e) => { const f = e.target.files?.[0]; if (f) setFeeShot(await compressImage(f, 800, 0.7)); }} />
                <button type="button" onClick={() => feeShotRef.current?.click()}
                  className="w-full py-3 border border-dashed border-border rounded-xl text-sm text-ink-muted">
                  {feeShot ? "Change screenshot" : "Upload screenshot"}
                </button>
                {feeShot && <img src={feeShot} alt="" className="mt-2 max-h-36 mx-auto rounded-lg border" />}
              </div>
              <button type="submit" disabled={busy || utr.length !== 12 || !feeShot}
                className="w-full py-3.5 btn-brand rounded-xl disabled:opacity-50">
                {busy ? "Submitting…" : "Submit fee for verification"}
              </button>
            </form>
          </div>
        )}

        {step === "fee_pending" && (
          <div className="mt-8 p-6 bg-amber-50 border border-amber-100 rounded-2xl">
            <h2 className="font-display text-lg font-bold text-amber-900">Fee under review</h2>
            <p className="text-sm text-amber-800 mt-1">
              Admin is verifying ₹{feeAmt}. Agent ID: <strong className="font-mono">{data.agentId}</strong>
            </p>
          </div>
        )}

        {step === "hub" && data?.agent && (
          <>
            <p className="text-ink-muted text-sm mt-1">
              Earn <strong className="text-accent">{data.agent.commissionPct}%</strong> on memberships
            </p>

            <div className="mt-8 bg-white border border-border rounded-2xl p-6 shadow-card">
              <p className="text-xs uppercase text-ink-muted font-semibold">Agent ID</p>
              <p className="font-display text-2xl font-bold text-brand-gradient mt-1">{data.agent.referralCode}</p>
            </div>

            {/* Milestone */}
            <div className="mt-6 bg-white border border-border rounded-2xl p-6 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display font-bold text-ink">Milestone</h2>
                <span className="text-sm font-semibold text-accent">
                  {paidMembers}/{milestoneNeed} → ₹{milestoneBonus}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-1">
                {paidMembers >= milestoneNeed
                  ? "Target hit — bonus credited when triggered"
                  : `${milestoneNeed - paidMembers} more paid member(s) for ₹${milestoneBonus}`}
              </p>
              <div className="mt-3 h-2.5 rounded-full bg-cream-dark overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-gradient transition-all"
                  style={{ width: `${milestonePct}%` }}
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ["Referrals", data.stats?.referrals],
                ["Paid members", data.stats?.paidMembers],
                ["Available ₹", data.stats?.pendingCommission],
                ["Paid out ₹", data.stats?.paidCommission],
              ].map(([l, v]) => (
                <div key={String(l)} className="bg-white border border-border rounded-2xl p-4 shadow-card">
                  <p className="text-xs text-ink-muted uppercase">{l}</p>
                  <p className="font-display text-xl font-bold mt-1">{v ?? 0}</p>
                </div>
              ))}
            </div>

            {/* 3 invite types */}
            <section className="mt-10 space-y-3">
              <h2 className="font-display text-lg font-bold text-ink">Invite & earn</h2>
              <p className="text-xs text-ink-muted">
                50% plan · ₹49 agent KYC · 10% sub-agent · milestone ₹{milestoneBonus}
              </p>
              {inviteCards.map((card) => (
                <div key={card.key} className="bg-white border border-border rounded-2xl p-5 shadow-card">
                  <p className="font-display font-bold text-ink">{card.title}</p>
                  <p className="text-sm text-accent mt-1">{card.reward}</p>
                  <p className="text-xs text-ink-muted break-all mt-2">{card.link || "—"}</p>
                  <button
                    type="button"
                    onClick={() => copy(card.link || "")}
                    className="mt-3 text-xs btn-brand px-4 py-2 rounded-full"
                  >
                    {copied ? "Copied!" : "Copy link"}
                  </button>
                </div>
              ))}
            </section>

            <section className="mt-10 bg-white border border-border rounded-2xl p-6 shadow-card">
              <h2 className="font-display text-lg font-bold">Payout UPI</h2>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <input value={upiEdit} onChange={(e) => setUpiEdit(e.target.value)}
                  className="flex-1 px-4 py-3 border rounded-xl text-sm" placeholder="name@ybl" />
                <button type="button" disabled={busy} onClick={() => act({ action: "set_upi", agentUpi: upiEdit })}
                  className="btn-brand px-4 py-2.5 rounded-xl text-sm">Save</button>
              </div>
            </section>

            <section className="mt-6 bg-white border border-border rounded-2xl p-6 shadow-card">
              <h2 className="font-display text-lg font-bold">Cashout</h2>
              <p className="text-sm text-ink-muted mt-1">Available ₹{data.stats?.pendingCommission} · min ₹{data.stats?.minCashout || 100}</p>
              <button type="button" disabled={busy || (data.stats?.pendingCommission || 0) < (data.stats?.minCashout || 100) || !data.agent.agentUpi}
                onClick={() => { if (confirm(`Cashout ₹${data.stats.pendingCommission}?`)) act({ action: "request_cashout" }); }}
                className="mt-4 btn-brand px-6 py-3 rounded-full text-sm disabled:opacity-40">
                Apply cashout
              </button>
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

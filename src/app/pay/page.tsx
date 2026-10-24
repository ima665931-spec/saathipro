"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getPlan, isValidPlanId, type PlanId } from "@/lib/plans";

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 800;
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
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => reject(new Error("bad image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("read fail"));
    reader.readAsDataURL(file);
  });
}

function PayInner() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const planId: PlanId = isValidPlanId(planParam) ? planParam : "MONTHLY";
  const planMeta = getPlan(planId);
  const FEE = planMeta.price;

  const fileRef = useRef<HTMLInputElement>(null);
  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("SaathiPro");
  const [upiPoolId, setUpiPoolId] = useState<string | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("NONE");
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [utr, setUtr] = useState("");
  const [shot, setShot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/pay?plan=${planId}`);
      return;
    }
    if (status === "authenticated") {
      setLoading(true);
      fetch(`/api/payments?plan=${planId}`)
        .then((r) => r.json())
        .then((d) => {
          setUpiId(d.upiId || "");
          setUpiName(d.upiName || "SaathiPro");
          setUpiPoolId(d.upiPoolId || null);
          setAssignmentId(d.assignmentId || null);
          setPaymentStatus(d.paymentStatus || "NONE");
          setPlanExpiresAt(d.planExpiresAt || null);
          setPublicId(d.publicId || null);
          setActive(!!d.active);
          if (d.paymentStatus === "VERIFIED" && d.active) setDone(true);
          if (d.paymentStatus === "PENDING") setDone(true);
          if (d.error) setError(d.error);
        })
        .finally(() => setLoading(false));
    }
  }, [status, router, planId]);

  useEffect(() => {
    if (paymentStatus !== "PENDING") return;
    const t = setInterval(() => {
      fetch(`/api/payments?plan=${planId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.active || (d.paymentStatus === "VERIFIED" && d.planExpiresAt)) {
            setPaymentStatus("VERIFIED");
            setActive(true);
            setPlanExpiresAt(d.planExpiresAt);
            setDone(true);
          }
        })
        .catch(() => {});
    }, 8000);
    return () => clearInterval(t);
  }, [paymentStatus, planId]);

  const upiLink = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${FEE}&cu=INR&tn=${encodeURIComponent(`SaathiPro ${planMeta.name}`)}`
    : "";

  const qrUrl = upiLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiLink)}`
    : "";

  const copyUpi = async () => {
    if (!upiId) return;
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* */ }
  };

  const copyRegId = async () => {
    if (!publicId) return;
    try {
      await navigator.clipboard.writeText(publicId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch { /* */ }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setShot(await compressImage(f));
      setError("");
    } catch {
      setError("Could not read image");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const digits = utr.replace(/\D/g, "");
    if (digits.length !== 12) {
      setError("UTR must be exactly 12 digits");
      return;
    }
    if (!shot) {
      setError("Upload payment screenshot");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utr: digits,
          screenshot: shot,
          upiPoolId,
          assignmentId,
          plan: planId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setSubmitting(false);
        return;
      }
      if (data.publicId) setPublicId(data.publicId);
      setDone(true);
      setPaymentStatus("PENDING");
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-soft text-ink-muted text-sm">Loading…</div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-soft">
      <header className="border-b border-border bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-ink">
            Saathi<span className="text-pink">Pro</span>
          </Link>
          <Link href="/pricing" className="text-sm text-accent font-medium">Change plan</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10">
        {publicId && (
          <div className="mb-4 p-3 bg-white border border-border rounded-xl flex items-center justify-between text-sm shadow-card">
            <span>Registration ID: <strong className="font-mono text-accent">{publicId}</strong></span>
            <button type="button" onClick={copyRegId} className="text-xs font-medium text-accent">
              {copiedId ? "Copied" : "Copy"}
            </button>
          </div>
        )}

        {active || (paymentStatus === "VERIFIED" && planExpiresAt) ? (
          <div className="mt-6 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-brand-gradient text-white flex items-center justify-center text-3xl shadow-glow">✓</div>
            <h1 className="mt-6 font-display text-3xl font-bold text-ink">You're in</h1>
            <p className="mt-2 text-ink-muted text-sm">
              {planMeta.name} plan active
              {planExpiresAt && (
                <> until {new Date(planExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</>
              )}.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/find" className="btn-brand px-8 py-3.5 rounded-full text-sm">Find a Saathi</Link>
              <Link href="/dashboard" className="px-8 py-3.5 border border-border rounded-full text-sm font-medium">Dashboard</Link>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs font-bold tracking-widest uppercase text-pink mb-2">Membership</p>
            <h1 className="font-display text-3xl font-bold text-ink">Pay ₹{FEE}</h1>
            <p className="mt-2 text-ink-muted text-sm">
              <strong className="text-ink">{planMeta.name}</strong> · {planMeta.days} days.{" "}
              <Link href="/pricing" className="text-accent underline">Change plan</Link>
            </p>

            {(paymentStatus === "PENDING" || done) && (
              <div className="mt-8 p-6 bg-amber-50 border border-amber-100 rounded-2xl text-center">
                <p className="font-display text-lg font-semibold text-amber-900">Under review</p>
                <p className="text-sm text-amber-800 mt-1">
                  Save your Registration ID <strong className="font-mono">{publicId}</strong> for support.
                </p>
                <Link href="/dashboard" className="inline-block mt-4 text-sm font-medium text-accent underline">Dashboard</Link>
              </div>
            )}

            {paymentStatus !== "PENDING" && !done && (
              <>
                <div className="mt-6 bg-white border border-border rounded-2xl p-6 shadow-card text-center">
                  {!upiId ? (
                    <p className="text-sm text-red-600">{error || "No UPI in pool. Admin must add UPIs."}</p>
                  ) : (
                    <>
                      <p className="text-xs uppercase tracking-wide text-ink-muted mb-3">Pay exactly ₹{FEE}</p>
                      {qrUrl && <img src={qrUrl} alt="QR" className="mx-auto rounded-xl border" width={240} height={240} />}
                      <p className="mt-4 font-mono text-sm font-semibold break-all">{upiId}</p>
                      <p className="text-xs text-ink-muted">{upiName}</p>
                      <p className="mt-3 font-display text-3xl font-bold text-brand-gradient">₹{FEE}</p>
                      <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                        <a href={upiLink} className="btn-brand inline-block px-6 py-2.5 text-sm rounded-full">Open UPI app</a>
                        <button type="button" onClick={copyUpi} className="px-6 py-2.5 border border-border text-sm rounded-full">
                          {copied ? "Copied!" : "Copy UPI ID"}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <form onSubmit={submit} className="mt-6 bg-white border border-border rounded-2xl p-6 shadow-card space-y-4">
                  <h2 className="font-display font-semibold text-ink">After you pay</h2>
                  {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl">{error}</div>}
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">UTR (exactly 12 digits)</label>
                    <input
                      value={utr}
                      onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
                      inputMode="numeric"
                      pattern="\d{12}"
                      maxLength={12}
                      placeholder="123456789012"
                      className="w-full px-4 py-3 border border-border rounded-xl bg-cream/50 text-sm font-mono"
                      required
                    />
                    <p className="text-xs text-ink-muted mt-1">{utr.length}/12 digits</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Screenshot</label>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                    <button type="button" onClick={() => fileRef.current?.click()} className="w-full py-3 border border-dashed border-border rounded-xl text-sm text-ink-muted">
                      {shot ? "Change screenshot" : "Upload screenshot"}
                    </button>
                    {shot && <img src={shot} alt="" className="mt-2 max-h-40 rounded-lg mx-auto border" />}
                  </div>
                  <button type="submit" disabled={submitting || !upiId || utr.length !== 12} className="w-full py-3.5 btn-brand rounded-xl disabled:opacity-50">
                    {submitting ? "Submitting…" : "Submit for verification"}
                  </button>
                </form>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-brand-soft text-sm text-ink-muted">Loading…</div>}>
      <PayInner />
    </Suspense>
  );
}

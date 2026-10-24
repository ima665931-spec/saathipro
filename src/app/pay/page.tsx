"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getPlan, isValidPlanId, type PlanId } from "@/lib/plans";
import { telegramPaymentUrl } from "@/lib/telegram";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

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
  const { data: session, status } = useSession();
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
  const [creditBalance, setCreditBalance] = useState(0);
  const [useCredit, setUseCredit] = useState(true);
  const [active, setActive] = useState(false);
  const [utr, setUtr] = useState("");
  const [submittedUtr, setSubmittedUtr] = useState("");
  const [shot, setShot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rzpLoading, setRzpLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [showUpi, setShowUpi] = useState(false);

  const creditApply = useCredit && creditBalance > 0 ? Math.min(creditBalance, FEE) : 0;
  const amountDue = Math.max(0, FEE - creditApply);

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
          setCreditBalance(d.creditBalance || 0);
          setActive(!!d.active);
          setRazorpayEnabled(!!d.razorpayEnabled);
          if (!d.razorpayEnabled) setShowUpi(true);
          if (d.lastUtr) setSubmittedUtr(d.lastUtr);
          if (d.paymentStatus === "VERIFIED" && d.active) setDone(true);
          if (d.paymentStatus === "PENDING") setDone(true);
          if (d.error && !d.razorpayEnabled) setError(d.error);
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
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${amountDue}&cu=INR&tn=${encodeURIComponent(`SaathiPro ${planMeta.name}`)}`
    : "";

  const qrUrl = upiLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiLink)}`
    : "";

  const fastTg = telegramPaymentUrl({
    publicId,
    plan: planMeta.name,
    amount: amountDue,
    utr: submittedUtr || utr || null,
    name: session?.user?.name,
    email: session?.user?.email,
    kind: "MEMBERSHIP",
  });

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

  const payWithRazorpay = async () => {
    setError("");
    setRzpLoading(true);
    try {
      const orderRes = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          useCredit: useCredit && creditBalance > 0,
        }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) {
        setError(order.error || "Could not start payment");
        setRzpLoading(false);
        return;
      }

      const ok = await loadRazorpayScript();
      if (!ok || !window.Razorpay) {
        setError("Could not load Razorpay. Try UPI below or refresh.");
        setRzpLoading(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "SaathiPro",
        description: `${planMeta.name} membership`,
        order_id: order.orderId,
        prefill: {
          name: order.prefill?.name || session?.user?.name || "",
          email: order.prefill?.email || session?.user?.email || "",
          contact: order.prefill?.contact || "",
        },
        notes: {
          plan: planId,
          paymentId: order.paymentId,
        },
        theme: { color: "#7c3aed" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentId: order.paymentId,
              }),
            });
            const data = await verifyRes.json();
            if (!verifyRes.ok) {
              setError(data.error || "Payment verification failed. Contact support with Reg ID.");
              setRzpLoading(false);
              return;
            }
            setPaymentStatus("VERIFIED");
            setActive(true);
            if (data.planExpiresAt) setPlanExpiresAt(data.planExpiresAt);
            setDone(true);
          } catch {
            setError("Network error while verifying payment");
          } finally {
            setRzpLoading(false);
          }
        },
        modal: {
          ondismiss: () => setRzpLoading(false),
        },
      });

      rzp.open();
    } catch {
      setError("Network error");
      setRzpLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (amountDue > 0) {
      const digits = utr.replace(/\D/g, "");
      if (digits.length !== 12) {
        setError("UTR must be exactly 12 digits");
        return;
      }
      if (!shot) {
        setError("Upload payment screenshot");
        return;
      }
    }
    setSubmitting(true);
    try {
      const digits = utr.replace(/\D/g, "");
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utr: amountDue > 0 ? digits : undefined,
          screenshot: amountDue > 0 ? shot : undefined,
          upiPoolId,
          assignmentId,
          plan: planId,
          useCredit: useCredit && creditBalance > 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setSubmitting(false);
        return;
      }
      if (data.publicId) setPublicId(data.publicId);
      if (digits) setSubmittedUtr(digits);
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
          <div className="mb-4 p-4 bg-white border-2 border-pink/30 rounded-2xl shadow-card">
            <p className="text-xs uppercase tracking-wide text-ink-muted font-semibold">Your Registration ID</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <strong className="font-mono text-lg text-brand-gradient">{publicId}</strong>
              <button type="button" onClick={copyRegId} className="shrink-0 text-xs font-semibold btn-brand px-3 py-1.5 rounded-full">
                {copiedId ? "Copied ✓" : "Copy ID"}
              </button>
            </div>
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
            <h1 className="font-display text-3xl font-bold text-ink">Pay ₹{amountDue}</h1>
            <p className="mt-2 text-ink-muted text-sm">
              <strong className="text-ink">{planMeta.name}</strong> · ₹{FEE}
              {creditApply > 0 && (
                <span className="text-accent font-medium"> − ₹{creditApply} credit</span>
              )}
              {" · "}
              <Link href="/pricing" className="text-accent underline">Change plan</Link>
            </p>

            {creditBalance > 0 && paymentStatus !== "PENDING" && !done && (
              <label className="mt-4 flex items-center gap-3 p-4 bg-white border border-border rounded-2xl shadow-card cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCredit}
                  onChange={(e) => setUseCredit(e.target.checked)}
                  className="w-4 h-4 accent-pink"
                />
                <span className="text-sm">
                  Use <strong className="text-accent">₹{Math.min(creditBalance, FEE)}</strong> referral credit
                  <span className="block text-xs text-ink-muted">Balance ₹{creditBalance}</span>
                </span>
              </label>
            )}

            {(paymentStatus === "PENDING" || done) && !active && (
              <div className="mt-8 p-6 bg-amber-50 border border-amber-100 rounded-2xl text-center space-y-3">
                <p className="font-display text-lg font-semibold text-amber-900">Under review</p>
                <p className="text-sm text-amber-800">
                  Reg ID: <strong className="font-mono">{publicId || "—"}</strong>
                </p>
                <a
                  href={fastTg}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 btn-brand px-6 py-3 rounded-full text-sm"
                >
                  <TelegramIcon className="w-5 h-5" />
                  Fast approve on Telegram
                </a>
                <div>
                  <Link href="/dashboard" className="text-sm font-medium text-accent underline">Dashboard</Link>
                </div>
              </div>
            )}

            {paymentStatus !== "PENDING" && !done && (
              <>
                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl">{error}</div>
                )}

                {amountDue > 0 && razorpayEnabled && (
                  <div className="mt-6 bg-white border border-border rounded-2xl p-6 shadow-card text-center space-y-4">
                    <p className="text-xs uppercase tracking-wide text-ink-muted">Instant payment</p>
                    <p className="font-display text-3xl font-bold text-brand-gradient">₹{amountDue}</p>
                    <button
                      type="button"
                      onClick={payWithRazorpay}
                      disabled={rzpLoading}
                      className="w-full py-3.5 btn-brand rounded-xl disabled:opacity-50 text-sm font-semibold"
                    >
                      {rzpLoading ? "Opening Razorpay…" : "Pay securely with Razorpay"}
                    </button>
                    <p className="text-[11px] text-ink-muted">UPI · Cards · Netbanking · Wallets</p>
                    {upiId && (
                      <button
                        type="button"
                        onClick={() => setShowUpi((v) => !v)}
                        className="text-xs text-accent underline"
                      >
                        {showUpi ? "Hide manual UPI" : "Pay via manual UPI instead"}
                      </button>
                    )}
                  </div>
                )}

                {amountDue > 0 && (showUpi || !razorpayEnabled) && (
                  <div className="mt-6 bg-white border border-border rounded-2xl p-6 shadow-card text-center">
                    {!upiId ? (
                      <p className="text-sm text-red-600">
                        {razorpayEnabled
                          ? "Manual UPI not available right now. Use Razorpay above."
                          : error || "No UPI in pool. Admin must add UPIs or configure Razorpay."}
                      </p>
                    ) : (
                      <>
                        <p className="text-xs uppercase tracking-wide text-ink-muted mb-3">Manual UPI · Pay exactly ₹{amountDue}</p>
                        {qrUrl && <img src={qrUrl} alt="QR" className="mx-auto rounded-xl border" width={240} height={240} />}
                        <p className="mt-4 font-mono text-sm font-semibold break-all">{upiId}</p>
                        <p className="mt-3 font-display text-3xl font-bold text-brand-gradient">₹{amountDue}</p>
                        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                          <a href={upiLink} className="btn-brand inline-block px-6 py-2.5 text-sm rounded-full">Open UPI app</a>
                          <button type="button" onClick={copyUpi} className="px-6 py-2.5 border border-border text-sm rounded-full">
                            {copied ? "Copied!" : "Copy UPI ID"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {(amountDue === 0 || showUpi || !razorpayEnabled) && (
                  <form onSubmit={submit} className="mt-6 bg-white border border-border rounded-2xl p-6 shadow-card space-y-4">
                    <h2 className="font-display font-semibold text-ink">
                      {amountDue > 0 ? "After manual UPI pay" : "Confirm with credit"}
                    </h2>
                    {amountDue > 0 && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-ink mb-1">UTR (exactly 12 digits)</label>
                          <input
                            value={utr}
                            onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
                            inputMode="numeric"
                            maxLength={12}
                            placeholder="123456789012"
                            className="w-full px-4 py-3 border border-border rounded-xl bg-cream/50 text-sm font-mono"
                            required
                          />
                          <p className="text-xs text-ink-muted mt-1">{utr.length}/12</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ink mb-1">Screenshot</label>
                          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                          <button type="button" onClick={() => fileRef.current?.click()} className="w-full py-3 border border-dashed border-border rounded-xl text-sm text-ink-muted">
                            {shot ? "Change screenshot" : "Upload screenshot"}
                          </button>
                          {shot && <img src={shot} alt="" className="mt-2 max-h-40 rounded-lg mx-auto border" />}
                        </div>
                      </>
                    )}
                    <button
                      type="submit"
                      disabled={submitting || (amountDue > 0 && (!upiId || utr.length !== 12 || !shot))}
                      className="w-full py-3.5 btn-brand rounded-xl disabled:opacity-50"
                    >
                      {submitting ? "Submitting…" : amountDue > 0 ? "Submit for verification" : "Submit (credit only)"}
                    </button>
                  </form>
                )}
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

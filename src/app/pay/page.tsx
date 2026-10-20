"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const FEE = 499;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 800;
        let w = img.width;
        let h = img.height;
        if (w > max || h > max) {
          if (w > h) {
            h = Math.round((h * max) / w);
            w = max;
          } else {
            w = Math.round((w * max) / h);
            h = max;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
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

export default function PayPage() {
  const { status } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("SaathiPro");
  const [upiPoolId, setUpiPoolId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("NONE");
  const [utr, setUtr] = useState("");
  const [shot, setShot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/pay");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/payments")
        .then((r) => r.json())
        .then((d) => {
          setUpiId(d.upiId || "");
          setUpiName(d.upiName || "SaathiPro");
          setUpiPoolId(d.upiPoolId || null);
          setPaymentStatus(d.paymentStatus || "NONE");
          if (d.paymentStatus === "VERIFIED") setDone(true);
          if (d.paymentStatus === "PENDING") setDone(true);
        })
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  const upiLink =
    upiId
      ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
          upiName
        )}&am=${FEE}&cu=INR&tn=${encodeURIComponent("SaathiPro Registration")}`
      : "";

  const qrUrl = upiLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
        upiLink
      )}`
    : "";

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const data = await compressImage(f);
      setShot(data);
      setError("");
    } catch {
      setError("Could not read image");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!utr.trim() || utr.trim().length < 6) {
      setError("Enter full UTR / UPI transaction ID");
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
          utr: utr.trim(),
          screenshot: shot,
          upiPoolId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setSubmitting(false);
        return;
      }
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
      <div className="min-h-screen flex items-center justify-center bg-cream text-ink-muted text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-border bg-cream/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-display font-semibold text-ink">
            SaathiPro
          </Link>
          <Link href="/dashboard" className="text-sm text-ink-muted">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10">
        <p className="text-xs font-semibold tracking-widest uppercase text-accent-light mb-2">
          Registration fee
        </p>
        <h1 className="font-display text-3xl font-semibold text-ink">
          Pay ₹{FEE}
        </h1>
        <p className="mt-2 text-ink-muted text-sm">
          One-time fee. Pay via any UPI app, then submit UTR + screenshot.
        </p>

        {paymentStatus === "VERIFIED" && (
          <div className="mt-8 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
            <p className="font-display text-lg font-semibold text-emerald-900">
              Payment verified
            </p>
            <p className="text-sm text-emerald-800 mt-1">You have full access.</p>
            <Link
              href="/find"
              className="inline-block mt-4 px-6 py-2.5 bg-ink text-cream rounded-full text-sm font-semibold"
            >
              Find Saathi
            </Link>
          </div>
        )}

        {(paymentStatus === "PENDING" || done) &&
          paymentStatus !== "VERIFIED" && (
            <div className="mt-8 p-6 bg-amber-50 border border-amber-100 rounded-2xl text-center">
              <p className="font-display text-lg font-semibold text-amber-900">
                Under review
              </p>
              <p className="text-sm text-amber-800 mt-1">
                Admin will verify your UTR and screenshot shortly.
              </p>
              <Link
                href="/dashboard"
                className="inline-block mt-4 text-sm font-medium text-ink underline"
              >
                Go to dashboard
              </Link>
            </div>
          )}

        {paymentStatus !== "VERIFIED" &&
          paymentStatus !== "PENDING" &&
          !done && (
            <>
              <div className="mt-8 bg-white border border-border rounded-2xl p-6 shadow-card text-center">
                {!upiId ? (
                  <p className="text-sm text-red-600">
                    No UPI in pool yet. Admin must add UPI in Admin → UPI Pool.
                  </p>
                ) : (
                  <>
                    {qrUrl && (
                      <img
                        src={qrUrl}
                        alt="UPI QR"
                        className="mx-auto rounded-xl border border-border"
                        width={220}
                        height={220}
                      />
                    )}
                    <p className="mt-4 font-medium text-ink">{upiId}</p>
                    <p className="text-xs text-ink-muted">{upiName}</p>
                    <p className="mt-2 font-display text-2xl font-semibold text-ink">
                      ₹{FEE}
                    </p>
                    <a
                      href={upiLink}
                      className="inline-block mt-4 px-6 py-2.5 bg-ink text-cream text-sm font-semibold rounded-full hover:bg-accent"
                    >
                      Open UPI app
                    </a>
                    <p className="mt-3 text-xs text-ink-muted">
                      GPay / PhonePe / Paytm — scan or open link
                    </p>
                  </>
                )}
              </div>

              <form
                onSubmit={submit}
                className="mt-6 bg-white border border-border rounded-2xl p-6 shadow-card space-y-4"
              >
                <h2 className="font-display font-semibold text-ink">
                  After payment
                </h2>
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    UTR / Transaction ID
                  </label>
                  <input
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    placeholder="e.g. 123456789012"
                    className="w-full px-4 py-3 border border-border rounded-xl bg-cream/30 text-ink text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    Payment screenshot
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFile}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-3 border border-dashed border-border rounded-xl text-sm text-ink-muted hover:bg-cream-dark"
                  >
                    {shot ? "Change screenshot" : "Upload screenshot"}
                  </button>
                  {shot && (
                    <img
                      src={shot}
                      alt="Screenshot"
                      className="mt-2 max-h-40 rounded-lg mx-auto border border-border"
                    />
                  )}
                </div>
                <button
                  type="submit"
                  disabled={submitting || !upiId}
                  className="w-full py-3.5 bg-ink text-cream font-semibold rounded-xl hover:bg-accent disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit for verification"}
                </button>
              </form>
            </>
          )}

        {paymentStatus === "REJECTED" && (
          <p className="mt-4 text-sm text-red-600 text-center">
            Previous payment was rejected. Pay again and resubmit.
          </p>
        )}
      </main>
    </div>
  );
}

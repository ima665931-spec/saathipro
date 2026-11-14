"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";
import AvailabilityManager from "@/components/AvailabilityManager";
import { SERVICE_CATALOG, CITY_LIST } from "@/lib/catalog";

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 600;
        let w = img.width,
          h = img.height;
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
        if (!ctx) {
          reject(new Error("no canvas"));
          return;
        }
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

export default function BecomeSaathiPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [hourlyRate, setHourlyRate] = useState(1500);
  const [services, setServices] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [needsPay, setNeedsPay] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/register?type=provider");
    }
  }, [status, router]);

  const toggleService = (svc: string) => {
    setServices((prev) =>
      prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
    );
  };

  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image");
      return;
    }
    try {
      setPhoto(await compressImage(file));
      setError("");
    } catch {
      setError("Could not process image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!session?.user) {
      router.push("/register?type=provider");
      return;
    }
    if (!services.length) {
      setError("Select at least one service");
      return;
    }
    if (!city) {
      setError("Select city");
      return;
    }
    if (bio.trim().length < 20) {
      setError("Bio min 20 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/become-saathi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bio.trim(),
          city,
          hourlyRate: Number(hourlyRate),
          services,
          phone: phone.trim() || null,
          photo: photo || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setLoading(false);
        return;
      }
      setNeedsPay(!!data.needsPayment);
      setSuccess(true);
      setTimeout(
        () => router.push(data.needsPayment ? "/pricing?next=/become-saathi" : "/dashboard"),
        1600
      );
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="py-16 text-center text-sm text-ink-muted">
        {status === "unauthenticated" ? "Redirecting…" : "Loading…"}
      </div>
    );
  }

  if (success) {
    return (
      <div className="py-16 text-center px-4">
        <p className="text-3xl mb-2">✓</p>
        <p className="font-bold text-ink">Profile saved</p>
        <p className="text-xs text-ink-muted mt-1">
          {needsPay ? "Next: unlock a plan to go live." : "Taking you home…"}
        </p>
      </div>
    );
  }

  return (
    <div className="pb-2">
      <div className="hidden md:block -mx-4 mb-4">
        <BrandHeader active="become" />
      </div>

      <section className="mb-4">
        <p className="text-xs font-bold tracking-widest uppercase text-pink">Earn</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1">Saathi profile</h1>
        <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
          Set services & rates. Go live after membership is active.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Photo */}
        <div className="rounded-2xl bg-white border border-border p-4 shadow-card">
          <p className="text-xs font-bold text-ink mb-2">Photo</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-16 h-16 rounded-xl bg-violet-50 border border-dashed border-violet-200 overflow-hidden flex items-center justify-center text-2xl"
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className="w-full h-full object-cover" />
              ) : (
                "📷"
              )}
            </button>
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs font-bold text-violet-700"
              >
                {photo ? "Change photo" : "Upload photo"}
              </button>
              <p className="text-[10px] text-ink-muted mt-0.5">JPG/PNG · auto-compressed</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-border p-4 shadow-card space-y-3">
          <label className="block text-xs font-bold text-ink">
            City
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-cream/40"
            >
              <option value="">Select city</option>
              {CITY_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-bold text-ink">
            Phone (optional)
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile"
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-cream/40"
            />
          </label>

          <label className="block text-xs font-bold text-ink">
            Hourly rate (₹)
            <input
              type="number"
              min={500}
              max={5000}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-cream/40"
            />
          </label>
        </div>

        <div className="rounded-2xl bg-white border border-border p-4 shadow-card">
          <p className="text-xs font-bold text-ink mb-2">Services</p>
          <div className="flex flex-wrap gap-2">
            {SERVICE_CATALOG.map((svc) => {
              const on = services.includes(svc.label);
              return (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => toggleService(svc.label)}
                  className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold border ${
                    on
                      ? "bg-brand-gradient text-white border-transparent"
                      : "bg-white text-ink-muted border-border"
                  }`}
                >
                  {svc.emoji} {svc.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-border p-4 shadow-card">
          <label className="block text-xs font-bold text-ink">
            About you
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              required
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-cream/40"
              placeholder="Min 20 characters — what you offer…"
            />
          </label>
          <p className="text-[10px] text-ink-muted mt-1">{bio.trim().length}/20 min</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-brand-gradient disabled:opacity-50 shadow-glow"
        >
          {loading ? "Saving…" : "Save Saathi profile"}
        </button>

        <p className="text-center text-[11px] text-ink-muted">
          <Link href="/dashboard" className="font-semibold text-violet-600">
            ← Home
          </Link>
        </p>
      </form>

      <div className="mt-6">
        <AvailabilityManager />
      </div>
    </div>
  );
}

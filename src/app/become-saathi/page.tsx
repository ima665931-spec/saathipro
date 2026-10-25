"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";
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

  // Must be logged in to fill provider profile
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
      <div className="min-h-screen flex items-center justify-center bg-brand-soft text-ink-muted text-sm">
        {status === "unauthenticated" ? "Redirecting to register…" : "Loading…"}
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-soft px-4">
        <div className="bg-white rounded-2xl border border-border shadow-soft p-10 text-center max-w-md">
          <div className="w-14 h-14 rounded-full bg-brand-gradient text-white flex items-center justify-center mx-auto text-xl">
            ✓
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">Profile saved</h1>
          <p className="mt-2 text-ink-muted text-sm">
            {needsPay
              ? "Next: choose a plan to go live on Find."
              : "Your listing can go live. Redirecting…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-soft">
      <BrandHeader active="become" />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-xs font-bold tracking-widest uppercase text-pink mb-2">
          For professionals
        </p>
        <h1 className="font-display text-3xl font-bold text-ink">Become a Saathi</h1>
        <p className="mt-2 text-ink-muted mb-2 text-sm">
          Logged in as <strong className="text-ink">{session?.user?.email}</strong>
        </p>
        <p className="text-ink-muted mb-8 text-sm">
          Save profile anytime. Active plan makes you live on Find. Same account can also book
          Saathis.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-5"
        >
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Photo</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 overflow-hidden flex items-center justify-center">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-ink-muted">None</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-4 py-2 text-sm border border-border rounded-full"
              >
                {photo ? "Change" : "Upload"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPhotoChange}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full px-4 py-3 border border-border rounded-xl bg-cream/50"
            >
              <option value="">Select</option>
              {CITY_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl bg-cream/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Services</label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_CATALOG.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => toggleService(svc.label)}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    services.includes(svc.label)
                      ? "btn-brand"
                      : "bg-white border border-border text-ink-muted"
                  }`}
                >
                  {svc.emoji} {svc.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Hourly rate ₹</label>
            <input
              type="number"
              min={500}
              max={5000}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="w-full px-4 py-3 border border-border rounded-xl bg-cream/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">About you</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              required
              className="w-full px-4 py-3 border border-border rounded-xl bg-cream/50"
              placeholder="Min 20 characters — what you offer…"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 btn-brand rounded-xl disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save Saathi profile"}
          </button>
          <p className="text-center text-xs text-ink-muted">
            <Link href="/dashboard" className="text-accent font-medium">
              ← Back to dashboard
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}

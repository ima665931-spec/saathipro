"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ALL_SERVICES = [
  "Movie Partner",
  "Hanging Out",
  "Elder Care",
  "Clubbing",
  "Shopping Buddy",
  "Coffee Partner",
  "Travel Partner",
  "Event Partner",
  "Medical Support",
  "City Tour Partner",
  "Concert Partner",
  "Cafe & Food Partner",
  "Professional Networking Partner",
  "Domestic Help",
];

const CITIES = [
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Chandigarh",
  "Lucknow",
  "Indore",
];

export default function BecomeSaathiPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [hourlyRate, setHourlyRate] = useState(1500);
  const [services, setServices] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const toggleService = (svc: string) => {
    setServices((prev) =>
      prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!session?.user) {
      router.push("/login?callbackUrl=/become-saathi");
      return;
    }

    if (services.length === 0) {
      setError("Please select at least one service");
      return;
    }
    if (!city) {
      setError("Please select your city");
      return;
    }
    if (!bio.trim() || bio.trim().length < 20) {
      setError("Bio should be at least 20 characters");
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-ink-muted text-sm">Loading…</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="bg-white rounded-2xl border border-border shadow-soft p-10 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-ink text-cream flex items-center justify-center mx-auto text-lg">
            ✓
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
            You're in
          </h1>
          <p className="mt-2 text-ink-muted text-sm">
            Profile submitted. Redirecting to dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-cream font-display font-semibold text-sm">
                S
              </div>
              <span className="font-display text-lg font-semibold text-ink tracking-tight">
                SaathiPro
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/find"
                className="text-sm font-medium text-ink-muted hover:text-ink"
              >
                Find
              </Link>
              {session ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-ink text-cream text-sm font-semibold rounded-full hover:bg-accent transition"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login?callbackUrl=/become-saathi"
                  className="px-4 py-2 bg-ink text-cream text-sm font-semibold rounded-full hover:bg-accent transition"
                >
                  Sign in to apply
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase text-accent-light mb-2">
            For professionals
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink">
            Become a Saathi
          </h1>
          <p className="mt-2 text-ink-muted">
            Set your rates. Choose services. Work on your schedule.
          </p>
        </div>

        {!session && (
          <div className="mb-6 p-4 bg-cream-dark border border-border rounded-xl text-ink text-sm">
            Please{" "}
            <Link
              href="/login?callbackUrl=/become-saathi"
              className="font-semibold underline"
            >
              sign in or register
            </Link>{" "}
            to submit your application.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-border shadow-card p-6 sm:p-8 space-y-6"
        >
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full px-4 py-3 border border-border rounded-xl bg-cream/30 focus:outline-none focus:ring-2 focus:ring-accent/20 text-ink"
            >
              <option value="">Select city</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Phone (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3 border border-border rounded-xl bg-cream/30 focus:outline-none focus:ring-2 focus:ring-accent/20 text-ink"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Services you offer
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_SERVICES.map((svc) => (
                <button
                  key={svc}
                  type="button"
                  onClick={() => toggleService(svc)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    services.includes(svc)
                      ? "bg-ink text-cream"
                      : "bg-cream-dark text-ink-muted border border-border hover:text-ink"
                  }`}
                >
                  {svc}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink-muted">
              {services.length} selected
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Hourly rate (₹)
            </label>
            <input
              type="number"
              min={500}
              max={5000}
              step={100}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              required
              className="w-full px-4 py-3 border border-border rounded-xl bg-cream/30 focus:outline-none focus:ring-2 focus:ring-accent/20 text-ink"
            />
            <p className="mt-1 text-xs text-ink-muted">
              Suggested: ₹1,000 – ₹2,000 / hour
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              About you
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              required
              placeholder="Experience, style, and what clients can expect…"
              className="w-full px-4 py-3 border border-border rounded-xl bg-cream/30 focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none text-ink"
            />
            <p className="mt-1 text-xs text-ink-muted">
              {bio.length}/20 min characters
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !session}
            className="w-full py-3.5 bg-ink hover:bg-accent text-cream font-semibold rounded-xl transition disabled:opacity-50"
          >
            {loading
              ? "Submitting…"
              : session
              ? "Submit application"
              : "Sign in to submit"}
          </button>

          <p className="text-center text-xs text-ink-muted">
            By submitting you agree to professional conduct guidelines. Not a
            dating service.
          </p>
        </form>
      </main>
    </div>
  );
}

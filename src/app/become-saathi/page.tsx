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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 text-center max-w-md">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900">You're in!</h1>
          <p className="mt-2 text-gray-600">
            Your Saathi profile has been submitted. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                S
              </div>
              <span className="text-xl font-bold text-gray-900">SaathiPro</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/find" className="text-sm font-medium text-gray-600 hover:text-violet-600">
                Find Saathi
              </Link>
              {session ? (
                <Link href="/dashboard" className="px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-full hover:bg-violet-700 transition">
                  Dashboard
                </Link>
              ) : (
                <Link href="/login?callbackUrl=/become-saathi" className="px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-full hover:bg-violet-700 transition">
                  Login to Apply
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Become a Saathi</h1>
          <p className="mt-2 text-gray-600">
            Earn up to ₹2,000/hour. Flexible hours. Help people across India.
          </p>
        </div>

        {!session && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
            You need to{" "}
            <Link href="/login?callbackUrl=/become-saathi" className="font-semibold underline">
              login / register
            </Link>{" "}
            first to submit your Saathi application.
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              City <span className="text-red-500">*</span>
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            >
              <option value="">Select your city</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Services you offer <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_SERVICES.map((svc) => (
                <button
                  key={svc}
                  type="button"
                  onClick={() => toggleService(svc)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    services.includes(svc)
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-violet-50 hover:text-violet-700"
                  }`}
                >
                  {svc}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-gray-400">{services.length} selected</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Hourly rate (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={500}
              max={5000}
              step={100}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="mt-1 text-xs text-gray-400">Suggested: ₹1,000 – ₹2,000 / hour</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              About you <span className="text-red-500">*</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              required
              placeholder="Tell clients about yourself, your experience, and what makes you a great Saathi..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
            <p className="mt-1 text-xs text-gray-400">{bio.length}/20 min characters</p>
          </div>

          <button
            type="submit"
            disabled={loading || !session}
            className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : session ? "Submit Application" : "Login to Submit"}
          </button>

          <p className="text-center text-xs text-gray-400">
            By submitting you agree to SaathiPro's professional conduct guidelines.
          </p>
        </form>
      </main>
    </div>
  );
}

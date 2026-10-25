"use client";

import { Suspense, useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("callbackUrl") || "/dashboard";
  const callbackUrl =
    raw.startsWith("/pay") ||
    raw.startsWith("/pricing") ||
    raw.startsWith("/book") ||
    raw.startsWith("/chat") ||
    raw.startsWith("/become-saathi") ||
    raw.startsWith("/admin")
      ? raw
      : "/dashboard";

  const urlError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlError === "banned" || urlError === "AccessDenied") {
      setError("This account has been suspended. Contact support.");
    } else if (urlError === "Configuration") {
      setError("Auth configuration error. Try email login.");
    } else if (urlError) {
      setError("Sign-in failed. Please try again.");
    }
  }, [urlError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError(
          res.error.includes("BANNED")
            ? "This account has been suspended."
            : "Invalid email or password"
        );
        setLoading(false);
        return;
      }
      await new Promise((r) => setTimeout(r, 300));
      window.location.href = callbackUrl;
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-8">
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl">{error}</div>
      )}

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl })}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl hover:bg-cream transition font-medium text-ink"
      >
        Continue with Google
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-ink-muted">or email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-border rounded-xl bg-cream/50 text-ink"
            placeholder="you@gmail.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-border rounded-xl bg-cream/50 text-ink"
            placeholder="••••••••"
          />
        </div>
        <button type="submit" disabled={loading} className="w-full py-3.5 btn-brand rounded-xl disabled:opacity-50">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        No account?{" "}
        <Link href="/register" className="text-accent font-semibold hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-soft flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center text-white font-display font-bold text-sm shadow-glow">
              S
            </div>
            <span className="font-display text-xl font-bold text-ink">
              Saathi<span className="text-pink">Pro</span>
            </span>
          </Link>
          <h1 className="mt-8 font-display text-3xl font-bold text-ink">Welcome back</h1>
          <p className="mt-2 text-ink-muted text-sm">Sign in to your dashboard</p>
        </div>
        <Suspense
          fallback={
            <div className="bg-white rounded-2xl border border-border p-8 text-center text-ink-muted text-sm">
              Loading…
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

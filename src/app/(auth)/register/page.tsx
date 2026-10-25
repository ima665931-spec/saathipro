"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ref, setRef] = useState("");
  const [inviteType, setInviteType] = useState("seeker");

  useEffect(() => {
    const fromUrl = searchParams.get("ref") || "";
    const type = searchParams.get("type") || "seeker";
    if (type === "agent" || type === "provider" || type === "seeker") setInviteType(type);
    if (fromUrl) {
      setRef(fromUrl);
      try {
        localStorage.setItem("saathi_ref", fromUrl);
        localStorage.setItem("saathi_ref_type", type);
      } catch {
        /* */
      }
    } else {
      try {
        const saved = localStorage.getItem("saathi_ref") || "";
        const st = localStorage.getItem("saathi_ref_type") || "seeker";
        if (saved) setRef(saved);
        if (st === "agent" || st === "provider" || st === "seeker") setInviteType(st);
      } catch {
        /* */
      }
    }
  }, [searchParams]);

  // Everyone goes through onboarding except agent/provider shortcuts
  const postAuthPath =
    inviteType === "agent"
      ? "/agent"
      : inviteType === "provider"
        ? "/become-saathi"
        : "/onboarding";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          ref: ref || undefined,
          type: inviteType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      const loginRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        setError("Account created. Please sign in.");
        setLoading(false);
        router.push("/login");
        return;
      }

      try {
        localStorage.removeItem("saathi_ref");
        localStorage.removeItem("saathi_ref_type");
      } catch {
        /* */
      }

      router.push(postAuthPath);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
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
        <h1 className="mt-8 font-display text-3xl font-bold text-ink">Create account</h1>
        <p className="mt-2 text-ink-muted text-sm">
          {inviteType === "agent" && "Join as partner agent"}
          {inviteType === "provider" && "Become a Saathi provider"}
          {inviteType === "seeker" && "Next: choose a plan & pay — then book"}
          {ref ? (
            <span className="block mt-1 text-accent font-medium text-xs">
              Invited · {ref.toUpperCase()} · {inviteType}
            </span>
          ) : null}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-card p-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: postAuthPath })}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl hover:bg-cream transition font-medium text-ink"
        >
          Continue with Google
        </button>
        <p className="text-[11px] text-ink-muted text-center mt-2">
          Email signup recommended for referral tracking
        </p>

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
            <label className="block text-sm font-medium text-ink mb-1.5">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-border rounded-xl bg-cream/50 text-ink"
              placeholder="Your name"
            />
          </div>
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
              minLength={6}
              className="w-full px-4 py-3 border border-border rounded-xl bg-cream/50 text-ink"
              placeholder="Minimum 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 btn-brand rounded-xl disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-brand-soft flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-ink-muted text-sm">Loading…</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}

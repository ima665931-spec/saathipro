"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1) Validate env credentials + ensure ADMIN user has password in DB
      const boot = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await boot.json();

      if (!boot.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // 2) Session via credentials (email from bootstrap + same password)
      const res = await signIn("credentials", {
        email: data.email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Password set but sign-in failed. Try again or redeploy.");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs font-bold tracking-widest uppercase text-pink">Owner access</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-white">Admin login</h1>
          <p className="mt-2 text-sm text-white/60">Username + password · not Google</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-border p-6 shadow-card space-y-4"
        >
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Username</label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 border border-border rounded-xl bg-cream/50 text-ink"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-border rounded-xl bg-cream/50 text-ink"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 btn-brand rounded-xl disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Open admin panel"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/40">
          Set <code className="text-white/60">ADMIN_USERNAME</code> +{" "}
          <code className="text-white/60">ADMIN_PASSWORD</code> in Vercel env.{" "}
          <Link href="/" className="text-pink hover:underline">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}

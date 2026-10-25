"use client";

import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";
import { PLANS } from "@/lib/plans";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-brand-soft">
      <BrandHeader />

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="text-xs font-bold tracking-widest uppercase text-pink mb-2">Membership</p>
          <h1 className="font-display text-4xl font-bold text-ink">
            Choose your <span className="text-brand-gradient">plan</span>
          </h1>
          <p className="mt-3 text-ink-muted text-sm">
            Unlock Find, Book & Become Saathi. Pay instantly with Razorpay (UPI · Cards),
            or manual UPI if needed.
          </p>
          <p className="mt-2 text-xs text-ink-muted">
            Flow: <strong className="text-ink">Plan → Pay → Dashboard → Find → Book</strong>
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((p) => {
            const highlight = p.id === "YEARLY" || p.id === "MONTHLY";
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border bg-white p-6 shadow-card flex flex-col ${
                  p.id === "YEARLY"
                    ? "border-pink ring-2 ring-pink/30 shadow-glow"
                    : "border-border"
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold bg-brand-gradient text-white whitespace-nowrap">
                    {p.badge}
                  </span>
                )}
                <h2 className="font-display text-lg font-bold text-ink">{p.name}</h2>
                <p className="text-xs text-ink-muted mt-1">{p.tagline}</p>
                <p className="mt-4">
                  <span className="font-display text-3xl font-bold text-brand-gradient">
                    ₹{p.price}
                  </span>
                </p>
                {p.saveLabel && (
                  <p className="text-xs font-semibold text-pink mt-1">{p.saveLabel}</p>
                )}
                <ul className="mt-4 space-y-1.5 text-xs text-ink-muted flex-1">
                  <li>· Full access {p.days} days</li>
                  <li>· Book any Saathi</li>
                  <li>· Become a Saathi</li>
                  <li>· Instant unlock via Razorpay</li>
                </ul>
                <Link
                  href={`/pay?plan=${p.id}`}
                  className={`mt-6 block text-center py-3 rounded-full text-sm font-bold transition ${
                    highlight
                      ? "btn-brand shadow-soft"
                      : "border-2 border-accent/40 text-accent hover:bg-pink-soft/50"
                  }`}
                >
                  Select {p.name}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-ink-muted max-w-md mx-auto">
          Razorpay success unlocks access immediately. Manual UPI needs admin verification.
          Hourly session fees with Saathi are separate.
        </p>
      </main>
    </div>
  );
}

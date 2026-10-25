"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import BrandHeader from "@/components/BrandHeader";
import { PLANS } from "@/lib/plans";

function PricingInner() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "";

  return (
    <div className="min-h-screen bg-brand-soft">
      <BrandHeader />

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="text-xs font-bold tracking-widest uppercase text-pink mb-2">Membership</p>
          <h1 className="font-display text-4xl font-bold text-ink">
            Unlock <span className="text-brand-gradient">booking & chat</span>
          </h1>
          <p className="mt-3 text-ink-muted text-sm">
            Browse profiles free. Plan is required to book a Saathi, send messages, or go live as a provider.
            Same account works for both.
          </p>
          {next && (
            <p className="mt-2 text-xs text-accent font-medium">
              After payment you can continue where you left off.
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((p) => {
            const highlight = p.id === "YEARLY" || p.id === "MONTHLY";
            const payHref = next
              ? `/pay?plan=${p.id}&next=${encodeURIComponent(next)}`
              : `/pay?plan=${p.id}`;
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
                  <span className="font-display text-3xl font-bold text-brand-gradient">₹{p.price}</span>
                </p>
                {p.saveLabel && (
                  <p className="text-xs font-semibold text-pink mt-1">{p.saveLabel}</p>
                )}
                <ul className="mt-4 space-y-1.5 text-xs text-ink-muted flex-1">
                  <li>· Book any Saathi</li>
                  <li>· In-app chat on bookings</li>
                  <li>· Go live as provider</li>
                  <li>· {p.days} days access</li>
                </ul>
                <Link
                  href={payHref}
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
          Razorpay unlocks instantly. You can find Saathis and become a Saathi with the same Gmail.
        </p>
      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-brand-soft text-sm text-ink-muted">
          Loading…
        </div>
      }
    >
      <PricingInner />
    </Suspense>
  );
}

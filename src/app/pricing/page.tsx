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
    <div className="pb-2">
      <div className="hidden md:block -mx-4 mb-4">
        <BrandHeader />
      </div>

      <section className="mb-4">
        <p className="text-xs font-bold tracking-widest uppercase text-pink">Membership</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1">
          Unlock booking & chat
        </h1>
        <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
          Browse free. Plan needed to book, message, or go live as a Saathi.
        </p>
        {next && (
          <p className="mt-2 text-[11px] font-semibold text-violet-600">
            After payment you can continue where you left off.
          </p>
        )}
      </section>

      <div className="space-y-3">
        {PLANS.map((p) => {
          const payHref = next
            ? `/pay?plan=${p.id}&next=${encodeURIComponent(next)}`
            : `/pay?plan=${p.id}`;
          const best = p.id === "YEARLY";
          const popular = p.id === "MONTHLY";
          return (
            <div
              key={p.id}
              className={`relative rounded-2xl border bg-white p-4 shadow-card flex gap-3 items-center ${
                best
                  ? "border-pink ring-2 ring-pink/25"
                  : popular
                  ? "border-violet-200"
                  : "border-border"
              }`}
            >
              {p.badge && (
                <span className="absolute -top-2 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-gradient text-white">
                  {p.badge}
                </span>
              )}
              <div className="min-w-0 flex-1 pt-1">
                <h2 className="font-bold text-ink text-sm">{p.name}</h2>
                <p className="text-[11px] text-ink-muted">{p.tagline}</p>
                {p.saveLabel && (
                  <p className="text-[10px] font-semibold text-emerald-700 mt-0.5">{p.saveLabel}</p>
                )}
                <p className="mt-1.5">
                  <span className="font-display text-xl font-bold text-brand-gradient">₹{p.price}</span>
                  <span className="text-[10px] text-ink-muted ml-1">{p.days} days</span>
                </p>
              </div>
              <Link
                href={payHref}
                className="shrink-0 text-[11px] font-bold px-3.5 py-2 rounded-full text-white bg-brand-gradient active:scale-95"
              >
                Choose
              </Link>
            </div>
          );
        })}
      </div>

      <ul className="mt-5 space-y-1.5 text-[11px] text-ink-muted px-1">
        <li>· Manual UPI pay · admin verifies usually within a few hours</li>
        <li>· Same plan for seekers and Saathi providers</li>
        <li>· Extend anytime — unused days stack on renewal</li>
      </ul>

      <p className="mt-4 text-center">
        <Link href="/pay" className="text-xs font-semibold text-violet-600">
          Already paid? Open payment status →
        </Link>
      </p>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-ink-muted">Loading…</div>}>
      <PricingInner />
    </Suspense>
  );
}

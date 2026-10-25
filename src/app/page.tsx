"use client";

import { useState } from "react";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

const services = [
  { title: "Movie Partner", desc: "Watch together, share the moment", price: "From ₹1,500", emoji: "🎬", color: "from-violet-500 to-purple-600" },
  { title: "Elder Care", desc: "Senior assistance & daily support", price: "From ₹1,000", emoji: "💚", color: "from-emerald-400 to-teal-500" },
  { title: "Hanging Out", desc: "Casual social time, conversation", price: "From ₹1,500", emoji: "☕", color: "from-pink-400 to-rose-500" },
  { title: "Clubbing", desc: "Nightlife companion, professional", price: "From ₹2,000", emoji: "🎉", color: "from-fuchsia-500 to-pink-600" },
  { title: "Shopping Buddy", desc: "Errands, markets, retail", price: "From ₹1,400", emoji: "🛍️", color: "from-amber-400 to-orange-500" },
  { title: "Medical Support", desc: "Hospital & appointment help", price: "From ₹1,500", emoji: "🏥", color: "from-sky-400 to-blue-500" },
  { title: "Travel Partner", desc: "Explore cities together", price: "From ₹1,800", emoji: "✈️", color: "from-indigo-400 to-violet-500" },
  { title: "Coffee Partner", desc: "Conversation over coffee", price: "From ₹1,200", emoji: "💬", color: "from-rose-400 to-pink-500" },
];

const faqs = [
  {
    q: "What is SaathiPro?",
    a: "Professional social companion platform. Book verified Saathis for movies, care, hangouts and more — safe, consent-first. Not a dating service. Soft launch in Delhi NCR.",
  },
  {
    q: "How much does membership cost?",
    a: "Weekly ₹299 · Monthly ₹499 · Half-year ₹999 · Yearly ₹1499. Pay via Razorpay (UPI / cards). Browse is free; plan unlocks booking & chat.",
  },
  {
    q: "How do I book?",
    a: "Get started → dashboard → Find a Saathi → book. If you don’t have a plan yet, you’ll be asked to unlock membership first.",
  },
  {
    q: "Can I become a Saathi?",
    a: "Yes — same account. Create a provider profile anytime; active plan makes you live on Find.",
  },
  {
    q: "Is it safe?",
    a: "Read our Safety page. Public places preferred, report issues on WhatsApp support. Professional boundaries only.",
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-brand-soft">
      <div className="bg-brand-gradient text-white text-center text-xs sm:text-sm font-medium py-2 px-4">
        Soft launch · Delhi NCR · Membership from ₹299/week
      </div>

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-white font-display font-bold text-sm shadow-glow">
                S
              </div>
              <span className="font-display text-lg font-bold text-ink tracking-tight">
                Saathi<span className="text-pink">Pro</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-ink-muted">
              <a href="#services" className="hover:text-accent transition">Services</a>
              <Link href="/pricing" className="hover:text-accent transition">Pricing</Link>
              <Link href="/find" className="hover:text-accent transition">Find Saathi</Link>
              <Link href="/safety" className="hover:text-accent transition">Safety</Link>
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/login" className="text-sm font-semibold text-ink-muted hover:text-ink px-3 py-2">
                Sign in
              </Link>
              <Link href="/register" className="btn-brand px-5 py-2.5 text-sm rounded-full shadow-soft">
                Get started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-soft opacity-80" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-pink/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-border text-xs font-semibold text-accent shadow-card">
              Soft launch · Delhi NCR · professional only
            </span>
            <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.12] tracking-tight text-balance">
              Find your perfect{" "}
              <span className="text-brand-gradient">Saathi</span>
            </h1>
            <p className="mt-5 text-lg text-ink-muted max-w-xl mx-auto leading-relaxed">
              Movies, care, hangouts, travel — verified professionals. Browse free. Plan unlocks
              booking & chat.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/find" className="w-full sm:w-auto btn-brand px-9 py-3.5 rounded-full text-center shadow-glow">
                Find a Saathi
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto px-9 py-3.5 bg-white border-2 border-accent/30 text-accent font-semibold rounded-full hover:border-accent hover:bg-pink-soft/40 transition text-center"
              >
                Get started free
              </Link>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-4 max-w-md mx-auto">
              {[
                { value: "₹299+", label: "From weekly" },
                { value: "NCR", label: "Soft launch" },
                { value: "Support", label: "WhatsApp" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/80 backdrop-blur rounded-2xl border border-border p-4 shadow-card">
                  <div className="font-display text-lg font-bold text-brand-gradient">{stat.value}</div>
                  <div className="text-[11px] text-ink-muted mt-0.5 uppercase tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/register" className="group rounded-2xl p-6 bg-white border border-border shadow-card hover:shadow-soft transition">
            <p className="text-xs font-bold uppercase tracking-widest text-pink">Need a Saathi</p>
            <h3 className="mt-2 font-display text-xl font-bold text-ink group-hover:text-accent">I want to book</h3>
            <p className="mt-2 text-sm text-ink-muted">Create account → browse → unlock plan when you book</p>
            <span className="mt-4 inline-block text-sm font-semibold text-accent">Get started →</span>
          </Link>
          <Link href="/register?type=provider" className="group rounded-2xl p-6 bg-brand-gradient text-white shadow-glow hover:opacity-95 transition">
            <p className="text-xs font-bold uppercase tracking-widest text-white/80">Wanna be a Saathi</p>
            <h3 className="mt-2 font-display text-xl font-bold">Earn as a provider</h3>
            <p className="mt-2 text-sm text-white/90">Same account · profile · go live with plan</p>
            <span className="mt-4 inline-block text-sm font-semibold">Start profile →</span>
          </Link>
        </div>
      </section>

      <section id="services" className="py-16 bg-white border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="text-xs font-bold tracking-widest uppercase text-pink mb-2">Services</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink">
              Something for every mood
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((s) => (
              <Link
                key={s.title}
                href="/find"
                className="group relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-card hover:shadow-soft transition"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full bg-gradient-to-br ${s.color} opacity-10 group-hover:opacity-20 transition`} />
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl shadow-sm`}>
                  {s.emoji}
                </div>
                <h3 className="mt-4 font-display font-bold text-ink group-hover:text-accent transition">{s.title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted leading-relaxed">{s.desc}</p>
                <p className="mt-3 text-sm font-semibold text-pink">{s.price}</p>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/find" className="btn-brand inline-flex px-8 py-3 rounded-full shadow-soft">
              Browse all Saathis →
            </Link>
          </div>
        </div>
      </section>

      <section id="faq" className="py-16 bg-cream">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-ink text-center mb-8">FAQ</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-border rounded-2xl overflow-hidden bg-white shadow-card">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-ink"
                >
                  {faq.q}
                  <span className="text-accent text-lg ml-4">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-ink-muted text-sm leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 bg-white border-t border-border text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="font-display text-2xl font-bold text-ink">Ready for soft launch?</h2>
          <p className="mt-2 text-ink-muted">Delhi NCR · plans from ₹299 · Razorpay</p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="btn-brand px-8 py-3.5 rounded-full shadow-glow">Get started</Link>
            <Link href="/safety" className="px-8 py-3.5 border-2 border-accent/40 text-accent font-semibold rounded-full hover:bg-pink-soft/50 transition">Safety rules</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

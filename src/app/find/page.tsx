"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";

const SERVICES = [
  "All", "Movie Partner", "Hanging Out", "Elder Care", "Clubbing",
  "Shopping Buddy", "Coffee Partner", "Travel Partner", "Event Partner", "Medical Support",
];

const CITIES = [
  "All Cities", "Delhi", "Mumbai", "Bangalore", "Pune", "Hyderabad",
  "Chennai", "Kolkata", "Ahmedabad", "Jaipur",
];

type Saathi = {
  id: string;
  name: string;
  city: string;
  services: string[];
  rate: number;
  rating: number;
  reviews: number;
  bio: string;
  image: string | null;
  verified: boolean;
};

function avatarUrl(name: string, image: string | null) {
  if (image && (image.startsWith("data:image/") || image.startsWith("https://"))) return image;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=256&font-size=0.4&bold=true`;
}

export default function FindPage() {
  const [selectedService, setSelectedService] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [search, setSearch] = useState("");
  const [list, setList] = useState<Saathi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/saathis")
      .then((r) => r.json())
      .then((data) => {
        const fromDb: Saathi[] = (data.saathis || []).filter(
          (s: Saathi) =>
            s.id &&
            s.name &&
            s.bio &&
            s.bio.length >= 20 &&
            Array.isArray(s.services) &&
            s.services.length > 0
        );
        setList(fromDb);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return list.filter((s) => {
      const matchService = selectedService === "All" || s.services.includes(selectedService);
      const matchCity = selectedCity === "All Cities" || s.city === selectedCity;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.bio.toLowerCase().includes(q) ||
        s.services.some((svc) => svc.toLowerCase().includes(q));
      return matchService && matchCity && matchSearch;
    });
  }, [list, selectedService, selectedCity, search]);

  return (
    <div className="min-h-screen bg-brand-soft">
      <BrandHeader active="find" />

      <section className="border-b border-border bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-xs font-bold tracking-widest uppercase text-pink mb-2">Browse</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink tracking-tight">
            Find a <span className="text-brand-gradient">Saathi</span>
          </h1>
          <p className="mt-3 text-ink-muted text-lg max-w-xl">
            Verified companions for movies, care, hangouts & more — across India.
          </p>

          <div className="mt-8 flex flex-col lg:flex-row gap-3">
            <input
              type="text"
              placeholder="Search name or service…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-5 py-3.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 text-ink shadow-card"
            />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-5 py-3.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 text-ink min-w-[160px]"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {SERVICES.map((svc) => (
              <button
                key={svc}
                type="button"
                onClick={() => setSelectedService(svc)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedService === svc
                    ? "btn-brand shadow-soft"
                    : "bg-white text-ink-muted border border-border hover:border-accent/40 hover:text-accent"
                }`}
              >
                {svc}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-sm text-ink-muted mb-6">
          {loading ? "Loading…" : (
            <><span className="font-bold text-accent">{filtered.length}</span> available</>
          )}
        </p>

        {filtered.length === 0 && !loading ? (
          <div className="text-center py-20">
            <h3 className="font-display text-xl font-bold text-ink">No Saathis yet</h3>
            <p className="text-ink-muted mt-2">Real verified profiles will appear here once providers go live.</p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                onClick={() => { setSelectedService("All"); setSelectedCity("All Cities"); setSearch(""); }}
                className="btn-brand px-6 py-2.5 rounded-full"
              >
                Clear filters
              </button>
              <Link href="/become-saathi" className="px-6 py-2.5 rounded-full border border-border text-sm font-medium hover:border-accent/40">
                Become a Saathi
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((saathi) => (
              <article
                key={saathi.id}
                className="bg-white rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-soft transition flex flex-col"
              >
                <Link href={`/saathi/${saathi.id}`} className="block">
                  <div className="aspect-[4/3] bg-gradient-to-br from-violet-100 to-pink-100 relative overflow-hidden">
                    <img src={avatarUrl(saathi.name, saathi.image)} alt={saathi.name} className="w-full h-full object-cover" />
                    {saathi.verified && (
                      <span className="absolute top-3 right-3 bg-brand-gradient text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                </Link>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/saathi/${saathi.id}`}>
                        <h3 className="font-display font-bold text-lg text-ink hover:text-accent">{saathi.name}</h3>
                      </Link>
                      <p className="text-sm text-ink-muted">{saathi.city}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-gold">★ {saathi.rating}</div>
                      <p className="text-xs text-ink-muted">{saathi.reviews > 0 ? `${saathi.reviews} reviews` : "New"}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-ink-muted line-clamp-2 flex-1">{saathi.bio}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {saathi.services.slice(0, 2).map((svc) => (
                      <span key={svc} className="text-[11px] bg-pink-soft text-pink px-2 py-0.5 rounded-full font-medium">{svc}</span>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <span className="font-display text-xl font-bold text-brand-gradient">₹{saathi.rate}</span>
                      <span className="text-sm text-ink-muted">/hr</span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/saathi/${saathi.id}`} className="px-3 py-2 text-sm font-medium text-ink-muted border border-border rounded-full hover:border-accent/40">Profile</Link>
                      <Link href={`/book/${saathi.id}`} className="btn-brand px-4 py-2 text-sm rounded-full">Book</Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-border bg-brand-gradient text-white py-14">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display text-2xl font-bold">Become a Saathi</h2>
          <p className="mt-2 text-white/85">Flexible hours · set your rates · earn up to ₹2,000/hr</p>
          <Link href="/become-saathi" className="inline-block mt-6 px-8 py-3 bg-white text-accent font-bold rounded-full hover:bg-pink-soft transition">
            Apply now
          </Link>
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-ink-muted">
        © 2026 Saathi<span className="text-pink font-semibold">Pro</span>
      </footer>
    </div>
  );
}

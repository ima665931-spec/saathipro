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

const DUMMY_SAATHIS = [
  { id: "1", name: "Priya Sharma", city: "Delhi", services: ["Movie Partner", "Coffee Partner", "Hanging Out"], rate: 1500, rating: 4.9, reviews: 128, bio: "Friendly and professional. Love movies and deep conversations.", image: null as string | null, verified: true },
  { id: "2", name: "Anjali Mehta", city: "Mumbai", services: ["Clubbing", "Event Partner", "Hanging Out"], rate: 2000, rating: 4.8, reviews: 94, bio: "Nightlife expert. Safe and fun companion for parties and events.", image: null, verified: true },
  { id: "3", name: "Sneha Reddy", city: "Bangalore", services: ["Elder Care", "Medical Support", "Shopping Buddy"], rate: 1200, rating: 5.0, reviews: 67, bio: "Patient and caring. Experienced in elder care and hospital visits.", image: null, verified: true },
  { id: "4", name: "Kavita Patel", city: "Pune", services: ["Travel Partner", "City Tour Partner", "Coffee Partner"], rate: 1800, rating: 4.7, reviews: 52, bio: "Love exploring cities. Great for local tours and travel companionship.", image: null, verified: true },
  { id: "5", name: "Riya Kapoor", city: "Delhi", services: ["Shopping Buddy", "Cafe & Food Partner", "Hanging Out"], rate: 1400, rating: 4.8, reviews: 89, bio: "Fashion and food enthusiast. Perfect shopping and cafe buddy.", image: null, verified: true },
  { id: "6", name: "Neha Singh", city: "Mumbai", services: ["Movie Partner", "Concert Partner", "Event Partner"], rate: 1600, rating: 4.9, reviews: 113, bio: "Movie buff and music lover. Always up for a good film or concert.", image: null, verified: true },
  { id: "7", name: "Pooja Iyer", city: "Bangalore", services: ["Professional Networking Partner", "Coffee Partner", "Hanging Out"], rate: 1500, rating: 4.6, reviews: 41, bio: "Startup enthusiast. Great for brainstorming and professional chats.", image: null, verified: true },
  { id: "8", name: "Meera Joshi", city: "Hyderabad", services: ["Elder Care", "Domestic Help", "Shopping Buddy"], rate: 1100, rating: 4.9, reviews: 76, bio: "Warm and reliable. Specialized in senior care and daily support.", image: null, verified: true },
];

type Saathi = (typeof DUMMY_SAATHIS)[0];

function avatarUrl(name: string, image: string | null) {
  if (image && (image.startsWith("data:image/") || image.startsWith("https://"))) return image;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=256&font-size=0.4&bold=true`;
}

export default function FindPage() {
  const [selectedService, setSelectedService] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [search, setSearch] = useState("");
  const [list, setList] = useState<Saathi[]>(DUMMY_SAATHIS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/saathis")
      .then((r) => r.json())
      .then((data) => {
        const fromDb: Saathi[] = (data.saathis || []).filter(
          (s: Saathi) => s.name && s.bio && s.bio.length >= 20 && Array.isArray(s.services) && s.services.length > 0
        );
        const dummyIds = new Set(DUMMY_SAATHIS.map((d) => d.id));
        setList([...DUMMY_SAATHIS, ...fromDb.filter((s) => !dummyIds.has(s.id))]);
      })
      .catch(() => {})
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
            <h3 className="font-display text-xl font-bold text-ink">No matches</h3>
            <p className="text-ink-muted mt-2">Try different filters</p>
            <button
              type="button"
              onClick={() => { setSelectedService("All"); setSelectedCity("All Cities"); setSearch(""); }}
              className="mt-6 btn-brand px-6 py-2.5 rounded-full"
            >
              Clear filters
            </button>
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

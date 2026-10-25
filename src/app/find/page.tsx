"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import BrandHeader from "@/components/BrandHeader";
import {
  SERVICE_CATALOG,
  CITY_LIST,
  SORT_OPTIONS,
  type SortId,
} from "@/lib/catalog";

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

function FindInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const loggedIn = status === "authenticated";

  const [selectedService, setSelectedService] = useState(
    searchParams.get("service") || "All"
  );
  const [selectedCity, setSelectedCity] = useState(
    searchParams.get("city") || "All Cities"
  );
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [searchDraft, setSearchDraft] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState<SortId>((searchParams.get("sort") as SortId) || "newest");
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get("verified") === "1");
  const [minRate, setMinRate] = useState(searchParams.get("minRate") || "");
  const [maxRate, setMaxRate] = useState(searchParams.get("maxRate") || "");
  const [list, setList] = useState<Saathi[]>([]);
  const [citiesFromDb, setCitiesFromDb] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const cityOptions = Array.from(
    new Set(["All Cities", ...CITY_LIST, ...citiesFromDb])
  );

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedService && selectedService !== "All") params.set("service", selectedService);
    if (selectedCity && selectedCity !== "All Cities") params.set("city", selectedCity);
    if (search.trim()) params.set("q", search.trim());
    if (sort && sort !== "newest") params.set("sort", sort);
    if (verifiedOnly) params.set("verified", "1");
    if (minRate) params.set("minRate", minRate);
    if (maxRate) params.set("maxRate", maxRate);

    const qs = params.toString();
    router.replace(qs ? `/find?${qs}` : "/find", { scroll: false });

    fetch(`/api/saathis?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setList(data.saathis || []);
        setTotal(data.meta?.total ?? (data.saathis || []).length);
        if (Array.isArray(data.meta?.cities)) setCitiesFromDb(data.meta.cities);
      })
      .catch(() => {
        setList([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [selectedService, selectedCity, search, sort, verifiedOnly, minRate, maxRate, router]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchDraft.trim()), 350);
    return () => clearTimeout(t);
  }, [searchDraft]);

  const clearFilters = () => {
    setSelectedService("All");
    setSelectedCity("All Cities");
    setSearch("");
    setSearchDraft("");
    setSort("newest");
    setVerifiedOnly(false);
    setMinRate("");
    setMaxRate("");
  };

  const hasFilters =
    selectedService !== "All" ||
    selectedCity !== "All Cities" ||
    !!search ||
    verifiedOnly ||
    !!minRate ||
    !!maxRate ||
    sort !== "newest";

  const bookHref = (id: string) =>
    loggedIn ? `/book/${id}` : `/login?callbackUrl=${encodeURIComponent(`/book/${id}`)}`;

  return (
    <div className="min-h-screen bg-brand-soft">
      <BrandHeader active="find" />

      {/* Guest guidance */}
      {status === "unauthenticated" && (
        <div className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-ink-muted">
              <strong className="text-ink">Browse free.</strong> To book a Saathi:{" "}
              <span className="text-ink">new user → Get started</span> ·{" "}
              <span className="text-ink">already have account → Sign in</span>
            </p>
            <div className="flex gap-2 shrink-0">
              <Link
                href="/login?callbackUrl=/find"
                className="px-4 py-2 text-sm font-semibold text-ink-muted border border-border rounded-full hover:border-accent/40"
              >
                Sign in
              </Link>
              <Link href="/register" className="btn-brand px-4 py-2 text-sm rounded-full">
                Get started — free
              </Link>
            </div>
          </div>
        </div>
      )}

      <section className="border-b border-border bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-xs font-bold tracking-widest uppercase text-pink mb-2">Browse</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink tracking-tight">
            Find a <span className="text-brand-gradient">Saathi</span>
          </h1>
          <p className="mt-3 text-ink-muted text-lg max-w-xl">
            Filter by city, service & budget — verified companions across India.
          </p>

          <div className="mt-8 flex flex-col lg:flex-row gap-3">
            <input
              type="text"
              placeholder="Search name, city or service…"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              className="flex-1 px-5 py-3.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 text-ink shadow-card"
            />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-5 py-3.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 text-ink min-w-[160px]"
            >
              {cityOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortId)}
              className="px-5 py-3.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 text-ink min-w-[160px]"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-ink-muted cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="accent-pink w-4 h-4"
              />
              Verified only
            </label>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-ink-muted">₹</span>
              <input
                type="number"
                min={0}
                placeholder="Min"
                value={minRate}
                onChange={(e) => setMinRate(e.target.value.replace(/\D/g, ""))}
                className="w-20 px-2 py-1.5 rounded-lg border border-border bg-white text-ink"
              />
              <span className="text-ink-muted">–</span>
              <input
                type="number"
                min={0}
                placeholder="Max"
                value={maxRate}
                onChange={(e) => setMaxRate(e.target.value.replace(/\D/g, ""))}
                className="w-20 px-2 py-1.5 rounded-lg border border-border bg-white text-ink"
              />
              <span className="text-ink-muted">/hr</span>
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-accent underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedService("All")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedService === "All"
                  ? "btn-brand shadow-soft"
                  : "bg-white text-ink-muted border border-border hover:border-accent/40 hover:text-accent"
              }`}
            >
              All
            </button>
            {SERVICE_CATALOG.map((svc) => (
              <button
                key={svc.id}
                type="button"
                onClick={() => setSelectedService(svc.label)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedService === svc.label
                    ? "btn-brand shadow-soft"
                    : "bg-white text-ink-muted border border-border hover:border-accent/40 hover:text-accent"
                }`}
              >
                <span className="mr-1">{svc.emoji}</span>
                {svc.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {["Delhi", "Mumbai", "Bangalore", "Pune", "Hyderabad", "Noida", "Gurgaon"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCity(selectedCity === c ? "All Cities" : c)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                  selectedCity === c
                    ? "border-accent text-accent bg-pink-soft"
                    : "border-border text-ink-muted hover:border-accent/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-sm text-ink-muted mb-6">
          {loading ? (
            "Loading…"
          ) : (
            <>
              <span className="font-bold text-accent">{total}</span> available
              {selectedCity !== "All Cities" && (
                <> in <strong className="text-ink">{selectedCity}</strong></>
              )}
              {selectedService !== "All" && (
                <> · <strong className="text-ink">{selectedService}</strong></>
              )}
            </>
          )}
        </p>

        {list.length === 0 && !loading ? (
          <div className="text-center py-20">
            <h3 className="font-display text-xl font-bold text-ink">No matches</h3>
            <p className="text-ink-muted mt-2 max-w-md mx-auto">
              Try another city or service.
            </p>
            <button type="button" onClick={clearFilters} className="btn-brand mt-6 px-6 py-2.5 rounded-full">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {list.map((saathi) => (
              <article
                key={saathi.id}
                className="bg-white rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-soft transition flex flex-col"
              >
                <Link href={`/saathi/${saathi.id}`} className="block">
                  <div className="aspect-[4/3] bg-gradient-to-br from-violet-100 to-pink-100 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarUrl(saathi.name, saathi.image)}
                      alt={saathi.name}
                      className="w-full h-full object-cover"
                    />
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
                        <h3 className="font-display font-bold text-lg text-ink hover:text-accent">
                          {saathi.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-ink-muted">{saathi.city}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-gold">★ {saathi.rating}</div>
                      <p className="text-xs text-ink-muted">
                        {saathi.reviews > 0 ? `${saathi.reviews} reviews` : "New"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-ink-muted line-clamp-2 flex-1">{saathi.bio}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {saathi.services.slice(0, 3).map((svc) => (
                      <button
                        key={svc}
                        type="button"
                        onClick={() => setSelectedService(svc)}
                        className="text-[11px] bg-pink-soft text-pink px-2 py-0.5 rounded-full font-medium hover:opacity-80"
                      >
                        {svc}
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <span className="font-display text-xl font-bold text-brand-gradient">
                        ₹{saathi.rate}
                      </span>
                      <span className="text-sm text-ink-muted">/hr</span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/saathi/${saathi.id}`}
                        className="px-3 py-2 text-sm font-medium text-ink-muted border border-border rounded-full hover:border-accent/40"
                      >
                        Profile
                      </Link>
                      <Link href={bookHref(saathi.id)} className="btn-brand px-4 py-2 text-sm rounded-full">
                        {loggedIn ? "Book" : "Sign in to book"}
                      </Link>
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
          <h2 className="font-display text-2xl font-bold">Wanna be a Saathi?</h2>
          <p className="mt-2 text-white/85">Same account · set rates · go live after plan</p>
          <Link
            href={loggedIn ? "/become-saathi" : "/register?type=provider"}
            className="inline-block mt-6 px-8 py-3 bg-white text-accent font-bold rounded-full hover:bg-pink-soft transition"
          >
            {loggedIn ? "Create profile" : "Get started as provider"}
          </Link>
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-ink-muted">
        © 2026 Saathi<span className="text-pink font-semibold">Pro</span>
      </footer>
    </div>
  );
}

export default function FindPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-brand-soft text-sm text-ink-muted">
          Loading…
        </div>
      }
    >
      <FindInner />
    </Suspense>
  );
}

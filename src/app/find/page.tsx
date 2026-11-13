"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import BrandHeader from "@/components/BrandHeader";
import {
  SERVICE_LABELS,
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
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const chipLabels = ["All", ...SERVICE_LABELS];

  return (
    <div className="pb-2">
      <div className="hidden md:block -mx-4 mb-4">
        <BrandHeader active="find" />
      </div>

      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm">🔍</span>
          <input
            type="search"
            placeholder="Name, city, service…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-violet-300 shadow-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={`shrink-0 h-11 px-3 rounded-2xl border text-xs font-bold ${
            filtersOpen || hasFilters
              ? "border-violet-300 bg-violet-50 text-violet-700"
              : "border-border bg-white text-ink-muted"
          }`}
        >
          Filters{hasFilters ? " •" : ""}
        </button>
      </div>

      <div className="mt-3 -mx-1 overflow-x-auto">
        <div className="flex gap-2 px-1 pb-1 min-w-min">
          {chipLabels.map((svc) => {
            const active = selectedService === svc;
            return (
              <button
                key={svc}
                type="button"
                onClick={() => setSelectedService(svc)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  active
                    ? "bg-brand-gradient text-white border-transparent"
                    : "bg-white text-ink-muted border-border"
                }`}
              >
                {svc}
              </button>
            );
          })}
        </div>
      </div>

      {filtersOpen && (
        <div className="mt-3 rounded-2xl border border-border bg-white p-3 space-y-3 shadow-card">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] font-semibold text-ink-muted block">
              City
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="mt-1 w-full px-2 py-2 rounded-xl border border-border text-sm bg-white"
              >
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] font-semibold text-ink-muted block">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortId)}
                className="mt-1 w-full px-2 py-2 rounded-xl border border-border text-sm bg-white"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] font-semibold text-ink-muted block">
              Min ₹/hr
              <input
                type="number"
                inputMode="numeric"
                value={minRate}
                onChange={(e) => setMinRate(e.target.value)}
                placeholder="0"
                className="mt-1 w-full px-2 py-2 rounded-xl border border-border text-sm"
              />
            </label>
            <label className="text-[11px] font-semibold text-ink-muted block">
              Max ₹/hr
              <input
                type="number"
                inputMode="numeric"
                value={maxRate}
                onChange={(e) => setMaxRate(e.target.value)}
                placeholder="Any"
                className="mt-1 w-full px-2 py-2 rounded-xl border border-border text-sm"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded border-border"
            />
            Verified only
          </label>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="text-xs font-semibold text-violet-600">
              Clear all filters
            </button>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-ink-muted">
        {loading ? "Searching…" : `${total} Saathi${total === 1 ? "" : "s"}`}
        {selectedService !== "All" ? ` · ${selectedService}` : ""}
        {selectedCity !== "All Cities" ? ` · ${selectedCity}` : ""}
      </p>

      <div className="mt-3 space-y-3">
        {loading && list.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-white border border-border animate-pulse" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl bg-white border border-border p-8 text-center shadow-card">
            <p className="font-semibold text-ink text-sm">No matches</p>
            <p className="text-xs text-ink-muted mt-1">Try another city or clear filters.</p>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="mt-3 text-xs font-bold text-violet-600">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          list.map((saathi) => (
            <article
              key={saathi.id}
              className="flex gap-3 rounded-2xl bg-white border border-border p-3 shadow-card"
            >
              <Link href={`/saathi/${saathi.id}`} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl(saathi.name, saathi.image)}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover bg-violet-100"
                />
              </Link>
              <div className="min-w-0 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/saathi/${saathi.id}`}
                      className="font-bold text-sm text-ink truncate block hover:text-violet-700"
                    >
                      {saathi.name}
                      {saathi.verified ? " ✓" : ""}
                    </Link>
                    <p className="text-[11px] text-ink-muted truncate">
                      {saathi.city} · ★ {saathi.rating}
                      {saathi.reviews ? ` (${saathi.reviews})` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-violet-700 shrink-0">
                    ₹{saathi.rate}
                    <span className="text-[10px] font-medium text-ink-muted">/hr</span>
                  </p>
                </div>
                {saathi.services?.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {saathi.services.slice(0, 3).map((svc) => (
                      <button
                        key={svc}
                        type="button"
                        onClick={() => setSelectedService(svc)}
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 font-medium"
                      >
                        {svc}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-auto pt-2 flex gap-2">
                  <Link
                    href={`/saathi/${saathi.id}`}
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full border border-border text-ink-muted"
                  >
                    Profile
                  </Link>
                  <Link
                    href={bookHref(saathi.id)}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full text-white bg-brand-gradient"
                  >
                    {loggedIn ? "Book" : "Sign in"}
                  </Link>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {loggedIn && (
        <p className="mt-6 text-center text-xs text-ink-muted">
          Want to earn?{" "}
          <Link href="/become-saathi" className="font-semibold text-violet-600">
            Create Saathi profile
          </Link>
        </p>
      )}
    </div>
  );
}

export default function FindPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-ink-muted">Loading…</div>}>
      <FindInner />
    </Suspense>
  );
}

import { useMemo, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { Chip } from "../components/Chip";
import { MenuGridCard } from "../components/MenuGridCard";
import { PageTransition } from "../components/PageTransition";
import { TopBar } from "../components/TopBar";
import { categories, menuItems } from "../data/menu";
import type { ItemType, MenuItem } from "../types/menu";

type FilterId = "pedas" | "manis" | "keju";

const FILTERS: { id: FilterId; label: string; test: (item: MenuItem) => boolean }[] = [
  { id: "pedas", label: "Pedas", test: (i) => i.spicy === true },
  { id: "manis", label: "Manis", test: (i) => i.taste_draft.some((t) => t.includes("manis")) },
  { id: "keju", label: "Keju", test: (i) => i.contains.includes("keju") },
];

export function MenuExplore() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ItemType | "all">("all");
  const [filters, setFilters] = useState<FilterId[]>([]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (category !== "all" && item.type !== category) return false;
      if (!FILTERS.filter((f) => filters.includes(f.id)).every((f) => f.test(item))) return false;
      if (!q) return true;
      return [item.name, ...item.taste_draft, ...item.ingredients].some((s) =>
        s.toLowerCase().includes(q)
      );
    });
  }, [query, category, filters]);

  const toggleFilter = (id: FilterId) =>
    setFilters((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));

  const clearAll = () => {
    setQuery("");
    setCategory("all");
    setFilters([]);
  };

  return (
    <PageTransition>
      <div className="sticky top-0 z-20 bg-cream/95 pb-3 backdrop-blur">
        <TopBar title="Semua Menu" />
        <div className="px-5">
          <label className="relative block">
            <span className="sr-only">Cari menu</span>
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-subtle" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari burger, ayam, keju…"
              className="h-12 w-full rounded-2xl border border-cream-line bg-white pl-12 pr-11 text-[15px] text-ink placeholder:text-ink-subtle focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Hapus pencarian"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-cream">
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </label>
        </div>

        <div role="tablist" aria-label="Kategori menu" className="no-scrollbar mt-3 flex gap-5 overflow-x-auto border-b border-cream-line px-5">
          {categories.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`relative h-11 shrink-0 whitespace-nowrap text-sm font-bold transition-colors duration-150 ${
                  active ? "text-forest" : "text-ink-muted hover:text-ink"
                }`}>
                {cat.label}
                {active && <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-ember" />}
              </button>
            );
          })}
        </div>

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-5">
          {FILTERS.map((f) => (
            <Chip key={f.id} label={f.label} selected={filters.includes(f.id)} onClick={() => toggleFilter(f.id)} />
          ))}
        </div>
      </div>

      <main className="px-5 pt-2 pb-[calc(8rem+env(safe-area-inset-bottom,0px))]">
        <p className="mb-3 text-xs font-semibold text-ink-muted" aria-live="polite">
          {visible.length} menu
        </p>
        {visible.length === 0 ? (
          <div className="rounded-[20px] bg-white p-6 text-center shadow-card">
            <p className="font-bold text-ink">Menu tidak ditemukan</p>
            <p className="mt-1 text-sm text-ink-muted">Coba kata kunci lain atau hapus filternya.</p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-4 h-11 rounded-2xl bg-forest px-5 text-sm font-bold text-white hover:bg-forest-dark">
              Reset pencarian
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visible.map((item) => (
              <MenuGridCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </PageTransition>
  );
}

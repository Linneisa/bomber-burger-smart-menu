import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { BestSellerBadge } from "../components/BestSellerBadge";
import { HeroCarousel } from "../components/HeroCarousel";
import { MenuImage } from "../components/MenuImage";
import { PageTransition } from "../components/PageTransition";
import { HalalBadge, Wordmark } from "../components/Wordmark";
import { bestSellerItems, menuItems } from "../data/menu";
import { formatRupiah } from "../utils/format";

/** Hero photos, in rotation order. Single burgers only (no trays/shakes); unknown ids are skipped. */
const HERO_ITEM_IDS = [
  "double_beef",
  "smoky_sweet_bbq",
  "buffalo_chicken",
  "ceo_phillystack",
  "sweet_sensation",
  "og_burger",
];

const HERO_ITEMS = HERO_ITEM_IDS.map((id) => menuItems.find((m) => m.id === id)).filter(
  (m): m is NonNullable<typeof m> => m !== undefined && (m.type === "beef_burger" || m.type === "chicken_burger")
);

const HOW_IT_WORKS = [
  { title: "Pilih menu", text: "Pakai bantuan AI atau lihat semua menu sendiri." },
  { title: "Simpan ke Pilihanku", text: "Kumpulkan menu yang kamu mau dalam satu daftar." },
  { title: "Sebutkan ke kasir", text: "Tunjukkan layar Pilihanku. Pesan dan bayar di kasir." },
];

export function Home() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <header className="px-5 pt-5">
        <div className="flex items-center justify-between gap-2">
          <Wordmark size="md" />
          <HalalBadge />
        </div>

        <div className="mt-5 rounded-[24px] bg-forest p-5 text-white">
          <h1 className="text-[28px] font-extrabold leading-[1.15] tracking-tight">
            Bingung mau pesan apa? Pilih dulu sebelum sampai kasir.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/80">
            Jawab beberapa pertanyaan singkat, AI kami pilihkan 3 menu yang paling pas buat kamu.
          </p>

          <HeroCarousel items={HERO_ITEMS} />

          <div className="mt-6 grid gap-3">
            <button
              type="button"
              onClick={() => navigate("/preferensi")}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-ember text-[17px] font-extrabold text-white transition-[background-color,transform] duration-150 ease-snappy hover:bg-ember-dark active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ember/40">
              <SparklesIcon className="h-5 w-5" aria-hidden />
              Bantu Aku Pilih (AI)
            </button>
            <button
              type="button"
              onClick={() => navigate("/menu")}
              className="flex h-14 items-center justify-center rounded-2xl border border-white/60 text-base font-bold text-white transition-[background-color,transform] duration-150 ease-snappy hover:bg-white/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30">
              Lihat Semua Menu
            </button>
          </div>
        </div>
      </header>

      <main className="pb-[calc(8rem+env(safe-area-inset-bottom,0px))]">
        {bestSellerItems.length > 0 && (
          <section className="pt-8" aria-labelledby="favorit-heading">
            <div className="flex items-end justify-between px-5">
              <h2 id="favorit-heading" className="text-lg font-extrabold text-ink">
                Rekomendasi Best Seller
              </h2>
              <Link to="/menu" className="flex items-center gap-1 text-sm font-bold text-ember-dark hover:text-ember">
                Semua <ArrowRightIcon className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <ul className="no-scrollbar mt-4 flex gap-3 overflow-x-auto px-5 pb-2">
              {bestSellerItems.map((item) => (
                <li key={item.id} className="w-40 shrink-0">
                  <Link
                    to={`/menu/${item.id}`}
                    className="block overflow-hidden rounded-[18px] bg-white shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
                    <div className="relative aspect-square overflow-hidden bg-white">
                      <MenuImage src={item.image} name={item.name} className="h-full w-full object-contain" />
                      <BestSellerBadge className="absolute bottom-2 left-2" />
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-bold text-ink">{item.name}</p>
                      <p className="mt-0.5 text-sm font-extrabold text-ink-muted">
                        {formatRupiah(item.price_idr)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="px-5 pt-8" aria-labelledby="cara-heading">
          <h2 id="cara-heading" className="text-lg font-extrabold text-ink">
            Cara pakai selama antre
          </h2>
          <ol className="mt-4 space-y-0">
            {HOW_IT_WORKS.map((step, i) => (
              <li key={step.title} className="relative flex gap-4 pb-5 last:pb-0">
                {i < HOW_IT_WORKS.length - 1 && (
                  <span className="absolute left-[15px] top-9 h-[calc(100%-2.5rem)] w-px bg-cream-line" aria-hidden />
                )}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-light text-sm font-extrabold text-forest">
                  {i + 1}
                </span>
                <div className="pt-1">
                  <p className="font-bold text-ink">{step.title}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </PageTransition>
  );
}

import { AnimatePresence, motion } from "framer-motion";
import { BookmarkIcon, MegaphoneIcon, PlusIcon, SparklesIcon, XIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { PageTransition } from "../components/PageTransition";
import { TopBar } from "../components/TopBar";
import { usePicks } from "../contexts/PicksContext";
import { categoryLabels, menuItems } from "../data/menu";
import type { MenuItem } from "../types/menu";
import { formatPrice } from "../utils/format";

export function Picks() {
  const { picks, remove } = usePicks();
  const navigate = useNavigate();
  const items = picks
    .map((id) => menuItems.find((m) => m.id === id))
    .filter((m): m is MenuItem => Boolean(m));

  return (
    <PageTransition>
      <div className="sticky top-0 z-20 bg-cream/95 backdrop-blur">
        <TopBar title="Pilihanku" />
      </div>

      <main className="px-5 pb-12">
        <div className="flex gap-3 rounded-[20px] bg-forest p-4 text-white">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sun text-ink">
            <MegaphoneIcon className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-[15px] font-semibold leading-relaxed">
            Sebutkan atau tunjukkan layar ini ke kasir. Pemesanan dan pembayaran dilakukan di kasir.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="mt-6 rounded-[20px] bg-white px-6 py-10 text-center shadow-card">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest-light text-forest">
              <BookmarkIcon className="h-6 w-6" aria-hidden />
            </span>
            <p className="mt-4 text-lg font-extrabold text-ink">Pilihanku masih kosong</p>
            <p className="mt-1 text-sm text-ink-muted">
              Simpan menu yang kamu suka supaya gampang disebutkan ke kasir.
            </p>
          </div>
        ) : (
          <section className="mt-6" aria-labelledby="list-heading">
            <h2 id="list-heading" className="text-sm font-bold text-ink-muted">
              {items.length} menu dipilih
            </h2>
            <ul className="mt-3 overflow-hidden rounded-[20px] bg-white shadow-card">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                    className="border-b border-cream-line last:border-b-0">
                    <div className="flex items-center gap-3 p-3">
                      <Link
                        to={`/menu/${item.id}`}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-forest-light">
                          <img
                            src={item.image}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-base font-extrabold text-ink">{item.name}</p>
                          <p className="text-xs text-ink-muted">{categoryLabels[item.type]}</p>
                          <p className={`mt-0.5 text-sm font-bold ${item.price_idr === null ? "text-ink-muted" : "text-forest"}`}>
                            {formatPrice(item.price_idr)}
                          </p>
                        </div>
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        aria-label={`Hapus ${item.name}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-150 hover:bg-chili-light hover:text-chili focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chili">
                        <XIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </section>
        )}

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={() => navigate("/menu")}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-forest text-base font-bold text-white transition-[background-color,transform] duration-150 ease-snappy hover:bg-forest-dark active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest/30">
            <PlusIcon className="h-5 w-5" aria-hidden />
            Tambah menu lain
          </button>
          <button
            type="button"
            onClick={() => navigate("/preferensi")}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-cream-line bg-white text-base font-bold text-ink transition-[border-color,transform] duration-150 ease-snappy hover:border-forest/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest/30">
            <SparklesIcon className="h-5 w-5 text-ember" aria-hidden />
            Cari rekomendasi lagi
          </button>
        </div>
      </main>
    </PageTransition>
  );
}

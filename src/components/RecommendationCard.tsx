import { motion, useReducedMotion } from "framer-motion";
import { CheckIcon, ChevronRightIcon, InfoIcon, PlusIcon, SparklesIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { usePicks } from "../contexts/PicksContext";
import { useSavePick } from "../hooks/useSavePick";
import type { Recommendation } from "../types/menu";
import { formatRupiah, formatSetPrice } from "../utils/format";
import { BestSellerBadge } from "./BestSellerBadge";
import { ExtraBeefPicker } from "./ExtraBeefPicker";
import { MenuImage } from "./MenuImage";

interface RecommendationCardProps {
  recommendation: Recommendation;
  rank: number;
}

export function RecommendationCard({ recommendation, rank }: RecommendationCardProps) {
  const { item, reason, unverified } = recommendation;
  const { isPicked } = usePicks();
  const toggle = useSavePick();
  const saved = isPicked(item.id);
  const reduce = useReducedMotion();
  // "pedas" as a taste tag and the spicy flag would show twice; keep only the red chip
  const tasteTags = item.taste_draft.filter((tag) => tag !== "pedas");
  const spicy = item.spicy || item.taste_draft.includes("pedas");
  const setPrice = formatSetPrice(item.set_price_idr);

  return (
    <motion.article
      initial={{ opacity: 0, y: reduce ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: rank * 0.06, ease: [0.23, 1, 0.32, 1] }}
      className="overflow-hidden rounded-[20px] bg-white shadow-card">

      {/* Photo and name open the same detail page as "Lihat Detail"; the Extra Beef size and Pilihanku live in PicksContext, so they carry over */}
      <Link
        to={`/menu/${item.id}`}
        aria-label={`Lihat detail ${item.name}`}
        className="relative block aspect-[16/10] cursor-pointer bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-forest">
        <MenuImage src={item.image} name={item.name} className="h-full w-full object-contain transition-transform duration-200 hover:scale-[1.02]" />
        {(rank === 0 || item.best_seller) && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {rank === 0 && (
              <span className="rounded-full bg-sun px-2.5 py-1 text-[11px] font-extrabold text-ink">Paling cocok</span>
            )}
            {item.best_seller && <BestSellerBadge />}
          </div>
        )}
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-extrabold leading-snug text-ink">
            <Link
              to={`/menu/${item.id}`}
              aria-label={`Lihat detail ${item.name}`}
              className="cursor-pointer rounded hover:text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
              {item.name}
            </Link>
          </h3>
          <span className={`shrink-0 pt-0.5 text-base font-extrabold ${item.price_idr === null ? "text-ink-muted" : "text-forest"}`}>
            {formatRupiah(item.price_idr)}
          </span>
        </div>
        {setPrice && <p className="mt-0.5 text-xs font-semibold text-ink-muted">{setPrice}</p>}

        {unverified && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sun-light px-2.5 py-1 text-xs font-semibold text-ink">
            <InfoIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Bahan belum dipastikan, tanyakan ke kasir
          </p>
        )}

        {(tasteTags.length > 0 || spicy) && (
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Profil rasa">
            {tasteTags.map((tag) => (
              <li key={tag} className="rounded-full bg-cream px-2.5 py-1 text-xs font-semibold text-ink-muted capitalize">
                {tag}
              </li>
            ))}
            {spicy && (
              <li className="rounded-full bg-chili-light px-2.5 py-1 text-xs font-semibold text-chili">Pedas</li>
            )}
          </ul>
        )}

        <div className="mt-4 rounded-2xl bg-forest-light p-3.5">
          <p className="flex items-center gap-1.5 text-sm font-bold text-forest">
            <SparklesIcon className="h-4 w-4" aria-hidden />
            Kenapa cocok buat kamu
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">{reason}</p>
        </div>

        <ExtraBeefPicker item={item} className="mt-4" />

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggle(item)}
            aria-pressed={saved}
            aria-label={saved ? `${item.name} ada di Pilihanku, ketuk untuk menghapus` : `Tambah ${item.name} ke Pilihanku`}
            className={`flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl text-sm font-bold transition-[background-color,color,transform] duration-150 ease-snappy active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 ${
              saved ? "border border-forest bg-forest-light text-forest" : "bg-forest text-white hover:bg-forest-dark"
            }`}>
            {saved ? <CheckIcon className="h-5 w-5 shrink-0" aria-hidden /> : <PlusIcon className="h-5 w-5 shrink-0" aria-hidden />}
            {saved ? "Ada di Pilihanku" : "Tambah ke Pilihanku"}
          </button>
          <Link
            to={`/menu/${item.id}`}
            aria-label={`Lihat detail ${item.name}`}
            className="flex h-12 shrink-0 items-center gap-0.5 whitespace-nowrap rounded-xl px-1 text-sm font-bold text-ember-dark hover:text-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
            {/* "Lihat" drops below 380px so "Tambah ke Pilihanku" fits on one line at 360px */}
            <span className="hidden min-[380px]:inline">Lihat&nbsp;</span>Detail
            <ChevronRightIcon className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

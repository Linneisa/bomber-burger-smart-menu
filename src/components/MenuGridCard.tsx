import { CheckIcon, FlameIcon, PlusIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { usePicks } from "../contexts/PicksContext";
import { useSavePick } from "../hooks/useSavePick";
import type { MenuItem } from "../types/menu";
import { formatRupiah } from "../utils/format";
import { BestSellerBadge } from "./BestSellerBadge";
import { ExtraBeefPicker } from "./ExtraBeefPicker";
import { MenuImage } from "./MenuImage";

export function MenuGridCard({ item }: { item: MenuItem }) {
  const { isPicked } = usePicks();
  const toggle = useSavePick();
  const saved = isPicked(item.id);

  const tasteLabel = item.taste_draft.slice(0, 2).join(" • ");

  return (
    <article className="relative flex flex-col overflow-hidden rounded-[18px] bg-white shadow-card">
      <Link
        to={`/menu/${item.id}`}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-forest rounded-[18px]">

        <div className="relative aspect-[4/3] overflow-hidden bg-white">
          <MenuImage src={item.image} name={item.name} className="h-full w-full object-contain" />
          {item.best_seller && <BestSellerBadge className="absolute bottom-2 left-2" />}
        </div>
        <div className="flex flex-1 flex-col p-3">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-5 text-ink">{item.name}</h3>
          <p className="mt-1 truncate text-xs text-ink-muted">{tasteLabel}</p>
          <div className="mt-auto flex items-center justify-between pt-2.5">
            <span className={`text-[15px] font-extrabold ${item.price_idr === null ? "text-ink-muted" : "text-forest"}`}>
              {formatRupiah(item.price_idr)}
            </span>
            {item.spicy && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-chili-light px-1.5 py-0.5 text-[11px] font-bold text-chili">
                <FlameIcon className="h-3 w-3" aria-hidden />
                Pedas
              </span>
            )}
          </div>
        </div>
      </Link>
      <ExtraBeefPicker item={item} variant="compact" className="px-3 pb-3" />
      <button
        type="button"
        onClick={() => toggle(item)}
        aria-pressed={saved}
        aria-label={saved ? `${item.name} ada di Pilihanku, ketuk untuk menghapus` : `Tambah ${item.name} ke Pilihanku`}
        className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full shadow-card transition-[background-color,transform] duration-150 ease-snappy active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest ${
          saved ? "bg-forest text-white" : "bg-white text-forest"
        }`}>
        {saved ? <CheckIcon className="h-4 w-4" aria-hidden /> : <PlusIcon className="h-4 w-4" aria-hidden />}
      </button>
    </article>
  );
}

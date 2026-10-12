import { BeefIcon } from "lucide-react";
import { useId } from "react";
import { usePicks } from "../contexts/PicksContext";
import { usePreferences } from "../contexts/PreferenceContext";
import { extraBeefOptions } from "../data/menu";
import type { ExtraBeefSize, MenuItem } from "../types/menu";
import { formatRupiah } from "../utils/format";
import { extraBeefOptionsFor } from "../utils/picksTotal";
import { buildCriteria } from "../utils/recommend";

/** "Standar" or "M (+Rp25.200)". Only size names and prices: patty counts per size are not confirmed. */
function optionText(label: string, price: number): string {
  return price > 0 ? `${label} (+${formatRupiah(price)})` : label;
}

/** True when the customer picked the "Lapar berat" chip or wrote that they are very hungry. */
function useWantsBigPortion(): boolean {
  const { selections, text } = usePreferences();
  return buildCriteria(selections, text).porsi === "besar";
}

interface ExtraBeefPickerProps {
  item: MenuItem;
  /** "chips": all sizes as buttons (detail page, recommendation card); "compact": a dropdown (menu grid card) */
  variant?: "chips" | "compact";
  className?: string;
}

/** Optional Extra Beef size for eligible single beef burgers; renders nothing for any other item. */
export function ExtraBeefPicker({ item, variant = "chips", className = "" }: ExtraBeefPickerProps) {
  const { extraBeefFor, setExtraBeef } = usePicks();
  const wantsBig = useWantsBigPortion();
  const labelId = useId();
  const options = extraBeefOptionsFor(item, extraBeefOptions);
  if (options.length === 0) return null;
  const current = extraBeefFor(item.id);

  const hint = wantsBig && (
    <p className="mb-1.5 text-xs font-semibold text-ember-dark">Mau porsi lebih besar? Tambah Extra Beef</p>
  );

  if (variant === "compact") {
    return (
      <div className={className}>
        {hint}
        <label htmlFor={labelId} className="sr-only">
          Tambah Extra Beef untuk {item.name}
        </label>
        <select
          id={labelId}
          value={current}
          onChange={(e) => setExtraBeef(item.id, e.target.value as ExtraBeefSize)}
          className="h-9 w-full rounded-xl border border-cream-line bg-cream px-2 text-xs font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
          {options.map((o) => (
            <option key={o.size} value={o.size}>
              {o.size === "S" ? "Extra Beef: Standar" : `Extra Beef ${optionText(o.label, o.price_idr)}`}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={className} role="group" aria-labelledby={labelId}>
      {hint}
      <p id={labelId} className="flex items-center gap-1.5 text-sm font-bold text-ink">
        <BeefIcon className="h-4 w-4 text-ember-dark" aria-hidden />
        Tambah Extra Beef <span className="font-semibold text-ink-muted">(opsional)</span>
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = o.size === current;
          return (
            <li key={o.size}>
              <button
                type="button"
                onClick={() => setExtraBeef(item.id, o.size)}
                aria-pressed={active}
                className={`rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest ${
                  active ? "border-forest bg-forest text-white" : "border-cream-line bg-white text-ink hover:border-forest/40"
                }`}>
                {optionText(o.label, o.price_idr)}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

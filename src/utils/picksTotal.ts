/*
 * Pilihanku lines and the estimated total. Pure, so scripts/test-claims.ts can test it.
 * Relative imports use ".js" so the file also runs under tsx/Node ESM.
 */
import type { ExtraBeefOption, ExtraBeefSize, MenuItem } from "../types/menu.js";

export interface PickLine {
  item: MenuItem;
  /** Chosen Extra Beef size above Standar; null when none or the burger is not eligible */
  extraBeef: ExtraBeefOption | null;
}

/** Extra Beef sizes the item may take; empty for anything that is not an eligible single beef burger. */
export function extraBeefOptionsFor(item: MenuItem, options: readonly ExtraBeefOption[]): ExtraBeefOption[] {
  return item.extra_beef_eligible ? [...options] : [];
}

/** Saved ids → lines in saved order. Unknown ids are dropped; Standar or ineligible extras are ignored. */
export function buildPickLines(
  ids: readonly string[],
  extras: Readonly<Record<string, ExtraBeefSize | undefined>>,
  menu: readonly MenuItem[],
  options: readonly ExtraBeefOption[]
): PickLine[] {
  return ids.flatMap((id) => {
    const item = menu.find((m) => m.id === id);
    if (!item) return [];
    const size = extras[id];
    const extra = extraBeefOptionsFor(item, options).find((o) => o.size === size && o.size !== "S") ?? null;
    return [{ item, extraBeef: extra }];
  });
}

/** One of each saved item at its single price plus its Extra Beef charge; items without a price are counted apart. */
export function estimateTotal(lines: readonly PickLine[]): { total: number; unpriced: number } {
  let total = 0;
  let unpriced = 0;
  for (const { item, extraBeef } of lines) {
    if (item.price_idr === null) {
      unpriced++;
      continue;
    }
    total += item.price_idr + (extraBeef?.price_idr ?? 0);
  }
  return { total, unpriced };
}

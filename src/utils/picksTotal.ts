/*
 * Pilihanku lines and the estimated total. Pure, so scripts/test-claims.ts can test it.
 * Relative imports use ".js" so the file also runs under tsx/Node ESM.
 */
import type { ExtraBeefOption, ExtraBeefSize, MenuItem } from "../types/menu.js";

/** One saved menu in Pilihanku */
export interface PickEntry {
  id: string;
  qty: number;
}

export const MAX_QTY = 20;

/**
 * Saved Pilihanku in any stored shape → entries. Old format: an array of ids (qty 1 each).
 * Duplicates are merged, qty is clamped to 1..MAX_QTY, anything else is dropped.
 */
export function normalizePicks(raw: unknown): PickEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: PickEntry[] = [];
  for (const entry of raw) {
    const id = typeof entry === "string" ? entry : (entry as { id?: unknown } | null)?.id;
    if (typeof id !== "string" || !id) continue;
    const rawQty = typeof entry === "string" ? 1 : Number((entry as { qty?: unknown }).qty ?? 1);
    if (!Number.isFinite(rawQty) || rawQty < 1) continue;
    const qty = Math.min(MAX_QTY, Math.floor(rawQty));
    const existing = out.find((e) => e.id === id);
    if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + qty);
    else out.push({ id, qty });
  }
  return out;
}

export interface PickLine {
  item: MenuItem;
  qty: number;
  /** Chosen Extra Beef size above Standar; null when none or the burger is not eligible */
  extraBeef: ExtraBeefOption | null;
}

/** Extra Beef sizes the item may take; empty for anything that is not an eligible single beef burger. */
export function extraBeefOptionsFor(item: MenuItem, options: readonly ExtraBeefOption[]): ExtraBeefOption[] {
  return item.extra_beef_eligible ? [...options] : [];
}

/** Saved entries → lines in saved order. Unknown ids are dropped; Standar or ineligible extras are ignored. */
export function buildPickLines(
  picks: readonly PickEntry[],
  extras: Readonly<Record<string, ExtraBeefSize | undefined>>,
  menu: readonly MenuItem[],
  options: readonly ExtraBeefOption[]
): PickLine[] {
  return picks.flatMap(({ id, qty }) => {
    const item = menu.find((m) => m.id === id);
    if (!item) return [];
    const size = extras[id];
    const extra = extraBeefOptionsFor(item, options).find((o) => o.size === size && o.size !== "S") ?? null;
    return [{ item, qty, extraBeef: extra }];
  });
}

/** (Single price + Extra Beef charge) × qty per line; lines without a price are counted apart. */
export function estimateTotal(lines: readonly PickLine[]): { total: number; unpriced: number } {
  let total = 0;
  let unpriced = 0;
  for (const { item, qty, extraBeef } of lines) {
    if (item.price_idr === null) {
      unpriced++;
      continue;
    }
    total += (item.price_idr + (extraBeef?.price_idr ?? 0)) * qty;
  }
  return { total, unpriced };
}

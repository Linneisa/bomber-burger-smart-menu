/*
 * Pilihanku entries, lines and the estimated total. Pure, so scripts/test-claims.ts can test it.
 * Relative imports use ".js" so the file also runs under tsx/Node ESM.
 */
import type { ExtraBeefOption, ExtraBeefSize, MenuItem } from "../types/menu.js";

/**
 * One saved menu variant in Pilihanku. The identity is id + Extra Beef size ("beef_jr|XXL"):
 * the same burger in two sizes is two entries, each with its own qty. "S" = Standar / no extra.
 */
export interface PickEntry {
  id: string;
  qty: number;
  size: ExtraBeefSize;
}

export const MAX_QTY = 20;

const SIZES: readonly ExtraBeefSize[] = ["S", "R", "M", "L", "XL", "XXL"];

/** "beef_jr|S", "beef_jr|XXL" */
export function pickKey(id: string, size: ExtraBeefSize = "S"): string {
  return `${id}|${size}`;
}

const clampQty = (qty: number) => Math.min(MAX_QTY, Math.floor(qty));

/**
 * Saved Pilihanku in any stored shape → entries. Old formats: an array of ids (qty 1), or
 * { id, qty } without a size; both count as Standar. Same id + size is merged, qty is clamped to
 * 1..MAX_QTY, an unknown size becomes Standar, anything else is dropped.
 */
export function normalizePicks(raw: unknown): PickEntry[] {
  if (!Array.isArray(raw)) return [];
  let out: PickEntry[] = [];
  for (const entry of raw) {
    const id = typeof entry === "string" ? entry : (entry as { id?: unknown } | null)?.id;
    if (typeof id !== "string" || !id) continue;
    const rawQty = typeof entry === "string" ? 1 : Number((entry as { qty?: unknown }).qty ?? 1);
    if (!Number.isFinite(rawQty) || rawQty < 1) continue;
    const rawSize = typeof entry === "string" ? undefined : (entry as { size?: unknown }).size;
    const size = SIZES.includes(rawSize as ExtraBeefSize) ? (rawSize as ExtraBeefSize) : "S";
    out = addPick(out, id, size, clampQty(rawQty));
  }
  return out;
}

/** True if this exact variant (id + size) is in Pilihanku. */
export function hasPick(picks: readonly PickEntry[], id: string, size: ExtraBeefSize = "S"): boolean {
  return picks.some((p) => p.id === id && p.size === size);
}

/** Adds qty to the variant, appending it if it isn't saved yet. */
export function addPick(picks: readonly PickEntry[], id: string, size: ExtraBeefSize = "S", qty = 1): PickEntry[] {
  if (qty < 1) return [...picks];
  if (!hasPick(picks, id, size)) return [...picks, { id, size, qty: clampQty(qty) }];
  return picks.map((p) => (p.id === id && p.size === size ? { ...p, qty: clampQty(p.qty + qty) } : p));
}

/** Sets the variant's qty; below 1 removes that variant only. */
export function setPickQty(picks: readonly PickEntry[], id: string, size: ExtraBeefSize, qty: number): PickEntry[] {
  if (qty < 1) return removePick(picks, id, size);
  return picks.map((p) => (p.id === id && p.size === size ? { ...p, qty: clampQty(qty) } : p));
}

/** Removes one variant; other sizes of the same menu stay. */
export function removePick(picks: readonly PickEntry[], id: string, size: ExtraBeefSize = "S"): PickEntry[] {
  return picks.filter((p) => !(p.id === id && p.size === size));
}

export interface PickLine {
  key: string;
  item: MenuItem;
  qty: number;
  size: ExtraBeefSize;
  /** The line's Extra Beef size above Standar; null when Standar or the burger is not eligible */
  extraBeef: ExtraBeefOption | null;
}

/** Extra Beef sizes the item may take; empty for anything that is not an eligible single beef burger. */
export function extraBeefOptionsFor(item: MenuItem, options: readonly ExtraBeefOption[]): ExtraBeefOption[] {
  return item.extra_beef_eligible ? [...options] : [];
}

/** Saved entries → lines in saved order. Unknown ids are dropped; Standar or ineligible extras are ignored. */
export function buildPickLines(picks: readonly PickEntry[], menu: readonly MenuItem[], options: readonly ExtraBeefOption[]): PickLine[] {
  return picks.flatMap(({ id, qty, size }) => {
    const item = menu.find((m) => m.id === id);
    if (!item) return [];
    const extra = extraBeefOptionsFor(item, options).find((o) => o.size === size && o.size !== "S") ?? null;
    return [{ key: pickKey(id, size), item, qty, size, extraBeef: extra }];
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

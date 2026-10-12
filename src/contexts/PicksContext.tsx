import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ExtraBeefSize } from "../types/menu";
import { MAX_QTY, normalizePicks, type PickEntry } from "../utils/picksTotal";
import { useScreenInit } from "../useScreenInit.js";

type ExtraBeefMap = Partial<Record<string, ExtraBeefSize>>;

interface PicksContextValue {
  picks: PickEntry[];
  /** Total number of portions saved (sum of qty) */
  count: number;
  isPicked: (id: string) => boolean;
  /** Adds qty (default 1) to the item, saving it if it isn't saved yet */
  add: (id: string, qty?: number) => void;
  /** Adds several items at once (a group plan), merging with what is already saved */
  addMany: (entries: readonly PickEntry[]) => void;
  /** qty < 1 removes the item */
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  /** Extra Beef size chosen for a burger (saved or not yet saved); "S" = Standar */
  extraBeef: ExtraBeefMap;
  extraBeefFor: (id: string) => ExtraBeefSize;
  setExtraBeef: (id: string, size: ExtraBeefSize) => void;
}

const STORAGE_KEY = "bomber-burger-pilihanku";
const EXTRA_BEEF_KEY = "bomber-burger-pilihanku-extra-beef";
const PicksContext = createContext<PicksContextValue | null>(null);

function readStorage(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as unknown : undefined;
  } catch {
    return undefined;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — keep in memory only
  }
}

function toExtraBeefMap(raw: unknown): ExtraBeefMap {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? raw as ExtraBeefMap : {};
}

function withoutKey(map: ExtraBeefMap, id: string): ExtraBeefMap {
  const next = { ...map };
  delete next[id];
  return next;
}

const clampQty = (qty: number) => Math.min(MAX_QTY, Math.floor(qty));

export function PicksProvider({ children }: {children: React.ReactNode;}) {
  const screenInit = useScreenInit() as {picks?: unknown[];extraBeef?: ExtraBeefMap;};
  const fromScreen = Array.isArray(screenInit.picks);
  // Older versions stored an array of ids; normalizePicks turns that into { id, qty: 1 }
  const [picks, setPicks] = useState<PickEntry[]>(() =>
  normalizePicks(fromScreen ? screenInit.picks : readStorage(STORAGE_KEY))
  );
  const [extraBeef, setExtraBeefMap] = useState<ExtraBeefMap>(() =>
  toExtraBeefMap(fromScreen ? screenInit.extraBeef : readStorage(EXTRA_BEEF_KEY))
  );

  useEffect(() => {
    if (!fromScreen) writeStorage(STORAGE_KEY, picks);
  }, [fromScreen, picks]);
  useEffect(() => {
    if (!fromScreen) writeStorage(EXTRA_BEEF_KEY, extraBeef);
  }, [fromScreen, extraBeef]);

  const isPicked = useCallback((id: string) => picks.some((p) => p.id === id), [picks]);
  const addMany = useCallback((entries: readonly PickEntry[]) => {
    setPicks((prev) => {
      const next = prev.map((p) => ({ ...p }));
      for (const { id, qty } of entries) {
        if (qty < 1) continue;
        const existing = next.find((p) => p.id === id);
        if (existing) existing.qty = clampQty(existing.qty + qty);
        else next.push({ id, qty: clampQty(qty) });
      }
      return next;
    });
  }, []);
  const add = useCallback((id: string, qty = 1) => addMany([{ id, qty }]), [addMany]);
  const remove = useCallback((id: string) => {
    setPicks((prev) => prev.filter((p) => p.id !== id));
    // Removing the burger also drops its Extra Beef line; the picker goes back to Standar
    setExtraBeefMap((prev) => id in prev ? withoutKey(prev, id) : prev);
  }, []);
  const setQty = useCallback((id: string, qty: number) => {
    if (qty < 1) return remove(id);
    setPicks((prev) => prev.map((p) => p.id === id ? { ...p, qty: clampQty(qty) } : p));
  }, [remove]);
  const extraBeefFor = useCallback((id: string): ExtraBeefSize => extraBeef[id] ?? "S", [extraBeef]);
  const setExtraBeef = useCallback((id: string, size: ExtraBeefSize) => {
    // Standar is the default, so it is not stored
    setExtraBeefMap((prev) => size === "S" ? withoutKey(prev, id) : { ...prev, [id]: size });
  }, []);

  const count = picks.reduce((n, p) => n + p.qty, 0);
  const value = useMemo(
    () => ({ picks, count, isPicked, add, addMany, setQty, remove, extraBeef, extraBeefFor, setExtraBeef }),
    [picks, count, isPicked, add, addMany, setQty, remove, extraBeef, extraBeefFor, setExtraBeef]
  );
  return <PicksContext.Provider value={value}>{children}</PicksContext.Provider>;
}

export function usePicks(): PicksContextValue {
  const ctx = useContext(PicksContext);
  if (!ctx) throw new Error("usePicks must be used inside PicksProvider");
  return ctx;
}

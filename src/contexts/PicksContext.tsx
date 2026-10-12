import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ExtraBeefSize } from "../types/menu";
import { addPick, hasPick, normalizePicks, removePick, setPickQty, type PickEntry } from "../utils/picksTotal";
import { useScreenInit } from "../useScreenInit.js";

type ExtraBeefMap = Partial<Record<string, ExtraBeefSize>>;

interface PicksContextValue {
  /** Saved variants; id + size is the identity ("beef_jr|XXL"), each with its own qty */
  picks: PickEntry[];
  /** Total number of portions saved (sum of qty) */
  count: number;
  /** True if this exact variant (id + Extra Beef size, default Standar) is saved */
  isPicked: (id: string, size?: ExtraBeefSize) => boolean;
  /** Adds qty (default 1) to the variant, saving it if it isn't saved yet */
  add: (id: string, qty?: number, size?: ExtraBeefSize) => void;
  /** Adds several variants at once (a group plan), merging with what is already saved */
  addMany: (entries: readonly { id: string; qty: number; size?: ExtraBeefSize }[]) => void;
  /** qty < 1 removes that variant only */
  setQty: (id: string, qty: number, size?: ExtraBeefSize) => void;
  /** Removes one variant; other sizes of the same menu stay */
  remove: (id: string, size?: ExtraBeefSize) => void;
  /** Size currently chosen in the Extra Beef selector for a burger; "S" = Standar */
  extraBeef: ExtraBeefMap;
  extraBeefFor: (id: string) => ExtraBeefSize;
  setExtraBeef: (id: string, size: ExtraBeefSize) => void;
}

const STORAGE_KEY = "bomber-burger-pilihanku";
// Selector choice per burger. Older versions also used it as the saved size; saved entries now
// carry their own size, and entries stored without one count as Standar.
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

export function PicksProvider({ children }: {children: React.ReactNode;}) {
  const screenInit = useScreenInit() as {picks?: unknown[];extraBeef?: ExtraBeefMap;};
  const fromScreen = Array.isArray(screenInit.picks);
  // Old formats (ids only, or { id, qty } without a size) are read as Standar by normalizePicks
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

  const isPicked = useCallback((id: string, size: ExtraBeefSize = "S") => hasPick(picks, id, size), [picks]);
  const addMany = useCallback((entries: readonly {id: string;qty: number;size?: ExtraBeefSize;}[]) => {
    setPicks((prev) => entries.reduce((acc, e) => addPick(acc, e.id, e.size ?? "S", e.qty), prev));
  }, []);
  const add = useCallback((id: string, qty = 1, size: ExtraBeefSize = "S") => addMany([{ id, qty, size }]), [addMany]);
  const remove = useCallback((id: string, size: ExtraBeefSize = "S") => setPicks((prev) => removePick(prev, id, size)), []);
  const setQty = useCallback(
    (id: string, qty: number, size: ExtraBeefSize = "S") => setPicks((prev) => setPickQty(prev, id, size, qty)),
    []
  );
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

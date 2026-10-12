import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ExtraBeefSize } from "../types/menu";
import { useScreenInit } from "../useScreenInit.js";

type ExtraBeefMap = Partial<Record<string, ExtraBeefSize>>;

interface PicksContextValue {
  picks: string[];
  isPicked: (id: string) => boolean;
  add: (id: string) => void;
  remove: (id: string) => void;
  /** Extra Beef size chosen for a burger (saved or not yet saved); "S" = Standar */
  extraBeef: ExtraBeefMap;
  extraBeefFor: (id: string) => ExtraBeefSize;
  setExtraBeef: (id: string, size: ExtraBeefSize) => void;
}

const STORAGE_KEY = "bomber-burger-pilihanku";
const EXTRA_BEEF_KEY = "bomber-burger-pilihanku-extra-beef";
const PicksContext = createContext<PicksContextValue | null>(null);

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — keep in memory only
  }
}

function withoutKey(map: ExtraBeefMap, id: string): ExtraBeefMap {
  const next = { ...map };
  delete next[id];
  return next;
}

export function PicksProvider({ children }: {children: React.ReactNode;}) {
  const screenInit = useScreenInit() as {picks?: string[];extraBeef?: ExtraBeefMap;};
  const fromScreen = Array.isArray(screenInit.picks);
  const [picks, setPicks] = useState<string[]>(() =>
  fromScreen ? screenInit.picks ?? [] : readStorage<string[]>(STORAGE_KEY, [])
  );
  const [extraBeef, setExtraBeefMap] = useState<ExtraBeefMap>(() =>
  fromScreen ? screenInit.extraBeef ?? {} : readStorage<ExtraBeefMap>(EXTRA_BEEF_KEY, {})
  );

  useEffect(() => {
    if (!fromScreen) writeStorage(STORAGE_KEY, picks);
  }, [fromScreen, picks]);
  useEffect(() => {
    if (!fromScreen) writeStorage(EXTRA_BEEF_KEY, extraBeef);
  }, [fromScreen, extraBeef]);

  const isPicked = useCallback((id: string) => picks.includes(id), [picks]);
  const add = useCallback((id: string) => setPicks((prev) => prev.includes(id) ? prev : [...prev, id]), []);
  const remove = useCallback((id: string) => {
    setPicks((prev) => prev.filter((p) => p !== id));
    // Removing the burger also drops its Extra Beef line; the picker goes back to Standar
    setExtraBeefMap((prev) => id in prev ? withoutKey(prev, id) : prev);
  }, []);
  const extraBeefFor = useCallback((id: string): ExtraBeefSize => extraBeef[id] ?? "S", [extraBeef]);
  const setExtraBeef = useCallback((id: string, size: ExtraBeefSize) => {
    // Standar is the default, so it is not stored
    setExtraBeefMap((prev) => size === "S" ? withoutKey(prev, id) : { ...prev, [id]: size });
  }, []);

  const value = useMemo(
    () => ({ picks, isPicked, add, remove, extraBeef, extraBeefFor, setExtraBeef }),
    [picks, isPicked, add, remove, extraBeef, extraBeefFor, setExtraBeef]
  );
  return <PicksContext.Provider value={value}>{children}</PicksContext.Provider>;
}

export function usePicks(): PicksContextValue {
  const ctx = useContext(PicksContext);
  if (!ctx) throw new Error("usePicks must be used inside PicksProvider");
  return ctx;
}

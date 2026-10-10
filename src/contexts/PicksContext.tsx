import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useScreenInit } from "../useScreenInit.js";

interface PicksContextValue {
  picks: string[];
  isPicked: (id: string) => boolean;
  add: (id: string) => void;
  remove: (id: string) => void;
}

const STORAGE_KEY = "bomber-burger-pilihanku";
const PicksContext = createContext<PicksContextValue | null>(null);

export function PicksProvider({ children }: {children: React.ReactNode;}) {
  const screenInit = useScreenInit() as {picks?: string[];};
  const [picks, setPicks] = useState<string[]>(() => {
    if (Array.isArray(screenInit.picks)) return screenInit.picks;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as string[] : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (Array.isArray(screenInit.picks)) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(picks));
    } catch {

      // storage unavailable — keep in memory only
    }}, [picks]);

  const isPicked = useCallback((id: string) => picks.includes(id), [picks]);
  const add = useCallback((id: string) => setPicks((prev) => prev.includes(id) ? prev : [...prev, id]), []);
  const remove = useCallback((id: string) => setPicks((prev) => prev.filter((p) => p !== id)), []);

  const value = useMemo(() => ({ picks, isPicked, add, remove }), [picks, isPicked, add, remove]);
  return <PicksContext.Provider value={value}>{children}</PicksContext.Provider>;
}

export function usePicks(): PicksContextValue {
  const ctx = useContext(PicksContext);
  if (!ctx) throw new Error("usePicks must be used inside PicksProvider");
  return ctx;
}
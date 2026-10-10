import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { chipGroups, emptySelections } from "../data/preferenceChips";
import type { Recommendation } from "../types/menu";
import type { ChipGroupId, SearchStatus, Selections } from "../types/preferences";
import { recommend } from "../utils/recommend";
import { useScreenInit } from "../useScreenInit.js";

interface PreferenceContextValue {
  selections: Selections;
  text: string;
  status: SearchStatus;
  results: Recommendation[] | null;
  toggleChip: (groupId: ChipGroupId, optionId: string) => void;
  setText: (text: string) => void;
  reset: () => void;
  startSearch: () => void;
  finishSearch: () => void;
}

const PreferenceContext = createContext<PreferenceContextValue | null>(null);

export function PreferenceProvider({ children }: {children: React.ReactNode;}) {
  const screenInit = useScreenInit() as {
    selections?: Partial<Selections>;
    text?: string;
    status?: SearchStatus;
    holdLoading?: boolean;
  };
  const initialSelections: Selections = { ...emptySelections, ...(screenInit.selections ?? {}) };
  const initialText = screenInit.text ?? "";
  const initialStatus: SearchStatus = screenInit.status ?? "idle";
  const holdLoading = Boolean(screenInit.holdLoading);

  const [selections, setSelections] = useState<Selections>(initialSelections);
  const [text, setText] = useState(initialText);
  const [status, setStatus] = useState<SearchStatus>(initialStatus);
  const [results, setResults] = useState<Recommendation[] | null>(() =>
  initialStatus === "done" ? recommend(initialSelections, initialText) : null
  );

  const toggleChip = useCallback((groupId: ChipGroupId, optionId: string) => {
    setSelections((prev) => {
      const group = chipGroups.find((g) => g.id === groupId);
      if (!group) return prev;
      const current = prev[groupId];
      let next: string[];
      if (current.includes(optionId)) next = current.filter((x) => x !== optionId);else
      if (!group.multi) next = [optionId];else
      {
        const conflict = group.exclusive?.find((set) => set.includes(optionId)) ?? [];
        next = [...current.filter((x) => !conflict.includes(x)), optionId];
      }
      return { ...prev, [groupId]: next };
    });
  }, []);

  const reset = useCallback(() => {
    setSelections(emptySelections);
    setText("");
  }, []);

  const startSearch = useCallback(() => {
    setResults(null);
    setStatus("loading");
  }, []);

  const finishSearch = useCallback(() => {
    if (holdLoading) return;
    setResults(recommend(selections, text));
    setStatus("done");
  }, [selections, text, holdLoading]);

  const value = useMemo(
    () => ({ selections, text, status, results, toggleChip, setText, reset, startSearch, finishSearch }),
    [selections, text, status, results, toggleChip, reset, startSearch, finishSearch]
  );

  return <PreferenceContext.Provider value={value}>{children}</PreferenceContext.Provider>;
}

export function usePreferences(): PreferenceContextValue {
  const ctx = useContext(PreferenceContext);
  if (!ctx) throw new Error("usePreferences must be used inside PreferenceProvider");
  return ctx;
}
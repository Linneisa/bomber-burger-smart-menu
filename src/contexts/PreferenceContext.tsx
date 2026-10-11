import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { menuItems } from "../data/menu";
import { chipGroups, emptySelections } from "../data/preferenceChips";
import type { Recommendation } from "../types/menu";
import type { ChipGroupId, SearchStatus, Selections } from "../types/preferences";
import { recommend } from "../utils/recommend";
import { fetchRecommendations } from "../utils/recommendApi";
import { useScreenInit } from "../useScreenInit.js";

/** Minimum time the loading screen is shown, even if the API answers sooner */
export const LOADING_MS = 2400;

interface PreferenceContextValue {
  selections: Selections;
  text: string;
  status: SearchStatus;
  results: Recommendation[] | null;
  /** Shown above the results when they come from the fallback instead of the AI */
  notice: string | null;
  toggleChip: (groupId: ChipGroupId, optionId: string) => void;
  setText: (text: string) => void;
  reset: () => void;
  startSearch: () => void;
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
  initialStatus === "done" ? recommend(initialSelections, initialText, menuItems) : null
  );
  const [notice, setNotice] = useState<string | null>(null);
  const searchId = useRef(0);

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
    const id = ++searchId.current;
    setResults(null);
    setNotice(null);
    setStatus("loading");
    if (holdLoading) return;

    const minDelay = new Promise((resolve) => setTimeout(resolve, LOADING_MS));
    Promise.all([fetchRecommendations(selections, text.trim()), minDelay]).then(([result]) => {
      if (id !== searchId.current) return; // a newer search started
      setResults(result.results);
      setNotice(result.notice);
      setStatus("done");
    });
  }, [selections, text, holdLoading]);

  const value = useMemo(
    () => ({ selections, text, status, results, notice, toggleChip, setText, reset, startSearch }),
    [selections, text, status, results, notice, toggleChip, reset, startSearch]
  );

  return <PreferenceContext.Provider value={value}>{children}</PreferenceContext.Provider>;
}

export function usePreferences(): PreferenceContextValue {
  const ctx = useContext(PreferenceContext);
  if (!ctx) throw new Error("usePreferences must be used inside PreferenceProvider");
  return ctx;
}
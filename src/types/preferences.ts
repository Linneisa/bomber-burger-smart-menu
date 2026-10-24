export type ChipGroupId = "rasa" | "protein" | "budget" | "porsi" | "hindari" | "orang";

export interface ChipOption {
  id: string;
  label: string;
}

export interface ChipGroup {
  id: ChipGroupId;
  label: string;
  hint: string;
  multi: boolean;
  exclusive?: string[][];
  options: ChipOption[];
}

export type Selections = Record<ChipGroupId, string[]>;

export type SearchStatus = "idle" | "loading" | "done";
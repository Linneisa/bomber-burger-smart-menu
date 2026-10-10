export type ItemType = "beef_burger" | "chicken_burger" | "set" | "bomber_shake" | "side";
/** Backward-compat alias; prefer ItemType in new code */
export type Category = ItemType;
export type Protein = "beef" | "chicken" | "none";
export type Avoidable = "bawang" | "keju";

export interface ChickenFlavorOption {
  name: string;
  detail: string;
}

export interface MenuItem {
  id: string;
  name: string;
  type: ItemType;
  protein: Protein;
  ingredients: string[];
  /** Raw allergen list from JSON; may include "tomat", "pickle", "nanas" in addition to Avoidable */
  contains: string[];
  taste_draft: string[];
  spicy: boolean;
  price_idr: number | null;
  image: string;
  patty_count?: number;
  /** Sets and Bomber Shakes: list of what the tray/set contains */
  items?: string[];
  chicken_flavor_options?: ChickenFlavorOption[];
  /** Side dishes only */
  description?: string;
}

export interface Recommendation {
  item: MenuItem;
  score: number;
  match: number;
  reason: string;
}

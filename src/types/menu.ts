export type ItemType = "beef_burger" | "chicken_burger" | "set" | "bomber_shake" | "side";
/** Backward-compat alias; prefer ItemType in new code */
export type Category = ItemType;
export type Protein = "beef" | "chicken" | "none";
export type Avoidable = "bawang" | "keju";

export interface ChickenFlavorOption {
  name: string;
  detail: string;
}

/**
 * Kitchen SOP and official menu text disagree. The item counts as unverified for every avoid
 * filter, and reasons must not mention any of `terms`.
 */
export interface SourceConflict {
  /** SOP ingredient names (as ingredientNames() writes them) left out of data templates */
  ingredients: string[];
  /** Words a reason may not use for this item */
  terms: string[];
  /** Avoidables that become uncertain because of the conflict (informational) */
  avoid?: string[];
  note: string;
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
  /** Sets and Bomber Shakes: true if any resolved component burger is spicy */
  spicyComponent?: boolean;
  price_idr: number | null;
  /** Burgers only: price as a set (+ Cajun Fries & Coca-Cola); null = not sold as a set */
  set_price_idr?: number | null;
  /** From the official menu; the AI may only say "best seller" when true */
  best_seller?: boolean;
  /** SOP and official menu text disagree on these ingredients (see SourceConflict) */
  source_conflict?: SourceConflict;
  image: string;
  patty_count?: number;
  /** Sets and Bomber Shakes: list of what the tray/set contains */
  items?: string[];
  chicken_flavor_options?: ChickenFlavorOption[];
  /** Side dishes only */
  description?: string;
  /**
   * Ingredients used for "avoid" filtering. For sets and trays this is the union of the
   * components' known ingredients. complete=false means at least one component (or the item
   * itself) has no ingredient data, uses a sauce or seasoning with unknown contents (Saus OG,
   * Secret Sauce, bumbu kentang, cajun…) or has a source_conflict, so while an avoid is active it
   * is only used as an unverified fill-up.
   */
  avoidData: { contains: string[]; complete: boolean };
}

export interface Recommendation {
  item: MenuItem;
  score: number;
  match: number;
  reason: string;
  /** Ingredients not fully known while an avoid filter is active (Tier 2): ask the cashier */
  unverified?: boolean;
}

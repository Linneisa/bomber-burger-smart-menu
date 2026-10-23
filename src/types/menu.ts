export type ItemType = "beef_burger" | "chicken_burger" | "set" | "bomber_shake" | "side";
/** Backward-compat alias; prefer ItemType in new code */
export type Category = ItemType;
export type Protein = "beef" | "chicken" | "none";
export type Avoidable = "bawang" | "keju";

/** Extra Beef package sizes; "S" is the standard portion (no extra charge) */
export type ExtraBeefSize = "S" | "R" | "M" | "L" | "XL" | "XXL";

export interface ExtraBeefOption {
  size: ExtraBeefSize;
  /** "Standar" for S, otherwise the size name. Never a patty count or weight (not confirmed). */
  label: string;
  /** Extra charge on top of the burger price */
  price_idr: number;
}

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
  /**
   * Flavours that only come from the disputed ingredient (e.g. BBQ, manis, smoky from a disputed
   * saus BBQ). Taste tags containing them are dropped, and reasons may not claim them.
   */
  taste_terms?: string[];
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
  /** Estimated number of people the item serves (burger/set 1, Set C/D 2, Bomber Shake 4, side 0) */
  serves: number;
  /** Set contents differ between menu sources (needs_validation): confirm at the cashier */
  contents_unconfirmed?: boolean;
  /** Burgers only: price as a set (+ Cajun Fries & Coca-Cola); null = not sold as a set */
  set_price_idr?: number | null;
  /** Single beef burgers only: the Extra Beef package may be added (UI only, never sent to the AI) */
  extra_beef_eligible: boolean;
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

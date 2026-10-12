import { useCallback } from "react";
import { toast } from "sonner";
import { usePicks } from "../contexts/PicksContext";
import type { ExtraBeefSize, MenuItem } from "../types/menu";

/** Short confirmation; the Toaster sits at the top, clear of the floating Pilihanku button */
export const PICK_TOAST_MS = 2000;

/**
 * Pilihanku state of the variant currently chosen for this item: id + the Extra Beef size in its
 * selector (Standar for items without Extra Beef). Changing the size updates `saved` right away;
 * `toggle` adds that variant (qty 1) or removes that variant only.
 */
export function useSavePick(item: MenuItem | undefined): { saved: boolean; size: ExtraBeefSize; toggle: () => void } {
  const { isPicked, add, remove, extraBeefFor } = usePicks();
  const size: ExtraBeefSize = item?.extra_beef_eligible ? extraBeefFor(item.id) : "S";
  const saved = item ? isPicked(item.id, size) : false;

  const toggle = useCallback(() => {
    if (!item) return;
    if (saved) {
      remove(item.id, size);
      toast("Dihapus dari Pilihanku", { duration: PICK_TOAST_MS });
      return;
    }
    add(item.id, 1, size);
    toast.success("Ditambahkan ke Pilihanku", { duration: PICK_TOAST_MS });
  }, [saved, add, remove, item, size]);

  return { saved, size, toggle };
}

import { useCallback } from "react";
import { toast } from "sonner";
import { usePicks } from "../contexts/PicksContext";
import type { MenuItem } from "../types/menu";

/** Short confirmation; the Toaster sits at the top, clear of the floating Pilihanku button */
export const PICK_TOAST_MS = 2000;

/** Toggles a menu in Pilihanku: adds it (qty 1) or removes it if it is already there. */
export function useSavePick() {
  const { isPicked, add, remove } = usePicks();

  return useCallback(
    (item: MenuItem) => {
      if (isPicked(item.id)) {
        remove(item.id);
        toast("Dihapus dari Pilihanku", { duration: PICK_TOAST_MS });
        return;
      }
      add(item.id);
      toast.success("Ditambahkan ke Pilihanku", { duration: PICK_TOAST_MS });
    },
    [isPicked, add, remove]
  );
}

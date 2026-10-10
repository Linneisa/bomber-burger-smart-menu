import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { usePicks } from "../contexts/PicksContext";
import type { MenuItem } from "../types/menu";

export function useSavePick() {
  const { isPicked, add, remove } = usePicks();
  const navigate = useNavigate();

  return useCallback(
    (item: MenuItem) => {
      if (isPicked(item.id)) {
        remove(item.id);
        toast(`${item.name} dihapus dari Pilihanku`);
        return;
      }
      add(item.id);
      toast.success(`${item.name} disimpan ke Pilihanku`, {
        action: { label: "Lihat", onClick: () => navigate("/pilihanku") }
      });
    },
    [isPicked, add, remove, navigate]
  );
}
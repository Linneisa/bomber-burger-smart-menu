import React from "react";
import { motion } from "framer-motion";
import { BookmarkIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePicks } from "../contexts/PicksContext";

export function PicksFab() {
  const { picks } = usePicks();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const hidden = pathname === "/pilihanku" || pathname === "/preferensi" || pathname.startsWith("/menu/");
  if (hidden) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto flex max-w-[480px] justify-end px-5 pb-5">
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/pilihanku")}
          aria-label={`Buka Pilihanku, ${picks.length} menu tersimpan`}
          className="pointer-events-auto flex h-14 items-center gap-2.5 rounded-full bg-forest pl-5 pr-2 text-white shadow-float focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest/30">
          
          <BookmarkIcon className="h-5 w-5" aria-hidden />
          <span className="text-[15px] font-bold whitespace-nowrap">Pilihanku</span>
          <motion.span
            key={picks.length}
            initial={{ scale: 0.75 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 600, damping: 18 }}
            className={`flex h-10 min-w-[2.5rem] items-center justify-center rounded-full px-2 text-sm font-extrabold ${
            picks.length ? "bg-ember text-white" : "bg-white/15 text-white"}`
            }>
            
            {picks.length}
          </motion.span>
        </motion.button>
      </div>
    </div>);

}
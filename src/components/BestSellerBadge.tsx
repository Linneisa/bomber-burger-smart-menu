import { AwardIcon } from "lucide-react";

/** Shown only for items the official menu marks best_seller. */
export function BestSellerBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-ember px-2.5 py-1 text-[11px] font-extrabold text-white ${className}`}>
      <AwardIcon className="h-3.5 w-3.5" aria-hidden />
      Best Seller
    </span>
  );
}

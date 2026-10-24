import { HeartIcon } from "lucide-react";

/** Shown only for items the official menu marks favourite. A badge, never a claim in the reason. */
export function FavouriteBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-ember-light px-2.5 py-1 text-[11px] font-extrabold text-ember-dark ${className}`}>
      <HeartIcon className="h-3.5 w-3.5" aria-hidden />
      Favorit
    </span>
  );
}

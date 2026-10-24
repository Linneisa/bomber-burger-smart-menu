import { UtensilsCrossedIcon } from "lucide-react";
import { useState } from "react";

interface PlanThumbProps {
  src: string;
  name: string;
  /** Tailwind size classes; the box keeps this size while loading or on error so rows don't jump */
  className?: string;
}

/** Small lazy-loaded photo, contained (never cropped); a missing file shows a neutral icon, never another photo. */
export function PlanThumb({ src, name, className = "h-14 w-14" }: PlanThumbProps) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={`block shrink-0 overflow-hidden rounded-xl bg-cream ${className}`}>
      {failed ? (
        <span className="flex h-full w-full items-center justify-center text-ink-subtle" role="img" aria-label={name}>
          <UtensilsCrossedIcon className="h-5 w-5" aria-hidden />
        </span>
      ) : (
        <img
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          width={56}
          height={56}
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-1"
        />
      )}
    </span>
  );
}

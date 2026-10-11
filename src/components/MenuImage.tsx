import { useState } from "react";

interface MenuImageProps {
  src: string;
  name: string;
  className?: string;
}

/** Renders the menu photo; falls back to a green placeholder with the item name when the file is missing. */
export function MenuImage({ src, name, className = "" }: MenuImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-forest-light ${className}`}>
        <span className="px-4 text-center text-sm font-bold leading-snug text-forest">{name}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

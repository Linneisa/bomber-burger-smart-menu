import React from "react";
import { ArrowLeftIcon } from "lucide-react";
import { useGoBack } from "../hooks/useGoBack";

interface TopBarProps {
  title: string;
  fallback?: string;
  right?: React.ReactNode;
}

export function TopBar({ title, fallback = "/", right }: TopBarProps) {
  const goBack = useGoBack(fallback);
  return (
    <div className="flex h-16 items-center gap-3 px-4">
      <button
        type="button"
        onClick={goBack}
        aria-label="Kembali"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-card transition-transform duration-150 ease-snappy active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest">
        
        <ArrowLeftIcon className="h-5 w-5" />
      </button>
      <h1 className="flex-1 truncate text-lg font-extrabold text-ink">{title}</h1>
      {right}
    </div>);

}
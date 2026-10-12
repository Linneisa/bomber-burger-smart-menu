import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import type { MenuItem } from "../types/menu";
import { BestSellerBadge } from "./BestSellerBadge";
import { MenuImage } from "./MenuImage";

const INTERVAL_MS = 3500;
/** Horizontal distance (px) a pointer must travel to count as a swipe instead of a tap */
const SWIPE_THRESHOLD = 40;

/**
 * Auto-rotating hero photos (transparent PNG-style cutouts) shown straight on the green panel.
 * Pauses on hover, touch and keyboard focus; no auto-rotate under prefers-reduced-motion.
 */
export function HeroCarousel({ items }: { items: MenuItem[] }) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);
  // Slides mounted so far: current + next are added ahead of time so the next photo is preloaded
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([0, 1]));
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const count = items.length;
  const paused = hovered || touched || focused || !!reduceMotion;

  useEffect(() => {
    const next = (index + 1) % count;
    setMounted((prev) => (prev.has(index) && prev.has(next) ? prev : new Set([...prev, index, next])));
  }, [index, count]);

  useEffect(() => {
    if (paused || count < 2) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => window.clearTimeout(t);
  }, [index, paused, count]);

  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  const onPointerDown = (e: PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
    if (e.pointerType !== "mouse") setTouched(true);
  };
  const onPointerUp = (e: PointerEvent) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    setTouched(false);
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(e.clientY - start.y)) {
      swiped.current = true;
      go(dx < 0 ? 1 : -1);
    }
  };
  const onPointerCancel = () => {
    pointerStart.current = null;
    setTouched(false);
  };

  const active = items[index];
  if (!active) return null;

  return (
    <div
      className="mt-6"
      role="region"
      aria-roledescription="carousel"
      aria-label="Menu andalan"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}>
      {/* Fixed height: slides are stacked absolutely, so changing photos never shifts the layout.
          16:11 leaves a strip above the photo for the Best Seller chip (it never covers the burger) */}
      <div
        className="relative aspect-[16/11] w-full touch-pan-y select-none"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}>
        {items.map((item, i) => {
          if (!mounted.has(i)) return null;
          const isActive = i === index;
          const offset = isActive ? "translate-x-0 scale-100" : i < index ? "-translate-x-6 scale-95" : "translate-x-6 scale-95";
          return (
            <Link
              key={item.id}
              to={`/menu/${item.id}`}
              draggable={false}
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
              aria-label={`${item.name}${item.best_seller ? ", Best Seller" : ""}. Lihat detail`}
              onClick={(e) => {
                if (swiped.current) {
                  e.preventDefault();
                  swiped.current = false;
                }
              }}
              className={`absolute inset-0 rounded-[20px] transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 ${offset} ${
                isActive ? "opacity-100" : "pointer-events-none opacity-0"
              }`}>
              <div className="absolute inset-x-0 bottom-0 top-8">
                <MenuImage
                  src={item.image}
                  name={item.name}
                  className="h-full w-full object-contain object-bottom drop-shadow-[0_14px_18px_rgba(0,0,0,0.35)]"
                />
              </div>
              {/* Inside the slide, so it fades and slides together with its photo */}
              {item.best_seller && <BestSellerBadge className="absolute right-2 top-1 !px-3 !py-1.5 !text-xs shadow-card" />}
            </Link>
          );
        })}
        {/* Menu name only (no price); follows the photo on screen */}
        <span
          className="pointer-events-none absolute bottom-2 left-0 max-w-[70%] truncate rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-card"
          aria-live={paused ? "polite" : "off"}>
          {active.name}
        </span>
      </div>

      {count > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Tampilkan ${item.name}`}
              aria-current={i === index}
              className="flex h-6 items-center px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-full">
              <span
                className={`block h-2 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none ${
                  i === index ? "w-5 bg-white" : "w-2 bg-white/40"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

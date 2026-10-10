import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SparklesIcon } from "lucide-react";
import { menuItems } from "../data/menu";

const STEPS = [
"Membaca selera kamu…",
`Mencocokkan dengan ${menuItems.length} menu…`,
"Menulis alasan rekomendasi…"];


export function AiLoading({ duration }: {duration: number;}) {
  const [step, setStep] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const interval = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), duration / STEPS.length);
    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-8 pb-24 text-center" role="status" aria-live="polite">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-dashed border-forest/25"
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 6, ease: "linear", repeat: Infinity }} />
        
        <motion.span
          className="absolute inset-0"
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 1.6, ease: "linear", repeat: Infinity }}>
          
          <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember" />
        </motion.span>
        <motion.div
          className="flex h-20 w-20 items-center justify-center rounded-full bg-forest text-white"
          animate={reduce ? undefined : { scale: [1, 1.06, 1] }}
          transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity }}>
          
          <SparklesIcon className="h-9 w-9" aria-hidden />
        </motion.div>
      </div>

      <h2 className="mt-8 text-xl font-extrabold leading-snug text-ink">AI sedang memilihkan menu untuk kamu...</h2>
      <div className="mt-2 h-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="text-sm text-ink-muted">
            
            {STEPS[step]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-cream-dark">
        <motion.div
          className="h-full rounded-full bg-ember"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: duration / 1000, ease: "linear" }} />
        
      </div>
    </div>);

}
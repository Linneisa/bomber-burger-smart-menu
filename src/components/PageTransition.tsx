import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export function PageTransition({ children }: {children: React.ReactNode;}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="min-h-screen">
      
      {children}
    </motion.div>);

}
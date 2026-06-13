"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Re-mounts on every navigation (unlike layout.tsx), so this animates each
 * view in as it opens — a soft fade + lift + de-blur. Disabled under
 * prefers-reduced-motion.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

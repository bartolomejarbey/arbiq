"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface StaggerGridProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export default function StaggerGrid({
  children,
  className = "",
  staggerDelay = 0.1,
}: StaggerGridProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className={className}>
      {children.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
            delay: i * staggerDelay,
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

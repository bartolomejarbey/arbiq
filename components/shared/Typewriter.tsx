"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  /** ms per character. Default 28. */
  speed?: number;
  /** Start typing immediately. If false, hold empty until flipped to true. */
  start?: boolean;
  /** Show blinking caret while typing (and optionally after). Default true. */
  cursor?: boolean;
  /** Keep blinking caret after the line is fully typed. Default false. */
  keepCursor?: boolean;
  /** Optional className applied to the wrapper span. */
  className?: string;
  /** Delay before typing starts, ms. */
  delay?: number;
};

/**
 * Renders text one character at a time, mimicking a typewriter.
 * SSR-safe: server emits the full text, the client clears + retypes on mount
 * so SEO/no-JS visitors still see the full sentence.
 */
export default function Typewriter({
  text,
  speed = 28,
  start = true,
  cursor = true,
  keepCursor = false,
  className,
  delay = 0,
}: Props) {
  const [shown, setShown] = useState(text);
  const [done, setDone] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!start) {
      setShown("");
      setDone(false);
      return;
    }
    setShown("");
    setDone(false);

    let i = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled || !mountedRef.current) return;
      i += 1;
      setShown(text.slice(0, i));
      if (i < text.length) {
        timerRef.current = setTimeout(tick, speed);
      } else {
        setDone(true);
      }
    };

    timerRef.current = setTimeout(tick, delay);
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, speed, start, delay]);

  const showCaret = cursor && (!done || keepCursor);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{shown}</span>
      {showCaret && (
        <span
          aria-hidden
          className="inline-block w-[0.45em] h-[1em] -mb-[0.12em] ml-[0.05em] bg-caramel/80 animate-pulse align-baseline"
        />
      )}
    </span>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook that tracks scroll position efficiently.
 * Uses requestAnimationFrame to batch updates and avoid excessive re-renders.
 */
export function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);
  const rafRef = useRef<number | null>(null);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      rafRef.current = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, []);

  useEffect(() => {
    // Set initial scroll position
    setScrollY(window.scrollY);

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleScroll]);

  return scrollY;
}

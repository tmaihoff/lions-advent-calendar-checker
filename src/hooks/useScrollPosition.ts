import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook that tracks scroll position efficiently.
 * Uses requestAnimationFrame to batch updates and avoid excessive re-renders.
 */
export function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;
      if (currentScrollY !== lastScrollY.current) {
        lastScrollY.current = currentScrollY;
        setScrollY(currentScrollY);
      }
      rafRef.current = null;
    });
  }, []);

  useEffect(() => {
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

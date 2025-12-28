import { useEffect, useRef } from 'react';

/**
 * Custom hook to optimize scroll performance
 * Throttles scroll events and provides scroll-based optimizations
 */
export const useScrollOptimization = () => {
  const scrollTimeoutRef = useRef<number | null>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      // Set scrolling flag
      isScrollingRef.current = true;

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set timeout to detect scroll end
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 150) as unknown as number;
    };

    // Add throttled scroll listener
    let ticking = false;
    const throttledScrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScrollHandler, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledScrollHandler);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    isScrolling: isScrollingRef.current
  };
};
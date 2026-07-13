import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

/**
 * Get animation duration respecting reduced motion
 */
export function useAnimationDuration(normalDuration: number): number {
  const reducedMotion = useReducedMotion();
  return reducedMotion ? 0 : normalDuration;
}

/**
 * Animation class names that respect reduced motion
 */
export function useAnimationClasses(baseClasses: string): string {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return baseClasses.replace(/animate-\w+/g, '');
  return baseClasses;
}

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

/**
 * Breakpoint hooks
 */
export const useBreakpoint = () => ({
  xs: useMediaQuery('(min-width: 0px)'),
  sm: useMediaQuery('(min-width: 640px)'),
  md: useMediaQuery('(min-width: 768px)'),
  lg: useMediaQuery('(min-width: 1024px)'),
  xl: useMediaQuery('(min-width: 1280px)'),
  '2xl': useMediaQuery('(min-width: 1536px)'),
});

export const useIsMobile = () => useMediaQuery('(max-width: 639px)');
export const useIsTablet = () => useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsSidebarCollapsed = () => useMediaQuery('(max-width: 1023px)');

/**
 * @file Detects whether the viewport width is below the mobile breakpoint.
 */

import * as React from "react";

/** Pixel width threshold below which the device is considered mobile. */
const MOBILE_BREAKPOINT = 768;

/**
 * Hook that returns true when the viewport is narrower than the mobile breakpoint.
 * Listens to matchMedia changes so it updates reactively on resize.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

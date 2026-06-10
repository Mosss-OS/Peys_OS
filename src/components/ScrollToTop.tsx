/**
 * ScrollToTop - Scrolls the window to the top on every route change.
 * Renders nothing (returns null) but runs the scroll effect via useEffect.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop - Null-rendering component that scrolls to top on pathname change.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

import { useEffect, useRef } from "react";

// Twitter-style bi-directional sticky:
// - scrolling down: element scrolls until its bottom hits the viewport bottom, then sticks
// - scrolling up: element scrolls until its top hits `topGap`, then sticks
export function useBidirectionalSticky(topGap = 72, bottomGap = 16) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let lastScrollY = window.scrollY;
    let stickyOffset = topGap;

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const sidebarHeight = el.offsetHeight;

      // If the sidebar fits on screen, plain sticky at topGap is enough
      if (sidebarHeight + topGap + bottomGap <= viewportHeight) {
        el.style.top = `${topGap}px`;
        lastScrollY = currentScrollY;
        return;
      }

      const scrollDelta = currentScrollY - lastScrollY;
      const minOffset = viewportHeight - sidebarHeight - bottomGap; // negative
      const maxOffset = topGap;

      if (scrollDelta > 0) {
        // scrolling down — let the sidebar move up until its bottom is visible
        stickyOffset = Math.max(stickyOffset - scrollDelta, minOffset);
      } else {
        // scrolling up — let it move down until its top hits topGap
        stickyOffset = Math.min(stickyOffset - scrollDelta, maxOffset);
      }

      el.style.top = `${stickyOffset}px`;
      lastScrollY = currentScrollY;
    };

    onScroll(); // set initial position
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [topGap, bottomGap]);

  return ref;
}

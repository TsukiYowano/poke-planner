import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
  type UIEvent,
} from "react";

export function synchronizeScrollLeft(
  source: Pick<HTMLElement, "scrollLeft">,
  target: Pick<HTMLElement, "scrollLeft">,
): void {
  if (target.scrollLeft !== source.scrollLeft) {
    target.scrollLeft = source.scrollLeft;
  }
}

export function useSynchronizedHorizontalScroll(): {
  topScrollRef: RefObject<HTMLDivElement | null>;
  tableScrollRef: RefObject<HTMLDivElement | null>;
  topSpacerRef: RefObject<HTMLDivElement | null>;
  onTopScroll: (event: UIEvent<HTMLDivElement>) => void;
  onTableScroll: (event: UIEvent<HTMLDivElement>) => void;
} {
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const topSpacerRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia("(min-width: 768px)").matches,
  );

  const onTopScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    if (!isDesktop) return;
    const tableScroll = tableScrollRef.current;
    if (tableScroll) synchronizeScrollLeft(event.currentTarget, tableScroll);
  }, [isDesktop]);

  const onTableScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    if (!isDesktop) return;
    const topScroll = topScrollRef.current;
    if (topScroll) synchronizeScrollLeft(event.currentTarget, topScroll);
  }, [isDesktop]);

  useLayoutEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const updateMode = () => setIsDesktop(media.matches);
    updateMode();
    media.addEventListener("change", updateMode);
    return () => media.removeEventListener("change", updateMode);
  }, []);

  useLayoutEffect(() => {
    const topScroll = topScrollRef.current;
    const tableScroll = tableScrollRef.current;
    const spacer = topSpacerRef.current;
    if (!topScroll || !tableScroll || !spacer) return;
    if (!isDesktop) {
      topScroll.hidden = true;
      spacer.style.width = "0px";
      return;
    }

    const updateRange = () => {
      spacer.style.width = `${tableScroll.scrollWidth}px`;
      const hasOverflow = tableScroll.scrollWidth > tableScroll.clientWidth + 1;
      topScroll.hidden = !hasOverflow;
      if (!hasOverflow) {
        topScroll.scrollLeft = 0;
        tableScroll.scrollLeft = 0;
      } else {
        synchronizeScrollLeft(tableScroll, topScroll);
      }
    };

    updateRange();
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(updateRange);
    observer?.observe(tableScroll);
    const table = tableScroll.querySelector("table");
    if (table) observer?.observe(table);
    window.addEventListener("resize", updateRange);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateRange);
    };
  }, [isDesktop]);

  return {
    topScrollRef,
    tableScrollRef,
    topSpacerRef,
    onTopScroll,
    onTableScroll,
  };
}

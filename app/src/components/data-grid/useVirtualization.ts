/**
 * useVirtualization Hook
 * Custom virtualization implementation for the DataGrid
 * Renders only visible rows plus an overscan buffer for smooth scrolling
 */

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { VirtualItem } from "./types";

interface UseVirtualizationOptions {
  count: number;
  getItemSize: (index: number) => number;
  overscan?: number;
  estimatedItemSize?: number;
  getScrollElement: () => HTMLElement | null;
  enabled?: boolean;
}

interface VirtualizationResult {
  virtualItems: VirtualItem[];
  totalSize: number;
  scrollToIndex: (index: number, options?: { align?: "start" | "center" | "end" }) => void;
  scrollToOffset: (offset: number) => void;
  isScrolling: boolean;
  measureElement: (element: HTMLElement | null, index: number) => void;
}

export function useVirtualization({
  count,
  getItemSize,
  overscan = 5,
  estimatedItemSize = 44,
  getScrollElement,
  enabled = true,
}: UseVirtualizationOptions): VirtualizationResult {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // Measured sizes cache as state to allow access during render
  const [measuredSizes, setMeasuredSizes] = useState<Map<number, number>>(() => new Map());
  const scrollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate item positions
  const { itemPositions, totalSize } = useMemo(() => {
    const positions: { start: number; end: number; size: number }[] = [];
    let currentPosition = 0;

    for (let i = 0; i < count; i++) {
      const size = measuredSizes.get(i) ?? getItemSize(i);
      positions.push({
        start: currentPosition,
        end: currentPosition + size,
        size,
      });
      currentPosition += size;
    }

    return {
      itemPositions: positions,
      totalSize: currentPosition,
    };
  }, [count, getItemSize, measuredSizes]);

  // Find visible range using binary search
  const findStartIndex = useCallback(
    (scrollTop: number): number => {
      let low = 0;
      let high = itemPositions.length - 1;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const item = itemPositions[mid];

        if (item.end < scrollTop) {
          low = mid + 1;
        } else if (item.start > scrollTop) {
          high = mid - 1;
        } else {
          return mid;
        }
      }

      return Math.max(0, low);
    },
    [itemPositions]
  );

  // Calculate visible items
  const virtualItems = useMemo((): VirtualItem[] => {
    if (!enabled || count === 0) {
      // Return all items when not virtualized
      return Array.from({ length: count }, (_, index) => ({
        index,
        start: itemPositions[index]?.start ?? index * estimatedItemSize,
        end: itemPositions[index]?.end ?? (index + 1) * estimatedItemSize,
        size: itemPositions[index]?.size ?? estimatedItemSize,
        key: String(index),
      }));
    }

    const startIndex = findStartIndex(scrollTop);
    const visibleStart = Math.max(0, startIndex - overscan);

    const items: VirtualItem[] = [];
    let currentIndex = visibleStart;

    while (
      currentIndex < count &&
      itemPositions[currentIndex].start < scrollTop + containerHeight + overscan * estimatedItemSize
    ) {
      items.push({
        index: currentIndex,
        start: itemPositions[currentIndex].start,
        end: itemPositions[currentIndex].end,
        size: itemPositions[currentIndex].size,
        key: String(currentIndex),
      });
      currentIndex++;
    }

    // Add overscan items at the end
    for (let i = 0; i < overscan && currentIndex < count; i++) {
      items.push({
        index: currentIndex,
        start: itemPositions[currentIndex].start,
        end: itemPositions[currentIndex].end,
        size: itemPositions[currentIndex].size,
        key: String(currentIndex),
      });
      currentIndex++;
    }

    return items;
  }, [
    enabled,
    count,
    scrollTop,
    containerHeight,
    overscan,
    estimatedItemSize,
    findStartIndex,
    itemPositions,
  ]);

  // Scroll handlers
  useEffect(() => {
    const scrollElement = getScrollElement();
    if (!scrollElement || !enabled) return;

    const handleScroll = () => {
      setScrollTop(scrollElement.scrollTop);
      setIsScrolling(true);

      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }

      scrollingTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    const handleResize = () => {
      setContainerHeight(scrollElement.clientHeight);
    };

    // Initial setup
    handleResize();
    handleScroll();

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(scrollElement);

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }
    };
  }, [getScrollElement, enabled]);

  // Scroll to index
  const scrollToIndex = useCallback(
    (index: number, options?: { align?: "start" | "center" | "end" }) => {
      const scrollElement = getScrollElement();
      if (!scrollElement || index < 0 || index >= count) return;

      const item = itemPositions[index];
      if (!item) return;

      let offset = item.start;

      if (options?.align === "center") {
        offset = item.start - containerHeight / 2 + item.size / 2;
      } else if (options?.align === "end") {
        offset = item.end - containerHeight;
      }

      scrollElement.scrollTop = Math.max(0, offset);
    },
    [getScrollElement, count, itemPositions, containerHeight]
  );

  // Scroll to offset
  const scrollToOffset = useCallback(
    (offset: number) => {
      const scrollElement = getScrollElement();
      if (scrollElement) {
        scrollElement.scrollTop = offset;
      }
    },
    [getScrollElement]
  );

  // Measure element
  const measureElement = useCallback(
    (element: HTMLElement | null, index: number) => {
      if (!element) return;

      const height = element.getBoundingClientRect().height;

      setMeasuredSizes((prev) => {
        const currentSize = prev.get(index);
        if (currentSize !== height) {
          const next = new Map(prev);
          next.set(index, height);
          return next;
        }
        return prev;
      });
    },
    []
  );

  return {
    virtualItems,
    totalSize,
    scrollToIndex,
    scrollToOffset,
    isScrolling,
    measureElement,
  };
}

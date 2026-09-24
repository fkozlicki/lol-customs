"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

interface InfiniteScrollTriggerProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  /**
   * What stands in for the next page while it loads — the list's own skeleton rows. DESIGN.md: the
   * page should already show its shape, so a list grows by placeholders of its own items rather than
   * by a spinner.
   */
  loading: React.ReactNode;
}

export function InfiniteScrollTrigger({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  loading,
}: InfiniteScrollTriggerProps) {
  const { ref, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      onLoadMore();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

  if (!hasNextPage) return null;

  // Idle, the sentinel keeps a height so the observer has something to see come into view.
  return (
    <div ref={ref} className={isFetchingNextPage ? undefined : "h-8"}>
      {isFetchingNextPage && loading}
    </div>
  );
}

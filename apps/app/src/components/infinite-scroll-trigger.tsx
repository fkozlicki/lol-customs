"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

interface InfiniteScrollTriggerProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export function InfiniteScrollTrigger({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: InfiniteScrollTriggerProps) {
  const { ref, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      onLoadMore();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

  if (!hasNextPage) return null;

  return (
    <div ref={ref} className="flex justify-center py-4">
      {isFetchingNextPage && (
        <div className="border-muted-foreground h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
      )}
    </div>
  );
}

import MatchCardSkeleton from "./match-card-skeleton";

export default function MatchHistorySkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  );
}

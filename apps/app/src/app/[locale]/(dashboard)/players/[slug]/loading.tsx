import { Card, CardContent, CardHeader } from "@v1/ui/card";
import { Skeleton } from "@v1/ui/skeleton";
import MatchCardSkeleton from "@/components/matches/match-card-skeleton";

function CardSkeleton() {
  return (
    <Card className="ring-0 rounded-sm">
      <CardHeader>
        <Skeleton className="h-6 w-28" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-24 w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}

export default function PlayerProfileLoading() {
  return (
    <>
      <div className="border-b p-6">
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
      <div className="bg-secondary">
        <div className="flex p-6 gap-2 max-w-6xl mx-auto w-full flex-col xl:flex-row">
          <div className="xl:max-w-[330px] flex flex-col gap-2 flex-1">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="flex-1 space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

import { PageShell } from "@v1/ui/recipes/page-shell";
import { PlayerProfileSkeleton } from "@v1/ui/recipes/player/player-profile-skeleton";

export default function PlayerProfileLoading() {
  return (
    <PageShell>
      <PlayerProfileSkeleton />
    </PageShell>
  );
}

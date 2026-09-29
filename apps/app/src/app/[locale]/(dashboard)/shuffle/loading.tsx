import { PageHeaderSkeleton } from "@v1/ui/recipes/page-header";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { RandomTeamsToolSkeleton } from "@v1/ui/recipes/random-teams/random-teams-tool-skeleton";

export default function ShuffleLoading() {
  return (
    <PageShell>
      <PageHeaderSkeleton />
      <RandomTeamsToolSkeleton />
    </PageShell>
  );
}

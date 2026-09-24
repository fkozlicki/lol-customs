import { PageHeaderSkeleton } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { RandomTeamsToolSkeleton } from "@/components/random-teams/random-teams-tool";

export default function ShuffleLoading() {
  return (
    <PageShell>
      <PageHeaderSkeleton />
      <RandomTeamsToolSkeleton />
    </PageShell>
  );
}

import { NotFound } from "@v1/ui/recipes/not-found";
import { PageShell } from "@v1/ui/recipes/page-shell";

/** What `notFound()` renders on a dashboard page: a 404 that keeps the top bar and the footer. */
export default function DashboardNotFound() {
  return (
    <PageShell>
      <NotFound homeHref="/" />
    </PageShell>
  );
}

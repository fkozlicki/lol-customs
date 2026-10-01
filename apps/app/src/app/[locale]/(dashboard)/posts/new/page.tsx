import { PageShell } from "@v1/ui/recipes/page-shell";
import { NewPostForm } from "@/components/forum/new-post-form";

export default function NewPostPage() {
  return (
    <PageShell width="reading">
      <NewPostForm />
    </PageShell>
  );
}

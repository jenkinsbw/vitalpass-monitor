import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { collectSnapshot } from "@/server/actions";

export function CollectForm({ siteId }: { siteId: string }) {
  return (
    <form
      action={collectSnapshot}
      method="post"
      className="flex flex-col items-start gap-2"
    >
      <input type="hidden" name="siteId" value={siteId} />
      <button type="submit" className={cn(buttonVariants())}>
        Save Snapshot
      </button>
    </form>
  );
}

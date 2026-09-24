import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteSnapshot } from "@/server/actions";

type DeleteSnapshotButtonProps = {
  snapshotId: string;
  siteId: string;
  label: string;
};

export function DeleteSnapshotButton({
  snapshotId,
  siteId,
  label,
}: DeleteSnapshotButtonProps) {
  const formId = `delete-snapshot-${snapshotId}`;
  const confirmMessage = `Delete this snapshot?\n\n${label}\n\nThis cannot be undone.`;

  return (
    <>
      <form id={formId} action={deleteSnapshot} method="post">
        <input type="hidden" name="id" value={snapshotId} />
        <input type="hidden" name="siteId" value={siteId} />
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
        >
          Delete
        </button>
      </form>
      <script
        dangerouslySetInnerHTML={{
          __html: `(()=>{const f=document.getElementById(${JSON.stringify(formId)});if(!f||f.dataset.confirmBound==="1")return;f.dataset.confirmBound="1";f.addEventListener("submit",(e)=>{if(!window.confirm(${JSON.stringify(confirmMessage)}))e.preventDefault();});})();`,
        }}
      />
    </>
  );
}

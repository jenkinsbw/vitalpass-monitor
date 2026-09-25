"use client";

import { Loader2Icon } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { useSnapshotRefresh } from "@/components/snapshot-refresh";
import { Button } from "@/components/ui/button";
import { collectSnapshot, type ActionState } from "@/server/actions";

const initialState: ActionState = null;

export function CollectForm({ siteId }: { siteId: string }) {
  const [state, action, pending] = useActionState(collectSnapshot, initialState);
  const { bump } = useSnapshotRefresh();
  const toasted = useRef<ActionState>(null);

  useEffect(() => {
    if (!state || pending || toasted.current === state) {
      return;
    }

    toasted.current = state;

    if (state.success) {
      toast.success(state.success, {
        description: state.detail,
      });
      bump();
      return;
    }

    if (state.error) {
      toast.error("Could not save the snapshot.", {
        description: state.error,
      });
    }
  }, [state, pending, bump]);

  return (
    <>
      <form action={action}>
        <input type="hidden" name="siteId" value={siteId} />
        <Button type="submit" disabled={pending}>
          Save Snapshot
        </Button>
      </form>
      {pending ? <SavingSnapshotOverlay /> : null}
    </>
  );
}

function SavingSnapshotOverlay() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-xl border bg-card px-6 py-8 text-center shadow-lg">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm font-medium">Saving snapshot…</p>
        <p className="text-sm text-muted-foreground">
          Fetching origin and home for phone and desktop.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useActionState, useEffect } from "react";

import { useSnapshotRefresh } from "@/components/snapshot-refresh";
import { Button } from "@/components/ui/button";
import { collectSnapshot, type ActionState } from "@/server/actions";

const initialState: ActionState = null;

export function CollectForm({ siteId }: { siteId: string }) {
  const [state, action, pending] = useActionState(collectSnapshot, initialState);
  const { bump } = useSnapshotRefresh();

  useEffect(() => {
    if (state?.success) {
      bump();
    }
  }, [state, bump]);

  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="siteId" value={siteId} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving snapshot…" : "Save Snapshot"}
      </Button>
      {pending ? (
        <p className="max-w-xs text-sm text-muted-foreground" role="status">
          Fetching origin and home for phone and desktop.
        </p>
      ) : null}
      {state?.error ? (
        <p role="alert" className="max-w-xs text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success && !pending ? (
        <p role="status" className="max-w-xs text-sm text-muted-foreground">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}

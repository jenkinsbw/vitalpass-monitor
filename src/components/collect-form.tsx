"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { collectSnapshot, type ActionState } from "@/server/actions";

const initialState: ActionState = null;

export function CollectForm({ siteId }: { siteId: string }) {
  const [state, action, pending] = useActionState(collectSnapshot, initialState);

  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="siteId" value={siteId} />
      <Button type="submit" disabled={pending}>
        {pending ? "Fetching…" : "Fetch now"}
      </Button>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

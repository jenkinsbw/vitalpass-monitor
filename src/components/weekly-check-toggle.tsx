"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setWeeklyCheck, type ActionState } from "@/server/actions";

const initialState: ActionState = null;

export function WeeklyCheckToggle({
  siteId,
  enabled,
}: {
  siteId: string;
  enabled: boolean;
}) {
  const [state, action, pending] = useActionState(setWeeklyCheck, initialState);
  const toasted = useRef<ActionState>(null);

  useEffect(() => {
    if (!state || pending || toasted.current === state) {
      return;
    }

    toasted.current = state;

    if (state.success) {
      toast.success(state.success);
      return;
    }

    if (state.error) {
      toast.error(state.error);
    }
  }, [state, pending]);

  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />
      <Button
        type="submit"
        variant={enabled ? "default" : "outline"}
        disabled={pending}
        aria-pressed={enabled}
      >
        {pending ? "Saving…" : enabled ? "On" : "Off"}
      </Button>
      <p className="text-sm text-muted-foreground">
        {enabled
          ? "This origin is included in the weekly check."
          : "Turn on to include this origin in the weekly check."}
      </p>
    </form>
  );
}

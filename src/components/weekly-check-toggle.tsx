"use client";

import { Loader2Icon } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
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
  const [checked, setChecked] = useState(enabled);
  const formRef = useRef<HTMLFormElement>(null);
  const enabledRef = useRef<HTMLInputElement>(null);
  const toasted = useRef<ActionState>(null);

  useEffect(() => {
    setChecked(enabled);
  }, [enabled]);

  useEffect(() => {
    if (!state || pending || toasted.current === state) {
      return;
    }

    toasted.current = state;

    if (state.success) {
      toast.success(state.success);
      return;
    }

    setChecked(enabled);

    if (state.error) {
      toast.error(state.error);
    }
  }, [state, pending, enabled]);

  return (
    <form ref={formRef} action={action} className="flex items-center gap-2">
      <input type="hidden" name="siteId" value={siteId} />
      <input ref={enabledRef} type="hidden" name="enabled" value={checked ? "true" : "false"} />
      <Switch
        checked={checked}
        disabled={pending}
        className="data-checked:bg-green-600"
        aria-label="Weekly check"
        onCheckedChange={(next) => {
          setChecked(next);
          if (enabledRef.current) {
            enabledRef.current.value = next ? "true" : "false";
          }
          formRef.current?.requestSubmit();
        }}
      />
      <span className="flex size-4 items-center justify-center" aria-hidden={!pending}>
        {pending ? (
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
        ) : null}
      </span>
      {pending ? <span className="sr-only">Saving weekly check</span> : null}
    </form>
  );
}

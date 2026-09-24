"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { deleteUser, type ActionState } from "@/server/actions";

const initialState: ActionState = null;

type DeleteUserButtonProps = {
  userId: string;
  disabled?: boolean;
};

export function DeleteUserButton({ userId, disabled }: DeleteUserButtonProps) {
  const [state, action, pending] = useActionState(deleteUser, initialState);

  return (
    <form action={action} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="id" value={userId} />
      <Button
        type="submit"
        variant="destructive"
        size="sm"
        disabled={disabled || pending}
      >
        {pending ? "Deleting…" : "Delete"}
      </Button>
      {state?.error ? (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

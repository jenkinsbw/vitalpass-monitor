"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteUser, type ActionState } from "@/server/actions";

const initialState: ActionState = null;

type DeleteUserButtonProps = {
  userId: string;
  disabled?: boolean;
};

export function DeleteUserButton({ userId, disabled }: DeleteUserButtonProps) {
  const [state, action, pending] = useActionState(deleteUser, initialState);

  if (disabled) {
    return (
      <Button type="button" variant="destructive" size="sm" disabled>
        Delete
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="destructive"
            size="sm"
            type="button"
            disabled={pending}
          />
        }
      >
        {pending ? "Deleting…" : "Delete"}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this user?</AlertDialogTitle>
          <AlertDialogDescription>
            This account will no longer be able to sign in. This cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {state?.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={action}>
            <input type="hidden" name="id" value={userId} />
            <AlertDialogAction
              type="submit"
              variant="destructive"
              disabled={pending}
            >
              {pending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

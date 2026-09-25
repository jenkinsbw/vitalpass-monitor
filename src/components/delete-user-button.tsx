"use client";

import { Trash2Icon } from "lucide-react";
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
  size?: "default" | "sm";
};

export function DeleteUserButton({
  userId,
  disabled,
  size = "sm",
}: DeleteUserButtonProps) {
  const [state, action, pending] = useActionState(deleteUser, initialState);

  if (disabled) {
    return (
      <Button
        type="button"
        variant="destructive"
        size={size}
        disabled
        className="cursor-not-allowed disabled:pointer-events-auto"
      >
        <Trash2Icon data-icon="inline-start" />
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
            size={size}
            type="button"
            disabled={pending}
            className="cursor-pointer"
          />
        }
      >
        <Trash2Icon data-icon="inline-start" />
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

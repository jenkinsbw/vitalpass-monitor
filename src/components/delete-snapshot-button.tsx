"use client";

import { useActionState, useEffect } from "react";

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
import { deleteSnapshot, type ActionState } from "@/server/actions";

const initialState: ActionState = null;

type DeleteSnapshotButtonProps = {
  snapshotId: string;
  siteId: string;
  label: string;
  onDeleted: () => void;
};

export function DeleteSnapshotButton({
  snapshotId,
  siteId,
  label,
  onDeleted,
}: DeleteSnapshotButtonProps) {
  const [state, action, pending] = useActionState(deleteSnapshot, initialState);

  useEffect(() => {
    if (state?.success) {
      onDeleted();
    }
  }, [state, onDeleted]);

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="destructive" size="sm" type="button" />}
      >
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this snapshot?</AlertDialogTitle>
          <AlertDialogDescription>
            {label}. This cannot be undone.
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
            <input type="hidden" name="id" value={snapshotId} />
            <input type="hidden" name="siteId" value={siteId} />
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

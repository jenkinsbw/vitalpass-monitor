"use client";

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
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={deleteSnapshot}>
            <input type="hidden" name="id" value={snapshotId} />
            <input type="hidden" name="siteId" value={siteId} />
            <AlertDialogAction type="submit" variant="destructive">
              Delete
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

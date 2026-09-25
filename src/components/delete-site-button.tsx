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
import { deleteSite, type ActionState } from "@/server/actions";

const initialState: ActionState = null;

type DeleteSiteButtonProps = {
  siteId: string;
  size?: "default" | "sm";
};

export function DeleteSiteButton({
  siteId,
  size = "sm",
}: DeleteSiteButtonProps) {
  const [state, action, pending] = useActionState(deleteSite, initialState);

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="destructive"
            size={size}
            type="button"
            disabled={pending}
          />
        }
      >
        <Trash2Icon data-icon="inline-start" />
        {pending ? "Deleting…" : "Delete"}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this site?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete the site and all of its data. This cannot be
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
            <input type="hidden" name="id" value={siteId} />
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

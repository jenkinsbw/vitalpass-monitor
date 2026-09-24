"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser, updateUser, type ActionState } from "@/server/actions";

const initialState: ActionState = null;

type UserFormValues = {
  id: string;
  email: string;
  name: string;
  lastName: string;
};

type UserFormProps = {
  user?: UserFormValues;
};

export function UserForm({ user }: UserFormProps) {
  const action = user ? updateUser : createUser;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      {user ? <input type="hidden" name="id" value={user.id} /> : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={user?.name}
          autoComplete="given-name"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lastName">Last name</Label>
        <Input
          id="lastName"
          name="lastName"
          required
          defaultValue={user?.lastName}
          autoComplete="family-name"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={user?.email}
          autoComplete="email"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">
          {user ? "New password" : "Password"}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required={!user}
          minLength={user ? undefined : 8}
          autoComplete="new-password"
          placeholder={user ? "Leave blank to keep current" : undefined}
        />
        {user ? (
          <p className="text-xs text-muted-foreground">
            Leave blank to keep the current password.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            At least 8 characters.
          </p>
        )}
      </div>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending
          ? "Saving…"
          : user
            ? "Save changes"
            : "Create user"}
      </Button>
    </form>
  );
}

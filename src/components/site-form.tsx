"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSite, type ActionState } from "@/server/actions";

const initialState: ActionState = null;

export function SiteForm() {
  const [state, action, pending] = useActionState(createSite, initialState);

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required placeholder="Storefront" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="origin">Origin</Label>
        <Input
          id="origin"
          name="origin"
          required
          placeholder="https://example.com"
          inputMode="url"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="formFactor">Form factor</Label>
        <select
          id="formFactor"
          name="formFactor"
          defaultValue="PHONE"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="PHONE">Phone</option>
          <option value="DESKTOP">Desktop</option>
        </select>
      </div>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Add site"}
      </Button>
    </form>
  );
}

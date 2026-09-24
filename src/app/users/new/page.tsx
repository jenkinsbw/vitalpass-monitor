import Link from "next/link";

import { UserForm } from "@/components/user-form";

export default function NewUserPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/users"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to users
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Add user
        </h1>
        <p className="text-sm text-muted-foreground">
          Create an account that can sign in to VitalPass.
        </p>
      </div>
      <UserForm />
    </div>
  );
}

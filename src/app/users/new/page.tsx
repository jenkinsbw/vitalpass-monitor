import { BackLink } from "@/components/back-link";
import { UserForm } from "@/components/user-form";

export default function NewUserPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-3">
        <BackLink href="/users">Back to Users</BackLink>
        <h1 className="text-2xl font-semibold tracking-tight">Add user</h1>
        <p className="text-sm text-muted-foreground">
          Create an account that can sign in to VitalPass.
        </p>
      </div>
      <UserForm />
    </div>
  );
}

import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { BackLink } from "@/components/back-link";
import { UserForm } from "@/components/user-form";
import { getUser } from "@/server/users";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, session] = await Promise.all([getUser(id), auth()]);

  if (!user) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-3">
        <BackLink href="/users">Back to Users</BackLink>
        <h1 className="text-2xl font-semibold tracking-tight">Edit user</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
      <UserForm
        user={user}
        allowDelete={session?.user?.id !== user.id}
      />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";

import { UserForm } from "@/components/user-form";
import { getUser } from "@/server/users";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser(id);

  if (!user) {
    notFound();
  }

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
          Edit user
        </h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
      <UserForm user={user} />
    </div>
  );
}

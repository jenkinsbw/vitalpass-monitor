import { PlusIcon } from "lucide-react";
import Link from "next/link";

import { auth } from "@/auth";
import { BackLink } from "@/components/back-link";
import { DeleteUserButton } from "@/components/delete-user-button";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listUsers } from "@/server/users";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [session, users] = await Promise.all([auth(), listUsers()]);
  const currentUserId = session?.user?.id;

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/">Back to Sites</BackLink>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Accounts that can sign in to VitalPass.
          </p>
        </div>
        <Link
          href="/users/new"
          className={buttonVariants({ variant: "success" })}
        >
          <PlusIcon data-icon="inline-start" />
          Add user
        </Link>
      </div>

      {users.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No users yet</CardTitle>
            <CardDescription>
              Create a user so someone can sign in.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {users.map((user) => (
            <li key={user.id}>
              <Card
                size="sm"
                className="relative transition-colors hover:bg-muted/40"
              >
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <Link
                    href={`/users/${user.id}`}
                    className="flex min-w-0 flex-1 items-baseline gap-3 after:absolute after:inset-0"
                  >
                    <CardTitle className="truncate">{user.email}</CardTitle>
                    <CardDescription className="truncate">
                      {user.name} {user.lastName}
                    </CardDescription>
                  </Link>
                  <div className="relative z-10 shrink-0">
                    <DeleteUserButton
                      userId={user.id}
                      disabled={user.id === currentUserId}
                    />
                  </div>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

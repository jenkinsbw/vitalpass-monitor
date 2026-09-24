import Link from "next/link";

import { auth } from "@/auth";
import { DeleteUserButton } from "@/components/delete-user-button";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCollectedAt } from "@/lib/vitals";
import { listUsers } from "@/server/users";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [session, users] = await Promise.all([auth(), listUsers()]);
  const currentUserId = session?.user?.id;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Accounts that can sign in to VitalPass.
          </p>
        </div>
        <Link href="/users/new" className={buttonVariants()}>
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
        <ul className="flex flex-col gap-3">
          {users.map((user) => (
            <li key={user.id}>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                  <div className="flex flex-col gap-1">
                    <CardTitle>
                      {user.name} {user.lastName}
                    </CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                    <p className="text-xs text-muted-foreground">
                      Created {formatCollectedAt(user.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/users/${user.id}`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      Edit
                    </Link>
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

import Link from "next/link";

import { logout } from "@/server/actions";
import { Button, buttonVariants } from "@/components/ui/button";

type UserMenuProps = {
  name: string;
  lastName: string;
  email: string;
};

export function UserMenu({ name, lastName, email }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium leading-none">
          {name} {lastName}
        </p>
        <p className="text-xs text-muted-foreground">{email}</p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/users"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Users
        </Link>
        <form action={logout}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}

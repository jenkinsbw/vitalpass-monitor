import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { buttonVariants } from "@/components/ui/button";

type UserMenuProps = {
  email: string;
};

export function UserMenu({ email }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3">
      <p className="max-w-40 truncate text-sm text-muted-foreground sm:max-w-none">
        {email}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href="/users"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Users
        </Link>
        <SignOutButton />
      </div>
    </div>
  );
}

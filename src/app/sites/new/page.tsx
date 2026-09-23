import Link from "next/link";

import { SiteForm } from "@/components/site-form";

export default function NewSitePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to sites
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Add site</h1>
        <p className="text-sm text-muted-foreground">
          Monitor one origin and form factor. Paths are stripped to the origin.
        </p>
      </div>
      <SiteForm />
    </div>
  );
}

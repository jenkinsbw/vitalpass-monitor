import { ClockIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

import { DeleteSiteButton } from "@/components/delete-site-button";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listSites } from "@/server/sites";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sites = await listSites();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sites</h1>
          <p className="text-sm text-muted-foreground">
            Origins monitored with the Chrome UX Report.
          </p>
        </div>
        <Link
          href="/sites/new"
          className={buttonVariants({ variant: "success" })}
        >
          <PlusIcon data-icon="inline-start" />
          Add site
        </Link>
      </div>

      {sites.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No sites yet</CardTitle>
            <CardDescription>
              Add an origin to store CrUX snapshots after VitalPass is applied.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {sites.map((site) => (
            <li key={site.id}>
              <Card
                size="sm"
                className="relative transition-colors hover:bg-muted/40"
              >
                <CardHeader className="flex flex-row items-center gap-3">
                  <Link
                    href={`/sites/${site.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 after:absolute after:inset-0"
                  >
                    <CardTitle className="shrink-0">{site.name}</CardTitle>
                    <CardDescription className="truncate">
                      {site.origin}
                    </CardDescription>
                    <ClockIcon
                      role="img"
                      aria-label={
                        site.weeklyCheckEnabled
                          ? "Weekly check on"
                          : "Weekly check off"
                      }
                      className={
                        site.weeklyCheckEnabled
                          ? "ml-auto size-4 shrink-0 text-green-600"
                          : "ml-auto size-4 shrink-0 text-muted-foreground"
                      }
                    />
                  </Link>
                  <div className="relative z-10 shrink-0">
                    <DeleteSiteButton siteId={site.id} />
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

import "server-only";

import { db } from "@/lib/db";

export function listSiteAlerts(siteId: string) {
  return db.alert.findMany({
    where: { siteId },
    orderBy: { createdAt: "desc" },
  });
}

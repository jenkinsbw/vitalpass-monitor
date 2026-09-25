"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Scope = "origin" | "home";

const TABS: { id: Scope; label: string }[] = [
  { id: "origin", label: "Origin" },
  { id: "home", label: "Home" },
];

export function CruxScopeTabs({
  origin,
  home,
  action,
}: {
  origin: ReactNode;
  home: ReactNode;
  action?: ReactNode;
}) {
  const [scope, setScope] = useState<Scope>("origin");
  const panel = scope === "origin" ? origin : home;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="CrUX scope"
          className="flex w-fit gap-1 rounded-lg border p-1"
        >
          {TABS.map((tab) => {
            const selected = scope === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setScope(tab.id)}
                className={cn(
                  "cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  selected
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        {action}
      </div>
      <div role="tabpanel">{panel}</div>
    </div>
  );
}

import { BackLink } from "@/components/back-link";
import { SiteForm } from "@/components/site-form";

export default function NewSitePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-3">
        <BackLink href="/">Back to Sites</BackLink>
        <h1 className="text-2xl font-semibold tracking-tight">Add site</h1>
        <p className="text-sm text-muted-foreground">
          Monitor one origin and form factor. Paths are stripped to the origin.
        </p>
      </div>
      <SiteForm />
    </div>
  );
}

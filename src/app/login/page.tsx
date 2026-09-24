import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Access your VitalPass monitoring dashboard.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}

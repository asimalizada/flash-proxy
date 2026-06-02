import { LoginForm } from "@/components/auth/login-form";
import { LoginShell } from "@/components/auth/login-shell";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = params.next?.startsWith("/") ? params.next : "/dashboard";

  return (
    <LoginShell>
      <LoginForm redirectTo={redirectTo} />
    </LoginShell>
  );
}

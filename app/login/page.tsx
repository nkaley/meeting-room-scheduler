"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSwitcherCompact } from "@/components/language-switcher";

function LoginForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        const message =
          res.error === "CredentialsSignin" || res.error === "CallbackRouteError"
            ? t("loginErrorCredentials")
            : res.error;
        setError(message);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6 rounded-lg border p-6">
      <h1 className="text-center text-2xl font-bold">{t("login")}</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" name="email" type="email" required placeholder={t("emailPlaceholder")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("loginButtonLoading") : t("loginButton")}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-primary underline">
          {t("register")}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitcherCompact />
      </div>
      <Suspense fallback={<LoginFormLoading />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

function LoginFormLoading() {
  const { t } = useLanguage();
  return (
    <div className="w-full max-w-sm rounded-lg border p-6 text-center text-muted-foreground">
      {t("loading")}
    </div>
  );
}

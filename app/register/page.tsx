"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSwitcherCompact } from "@/components/language-switcher";
import { sendRegisterCode, completeRegistration } from "@/app/actions/auth";

const RESEND_COOLDOWN_SEC = 60;

type Step1Data = {
  email: string;
  password: string;
  name: string;
  surname: string;
};

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeValue, setCodeValue] = useState("");
  const formStep1Ref = useRef<HTMLFormElement>(null);
  const formStep2Ref = useRef<HTMLFormElement>(null);

  const runResendCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN_SEC);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  async function runStep1(e?: React.FormEvent<HTMLFormElement>) {
    const form = e?.currentTarget ?? formStep1Ref.current;
    if (!form) {
      setError(t("networkOrRefreshError"));
      return;
    }
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value?.trim() ?? "";
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value ?? "";
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value?.trim() ?? "";
    const surname = (form.elements.namedItem("surname") as HTMLInputElement)?.value?.trim() ?? "";
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("email", email);
      fd.set("password", password);
      fd.set("name", name);
      fd.set("surname", surname);
      const result = await sendRegisterCode(fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setStep1Data({ email, password, name, surname });
      setCodeValue("");
      setStep(2);
      runResendCooldown();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message || t("registerError"));
    } finally {
      setLoading(false);
    }
  }

  function onStep1Submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    void runStep1(e);
  }

  async function runStep2(e?: React.FormEvent<HTMLFormElement>) {
    const form = e?.currentTarget ?? formStep2Ref.current;
    if (!form || !step1Data) {
      setError(t("networkOrRefreshError"));
      return;
    }
    const code = (form.elements.namedItem("code") as HTMLInputElement)?.value?.trim() ?? "";
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("email", step1Data.email);
      fd.set("code", code);
      fd.set("password", step1Data.password);
      fd.set("name", step1Data.name);
      fd.set("surname", step1Data.surname);
      const result = await completeRegistration(fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      const signInResult = await signIn("credentials", {
        email: step1Data.email,
        password: step1Data.password,
        redirect: false,
      });
      if (signInResult?.ok) {
        router.push("/");
        router.refresh();
      } else {
        router.push("/login?registered=1");
        router.refresh();
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message || t("registerError"));
    } finally {
      setLoading(false);
    }
  }

  function onStep2Submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    void runStep2(e);
  }

  async function onResendCode() {
    if (!step1Data || resendCooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("email", step1Data.email);
      fd.set("password", step1Data.password);
      fd.set("name", step1Data.name);
      fd.set("surname", step1Data.surname);
      const result = await sendRegisterCode(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      runResendCooldown();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message || t("registerError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitcherCompact />
      </div>
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-6">
        <h1 className="text-center text-2xl font-bold">{t("register")}</h1>

        {step === 1 && (
          <form ref={formStep1Ref} method="post" action="#" onSubmit={onStep1Submit} className="space-y-4">
            {error && (
              <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" name="email" type="email" required placeholder={t("emailPlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname">{t("surname")}</Label>
              <Input id="surname" name="surname" required maxLength={50} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input id="name" name="name" required maxLength={50} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("registerButtonLoading") : t("registerNextStep")}
            </Button>
          </form>
        )}

        {step === 2 && step1Data && (
          <form ref={formStep2Ref} method="post" action="#" onSubmit={onStep2Submit} className="space-y-4">
            {error && (
              <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>
            )}
            <p className="text-sm text-muted-foreground">{t("verificationCodeSent")}</p>
            <p className="text-xs text-muted-foreground">{step1Data.email}</p>
            <div className="space-y-2">
              <Label htmlFor="code">{t("verificationCode")}</Label>
              <Input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={t("verificationCodePlaceholder")}
                maxLength={6}
                pattern="[0-9]{6}"
                required
                value={codeValue}
                onChange={(e) => setCodeValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-lg tracking-widest"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("registerButtonLoading") : t("confirmRegistration")}
            </Button>
            <div className="flex justify-center">
              {resendCooldown > 0 ? (
                <span className="text-sm text-muted-foreground">
                  {t("resendCodeIn").replace("{sec}", String(resendCooldown))}
                </span>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onResendCode}
                  disabled={loading}
                >
                  {t("resendCode")}
                </Button>
              )}
            </div>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link href="/login" className="text-primary underline">
            {t("login")}
          </Link>
        </p>
      </div>
    </main>
  );
}


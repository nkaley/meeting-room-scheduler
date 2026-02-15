"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

export function NoRoomsMessage({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useLanguage();
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        {t("noRooms")}{" "}
        {isAdmin ? (
          <>
            {t("noRoomsAdminIntro")}
            <Link href="/admin/rooms" className="font-medium underline">
              {t("noRoomsAdminLink")}
            </Link>
            {t("noRoomsAdminEnd")}
          </>
        ) : (
          t("noRoomsUser")
        )}
      </p>
    </main>
  );
}

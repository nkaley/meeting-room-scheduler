"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "calendar-days": CalendarDays,
};

type AdminPageHeaderProps = {
  titleKey: string;
  iconName?: keyof typeof ICONS;
};

export function AdminPageHeader({ titleKey, iconName }: AdminPageHeaderProps) {
  const { t } = useLanguage();
  const Icon = iconName ? ICONS[iconName] : null;
  return (
    <div className="flex items-center gap-4">
      <Link href="/">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      <h1 className="text-2xl font-bold flex items-center gap-2">
        {Icon && <Icon className="h-6 w-6" />}
        {t(titleKey)}
      </h1>
    </div>
  );
}

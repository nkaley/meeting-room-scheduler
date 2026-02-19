"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { CalendarDays, LogOut, Settings, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";

type DashboardHeaderProps = {
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string };
  isAdmin: boolean;
};

export function DashboardHeader({ user, isAdmin }: DashboardHeaderProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md md:px-6">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <span className="text-lg">📅</span>
        <span className="hidden sm:inline">{t("appName")}</span>
      </Link>

      <div className="ml-auto flex flex-1 items-center justify-end gap-2 sm:gap-3">
        <LanguageSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                {user?.name && <p className="font-medium">{user.name}</p>}
                {user?.email && (
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                {t("navCalendar")}
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/admin/bookings" className="cursor-pointer">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {t("adminBookings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/rooms" className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    {t("adminRooms")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/users" className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    {t("adminUsers")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    {t("adminSettings")}
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onSelect={() => signOut({ callbackUrl: "/login" }).then(() => router.refresh())}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("navLogout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

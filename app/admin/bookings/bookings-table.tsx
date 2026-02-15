"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { cancelBooking } from "@/app/actions/bookings";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/language-context";

type BookingRow = {
  id: string;
  startTime: string;
  endTime: string;
  roomName: string;
  userName: string;
  userEmail: string;
  description: string | null;
};

function formatDateTimeRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${format(s, "dd.MM.yyyy, HH:mm")} – ${format(e, "HH:mm")}`;
}

export function BookingsTable({ bookings }: { bookings: BookingRow[] }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);
    const res = await cancelBooking(id);
    setDeletingId(null);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setConfirmId(null);
    router.refresh();
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("dateTime")}</TableHead>
              <TableHead>{t("room")}</TableHead>
              <TableHead>{t("user")}</TableHead>
              <TableHead>{t("descriptionColumn")}</TableHead>
              <TableHead className="w-[80px]">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {formatDateTimeRange(b.startTime, b.endTime)}
                </TableCell>
                <TableCell>{b.roomName}</TableCell>
                <TableCell>
                  <span className="font-medium">{b.userName}</span>
                  <span className="block text-xs text-muted-foreground">{b.userEmail}</span>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {b.description || "—"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setConfirmId(b.id);
                      setError(null);
                    }}
                    title={t("delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!confirmId} onOpenChange={(open) => !open && setConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteBookingConfirm")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("deleteBookingConfirmDesc")}
            </p>
            {error && (
              <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmId(null)}>
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                disabled={!!deletingId}
                onClick={() => confirmId && handleDelete(confirmId)}
              >
                {deletingId ? t("deleting") : t("delete")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

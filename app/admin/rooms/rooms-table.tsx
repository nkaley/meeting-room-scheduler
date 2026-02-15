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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createRoom, updateRoom, deleteRoom } from "@/app/actions/rooms";
import { useLanguage } from "@/contexts/language-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Room = { id: string; name: string; description: string | null; isActive: boolean };

export function RoomsTable({ rooms }: { rooms: Room[] }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [editing, setEditing] = useState<Room | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  function openEdit(room: Room) {
    setEditing(room);
    setName(room.name);
    setDescription(room.description ?? "");
    setIsActive(room.isActive);
    setError(null);
  }

  function openCreate() {
    setCreating(true);
    setName("");
    setDescription("");
    setError(null);
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setError(null);
    const res = await updateRoom(editing.id, name, description, isActive);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setEditing(null);
    router.refresh();
  }

  async function handleCreate() {
    setError(null);
    const res = await createRoom(name, description);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setCreating(false);
    router.refresh();
  }

  async function handleConfirmDelete() {
    if (!roomToDelete) return;
    await deleteRoom(roomToDelete.id);
    setRoomToDelete(null);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("add")}
        </Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("roomName")}</TableHead>
              <TableHead>{t("roomDescription")}</TableHead>
              <TableHead title={t("activeRoomHint")}>
                {t("status")}
              </TableHead>
              <TableHead className="w-[120px]">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell className="max-w-[200px] font-medium">
                  <span className="block truncate" title={room.name}>{room.name}</span>
                </TableCell>
                <TableCell className="max-w-[240px] text-muted-foreground">
                  <span className="block truncate" title={room.description || undefined}>
                    {room.description || "—"}
                  </span>
                </TableCell>
                <TableCell title={room.isActive ? t("roomActiveTitle") : t("roomHiddenTitle")}>
                  {room.isActive ? t("active") : t("hidden")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(room)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRoomToDelete(room)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editRoom")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label>{t("roomName")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
            </div>
            <div className="space-y-2">
              <Label>{t("roomDescription")}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={100}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="edit-isActive" className="cursor-pointer font-normal">
                {t("activeRoomHint")}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSaveEdit}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={creating} onOpenChange={(open) => !open && setCreating(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addRoom")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label>{t("roomName")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
            </div>
            <div className="space-y-2">
              <Label>{t("roomDescription")}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={100}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleCreate}>{t("add")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!roomToDelete} onOpenChange={(open) => !open && setRoomToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteRoomConfirm").replace("{name}", roomToDelete?.name ?? "")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteRoomConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={() => handleConfirmDelete()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

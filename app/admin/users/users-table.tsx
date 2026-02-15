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
import { Shield, ShieldOff, Trash2 } from "lucide-react";
import { deleteUser } from "@/app/actions/users";
import { useLanguage } from "@/contexts/language-context";

type User = {
  id: string;
  email: string;
  name: string;
  surname: string;
  role: string;
  createdAt: Date;
};

export function UsersTable({ users }: { users: User[] }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirmDelete() {
    if (!userToDelete) return;
    setError(null);
    setDeleting(true);
    try {
      const res = await deleteUser(userToDelete.id);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setUserToDelete(null);
      router.refresh();
    } catch (err) {
      setError(t("networkOrRefreshError"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fullName")}</TableHead>
              <TableHead>{t("email")}</TableHead>
              <TableHead>{t("roleLabel")}</TableHead>
              <TableHead className="w-[100px]">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.surname} {user.name}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1">
                    {user.role === "ADMIN" ? (
                      <Shield className="h-4 w-4 text-primary" />
                    ) : (
                      <ShieldOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    {user.role === "ADMIN" ? t("admin") : t("userRole")}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setUserToDelete(user);
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

      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteUserConfirm")}</DialogTitle>
          </DialogHeader>
          {userToDelete && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("deleteUserConfirmDesc")}{" "}
                <strong>
                  {userToDelete.surname} {userToDelete.name}
                </strong>{" "}
                ({userToDelete.email}).
              </p>
              {error && (
                <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setUserToDelete(null)}>
                  {t("cancel")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? t("deleting") : t("delete")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

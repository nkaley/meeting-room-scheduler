import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { RoomsTable } from "./rooms-table";
import { AdminPageHeader } from "@/components/admin-page-header";

export default async function AdminRoomsPage() {
  await requireAdmin();
  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <AdminPageHeader titleKey="adminRoomsTitle" />
        <RoomsTable rooms={rooms} />
      </div>
    </main>
  );
}

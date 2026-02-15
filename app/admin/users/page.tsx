import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { UsersTable } from "./users-table";
import { AdminPageHeader } from "@/components/admin-page-header";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: [{ surname: "asc" }, { name: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      surname: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <AdminPageHeader titleKey="adminUsersTitle" />
        <UsersTable users={users} />
      </div>
    </main>
  );
}

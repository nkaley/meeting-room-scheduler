import { requireAdmin } from "@/lib/auth-guard";
import { getOrCreateSettings } from "@/lib/settings";
import { AdminPageHeader } from "@/components/admin-page-header";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getOrCreateSettings();

  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <AdminPageHeader titleKey="adminSettingsTitle" />
        <SettingsForm initialSettings={settings} />
      </div>
    </main>
  );
}

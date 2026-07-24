import { AdminHeader } from "@/components/admin/admin-header";
import { HomeSettingsForm } from "@/components/admin/home-settings-form";
import { getSiteSettings } from "@/lib/settings";

export const metadata = {
  title: "Home page · Catalog Admin",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Home page</h1>
            <p className="text-sm text-muted-foreground">
              Edit the content shown on the public home page.
            </p>
          </div>
          <HomeSettingsForm settings={settings} />
        </div>
      </main>
    </div>
  );
}

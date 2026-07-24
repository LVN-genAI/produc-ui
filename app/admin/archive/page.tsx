import { AdminHeader } from "@/components/admin/admin-header";
import { ArchivePanel } from "@/components/admin/archive-panel";

export const metadata = {
  title: "Archive · Catalog Admin",
};

export const dynamic = "force-dynamic";

export default function ArchivePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />
      <main className="flex-1 overflow-auto">
        <ArchivePanel />
      </main>
    </div>
  );
}

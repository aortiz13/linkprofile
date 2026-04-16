import { Sidebar } from "@/components/admin/Sidebar";
import { QueryProvider } from "@/components/admin/QueryProvider";
import { AdminContent } from "@/components/admin/AdminContent";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <div className="flex min-h-screen bg-[var(--bg-base)]">
        <Sidebar />
        <AdminContent>{children}</AdminContent>
      </div>
    </QueryProvider>
  );
}

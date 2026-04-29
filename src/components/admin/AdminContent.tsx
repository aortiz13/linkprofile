"use client";

import { usePathname } from "next/navigation";
import { LivePreview } from "@/components/admin/LivePreview";

export function AdminContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showPreview = pathname === "/admin/profile";

  return (
    <main className="flex-1 ml-60 flex">
      <div className={`flex-1 p-8 ${showPreview ? "max-w-4xl" : "max-w-6xl"} mx-auto`}>
        {children}
      </div>
      {showPreview && (
        <div className="hidden lg:block w-[400px] border-l border-[var(--border)] p-8 bg-[var(--bg-elevated)]/30 overflow-y-auto h-screen sticky top-0">
          <LivePreview />
        </div>
      )}
    </main>
  );
}

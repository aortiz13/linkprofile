"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  LayoutTemplate,
  LogOut,
  Sparkles,
  Zap,
  Users,
  Gift,
  Mic,
  KanbanSquare,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Analítica", icon: BarChart3 },
  { href: "/admin/pipeline", label: "Embudo", icon: KanbanSquare },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
  { href: "/admin/lead-magnets", label: "Lead Magnets", icon: Gift },
  { href: "/admin/audio-snippets", label: "Audios WA", icon: Mic },
  { href: "/admin/profile", label: "Page Builder", icon: LayoutTemplate },
  { href: "/admin/features", label: "Features", icon: Zap },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <aside className="admin-sidebar w-60 h-screen flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-[var(--border)]">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--accent-light)]" />
          <span className="font-bold text-lg tracking-tight">LinkProfile</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm transition-all duration-200",
                isActive
                  ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-[var(--border)]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Eye,
  EyeOff,
  Trash2,
  ChevronDown,
  ChevronUp,
  Link2,
  Type,
  Video,
  Minus,
  AtSign,
  LayoutDashboard,
  Calendar,
} from "lucide-react";
import type { Block } from "@/lib/db/schema";

const BLOCK_ICONS: Record<string, React.ElementType> = {
  header: LayoutDashboard,
  links: Link2,
  text: Type,
  video: Video,
  divider: Minus,
  contact_form: AtSign,
  social_icons: AtSign,
  cal_com: Calendar,
};

const BLOCK_COLORS: Record<string, string> = {
  header: "#06b6d4",
  links: "#06b6d4",
  text: "#f59e0b",
  video: "#ef4444",
  divider: "#6b7280",
  contact_form: "#8b5cf6",
  social_icons: "#ec4899",
  cal_com: "#1d4ed8",
};

interface BlockItemProps {
  block: Block;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  children?: React.ReactNode; // inline editor
}

export function BlockItem({
  block,
  isExpanded,
  onToggleExpand,
  onToggleVisibility,
  onDelete,
  children,
}: BlockItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = BLOCK_ICONS[block.type] || Link2;
  const color = BLOCK_COLORS[block.type] || "#06b6d4";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-[var(--bg-surface)] border rounded-[var(--radius-lg)] transition-all ${
        isExpanded ? "border-[var(--accent)]" : "border-[var(--border)] hover:border-[var(--border-hover)]"
      } ${!block.visible ? "opacity-60" : ""}`}
    >
      {/* Row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + "15" }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>

        <button
          onClick={onToggleExpand}
          className="flex-1 text-left min-w-0"
        >
          <p className="text-sm font-medium truncate">{block.title || block.type}</p>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleVisibility}
            className="p-1.5 rounded-md hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            title={block.visible ? "Ocultar" : "Mostrar"}
          >
            {block.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {block.type !== "header" && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-md hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onToggleExpand}
            className="p-1.5 rounded-md hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded editor panel */}
      {isExpanded && (
        <div className="border-t border-[var(--border)] px-4 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Loader2, ExternalLink, Settings } from "lucide-react";
import { BlockItem } from "@/components/admin/BlockItem";
import { AddBlockModal } from "@/components/admin/AddBlockModal";
import {
  HeaderBlockEditor,
  LinksBlockEditor,
  TextBlockEditor,
  VideoBlockEditor,
  ContactFormBlockEditor,
  DividerBlockEditor,
  SocialIconsBlockEditor,
  ProductsBlockEditor,
  GeoCustomBlockEditor,
  AIGreetingEditor,
  CalComBlockEditor,
  CaseStudiesBlockEditor,
  LeadMagnetBlockEditor,
} from "@/components/admin/BlockEditorPanel";
import type { Block } from "@/lib/db/schema";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ─── Data ──────────────────────────────────────
  const { data: blocksData, isLoading } = useQuery({
    queryKey: ["admin-blocks"],
    queryFn: () => fetch("/api/admin/blocks").then((r) => r.json()),
  });

  const { data: profile } = useQuery({
    queryKey: ["admin-profile"],
    queryFn: () => fetch("/api/admin/profile").then((r) => r.json()),
  });

  const blocks: Block[] = blocksData?.blocks || [];

  // ─── Mutations ─────────────────────────────────
  const addBlockMutation = useMutation({
    mutationFn: (type: string) =>
      fetch("/api/admin/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blocks"] }),
  });

  const updateBlockMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      fetch(`/api/admin/blocks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blocks"] }),
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/blocks/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blocks"] }),
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      fetch("/api/admin/blocks/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blocks"] }),
  });

  // ─── Settings Mutations ────────────────────────
  const settingsMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-profile"] }),
  });

  // ─── Handlers ──────────────────────────────────
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      const reordered = arrayMove(blocks, oldIndex, newIndex);
      reorderMutation.mutate(reordered.map((b) => b.id));
    },
    [blocks, reorderMutation]
  );

  const handleUpdateConfig = useCallback(
    (blockId: string, config: Record<string, unknown>) => {
      updateBlockMutation.mutate({ id: blockId, config });
    },
    [updateBlockMutation]
  );

  // ─── Render ────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      {/* Left — Block Editor */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Page Builder</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Personaliza tu landing page con bloques
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm border transition-all ${
                showSettings
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]"
              }`}
            >
              <Settings className="w-4 h-4" />
              Config
            </button>
            {profile?.username && (
              <a
                href={`/`}
                target="_blank"
                className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-light)] transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ver Landing
              </a>
            )}
          </div>
        </div>

        {/* Settings Panel (collapsible) */}
        {showSettings && (
          <SettingsPanel profile={profile} onSave={(data: Record<string, unknown>) => settingsMutation.mutate(data)} isPending={settingsMutation.isPending} />
        )}

        {/* Add Block Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-4 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-all text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Agregar bloque
        </button>

        {/* Blocks List */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {blocks.map((block) => (
                <BlockItem
                  key={block.id}
                  block={block}
                  isExpanded={expandedId === block.id}
                  onToggleExpand={() =>
                    setExpandedId(expandedId === block.id ? null : block.id)
                  }
                  onToggleVisibility={() =>
                    updateBlockMutation.mutate({
                      id: block.id,
                      visible: !block.visible,
                    })
                  }
                  onDelete={() => deleteBlockMutation.mutate(block.id)}
                >
                  <BlockEditorSwitch
                    block={block}
                    onUpdate={(config) => handleUpdateConfig(block.id, config)}
                  />
                </BlockItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {blocks.length === 0 && (
          <div className="text-center py-16 text-[var(--text-muted)]">
            <p className="text-sm">No hay bloques aún.</p>
            <p className="text-xs mt-1">Click en "Agregar bloque" para empezar.</p>
          </div>
        )}
      </div>

      {/* Add Block Modal */}
      <AddBlockModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(type) => addBlockMutation.mutate(type)}
      />
    </div>
  );
}

// ─── Block Editor Switch ─────────────────────────────────────────────────────
function BlockEditorSwitch({ block, onUpdate }: { block: Block; onUpdate: (config: Record<string, unknown>) => void }) {
  switch (block.type) {
    case "header":
      return <HeaderBlockEditor block={block} onUpdate={onUpdate} />;
    case "links":
      return <LinksBlockEditor block={block} onUpdate={onUpdate} />;
    case "text":
      return <TextBlockEditor block={block} onUpdate={onUpdate} />;
    case "video":
      return <VideoBlockEditor block={block} onUpdate={onUpdate} />;
    case "contact_form":
      return <ContactFormBlockEditor block={block} onUpdate={onUpdate} />;
    case "divider":
      return <DividerBlockEditor block={block} onUpdate={onUpdate} />;
    case "social_icons":
      return <SocialIconsBlockEditor block={block} onUpdate={onUpdate} />;
    case "products":
      return <ProductsBlockEditor block={block} onUpdate={onUpdate} />;
    case "geo_custom":
      return <GeoCustomBlockEditor block={block} onUpdate={onUpdate} />;
    case "ai_greeting":
      return <AIGreetingEditor block={block} onUpdate={onUpdate} />;
    case "cal_com":
      return <CalComBlockEditor block={block} onUpdate={onUpdate} />;
    case "case_studies":
      return <CaseStudiesBlockEditor block={block} onUpdate={onUpdate} />;
    case "lead_magnet":
      return <LeadMagnetBlockEditor block={block} onUpdate={onUpdate} />;
    default:
      return <p className="text-sm text-[var(--text-muted)]">Editor no disponible para este tipo de bloque.</p>;
  }
}

// ─── Settings Panel ──────────────────────────────────────────────────────────
import { useState as useStateSettings } from "react";

function SettingsPanel({ profile, onSave, isPending }: { profile: Record<string, unknown> | undefined; onSave: (data: Record<string, unknown>) => void; isPending: boolean }) {
  const [theme, setTheme] = useState((profile?.theme as string) || "light");
  const [whatsappNumber, setWhatsappNumber] = useState((profile?.whatsappNumber as string) || "");
  const [vcardUrl, setVcardUrl] = useState((profile?.vcardUrl as string) || "");

  return (
    <div className="mb-6 p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] space-y-4">
      <h3 className="text-sm font-semibold">Configuración general</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider">Tema</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
            <option value="remax">Premium RE/MAX</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider">WhatsApp</label>
          <input
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="+56912345678"
            className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider">URL VCard</label>
          <input
            value={vcardUrl}
            onChange={(e) => setVcardUrl(e.target.value)}
            placeholder="https://.../contacto.vcf"
            className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>
      <button
        onClick={() => onSave({ theme, whatsappNumber, vcardUrl })}
        disabled={isPending}
        className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-light)] disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar configuración"}
      </button>
    </div>
  );
}

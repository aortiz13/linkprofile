"use client";

import { useState, useRef, useEffect } from "react";
import type { Block, Link as LinkType } from "@/lib/db/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Camera, Loader2, User, Plus, Trash2, GripVertical, Save, Link2 } from "lucide-react";

// Helper hook for debouncing input values to prevent API spam while typing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ─── Shared UI Components ────────────────────────────────────────────────────
function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] cursor-pointer hover:border-[var(--border-hover)] transition-colors">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
        <p className="text-xs text-[var(--text-muted)]">{description}</p>
      </div>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-[var(--border)] peer-checked:bg-[var(--accent)] rounded-full transition-colors" />
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
      </div>
    </label>
  );
}

// ─── Header Block Editor ─────────────────────────────────────────────────────
export function HeaderBlockEditor({ block, onUpdate }: { block: Block; onUpdate: (config: Record<string, unknown>) => void }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const config = block.config as { showAvatar?: boolean; showBio?: boolean; showUsername?: boolean };

  const { data: profile } = useQuery({
    queryKey: ["admin-profile"],
    queryFn: () => fetch("/api/admin/profile").then((r) => r.json()),
  });

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBio(profile.bio || "");
      setUsername(profile.username || "");
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-profile"] }),
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      return fetch("/api/admin/profile/avatar", { method: "POST", body: formData }).then((r) => r.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-profile"] }),
  });

  return (
    <div className="space-y-4">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border)]">
            {profile?.avatarUrl ? (
              <Image unoptimized src={profile.avatarUrl} alt="" width={64} height={64} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-6 h-6 text-[var(--text-muted)]" />
              </div>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {avatarMutation.isPending ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Camera className="w-4 h-4 text-white" />
            )}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0]; if (f) avatarMutation.mutate(f);
          }} />
        </div>
        <div className="flex-1 space-y-2">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre completo"
        className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
      />
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Bio"
        rows={2}
        className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] resize-none"
      />

      {/* Toggles */}
      <div className="flex gap-4">
        {(["showAvatar", "showBio", "showUsername"] as const).map((key) => (
          <label key={key} className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer">
            <input
              type="checkbox"
              checked={config[key] !== false}
              onChange={(e) => onUpdate({ ...config, [key]: e.target.checked })}
              className="accent-[var(--accent)]"
            />
            {key === "showAvatar" ? "Avatar" : key === "showBio" ? "Bio" : "Username"}
          </label>
        ))}
      </div>

      <button
        onClick={() => saveMutation.mutate({ name, bio, username })}
        disabled={saveMutation.isPending}
        className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-light)] transition-colors disabled:opacity-50"
      >
        {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar perfil
      </button>
    </div>
  );
}

// ─── Links Block Editor ──────────────────────────────────────────────────────
export function LinksBlockEditor({ block, onUpdate }: { block: Block; onUpdate: (config: Record<string, unknown>) => void }) {
  const queryClient = useQueryClient();
  const config = block.config as { layout?: string };

  const { data: linksData } = useQuery({
    queryKey: ["admin-links"],
    queryFn: () => fetch("/api/admin/links").then((r) => r.json()),
  });

  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const addMutation = useMutation({
    mutationFn: (data: { title: string; url: string }) =>
      fetch("/api/admin/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type: "custom", icon: "globe", active: true }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-links"] });
      setNewTitle("");
      setNewUrl("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/links/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-links"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: (link: LinkType) =>
      fetch(`/api/admin/links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !link.active }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-links"] }),
  });

  const links: LinkType[] = linksData?.links || [];

  return (
    <div className="space-y-3">
      {/* Layout selector */}
      <div className="flex gap-2 mb-2">
        {[
          { value: "list", label: "Lista" },
          { value: "bento", label: "Bento Grid" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => onUpdate({ ...config, layout: opt.value })}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium border transition-all ${
              config.layout === opt.value
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Existing links */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {links.map((link) => (
          <div
            key={link.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] text-sm ${!link.active ? "opacity-50" : ""}`}
          >
            <GripVertical className="w-3 h-3 text-[var(--text-muted)]" />
            <span className="flex-1 truncate">{link.title}</span>
            <button
              onClick={() => toggleMutation.mutate(link)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)]"
            >
              {link.active ? "ON" : "OFF"}
            </button>
            <button
              onClick={() => deleteMutation.mutate(link.id)}
              className="text-[var(--text-muted)] hover:text-red-500"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Quick add */}
      <div className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Título"
          className="flex-1 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
        />
        <input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="URL"
          className="flex-1 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
        />
        <button
          onClick={() => { if (newTitle && newUrl) addMutation.mutate({ title: newTitle, url: newUrl }); }}
          disabled={!newTitle || !newUrl || addMutation.isPending}
          className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-white text-sm hover:bg-[var(--accent-light)] disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Text Block Editor ───────────────────────────────────────────────────────
export function TextBlockEditor({ block, onUpdate }: { block: Block; onUpdate: (config: Record<string, unknown>) => void }) {
  const config = block.config as { content?: string; title?: string; alignment?: string; transparentBackground?: boolean };
  const [localTitle, setLocalTitle] = useState(config.title || "");
  const debouncedTitle = useDebounce(localTitle, 500);
  const [localContent, setLocalContent] = useState(config.content || "");
  const debouncedContent = useDebounce(localContent, 500);

  // Sync back to db when debounced content changes
  useEffect(() => {
    if (debouncedContent !== (config.content || "") || debouncedTitle !== (config.title || "")) {
      onUpdate({ ...config, content: debouncedContent, title: debouncedTitle });
    }
  }, [debouncedContent, debouncedTitle]);

  // Sync from props if db changes externally
  useEffect(() => {
    setLocalTitle(config.title || "");
    setLocalContent(config.content || "");
  }, [config.title, config.content]);

  return (
    <div className="space-y-4">
      {/* Title Field */}
      <fieldset className="border border-[var(--border)] rounded-xl px-3 pb-2 pt-0.5 focus-within:border-[var(--accent)] transition-colors relative">
        <legend className="text-xs text-[var(--text-muted)] px-1">Add title (optional)</legend>
        <div className="flex gap-2 items-center">
          <input
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            placeholder="Introduce tu título aquí..."
            className="w-full bg-transparent focus:outline-none text-[var(--text-primary)] text-sm"
          />
        </div>
      </fieldset>

      {/* Text Field */}
      <fieldset className="border border-[var(--border)] rounded-xl px-3 pb-2 pt-0.5 focus-within:border-[var(--accent)] transition-colors relative">
        <legend className="text-xs text-[var(--text-muted)] px-1">Add text</legend>
        <div className="flex gap-2 items-start">
          <textarea
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            placeholder="# Text!\n\nYou can use Markdown to customize text."
            rows={5}
            className="w-full bg-transparent focus:outline-none text-[var(--text-primary)] text-sm resize-none mt-1"
          />
        </div>
      </fieldset>

      {/* Toggles */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer">
          <input
            type="checkbox"
            checked={config.alignment === 'center'}
            onChange={(e) => onUpdate({ ...config, alignment: e.target.checked ? "center" : "left" })}
            className="accent-[var(--accent)] h-4 w-4 rounded border-gray-300"
          />
          Centrar texto
        </label>

        <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer">
          <input
            type="checkbox"
            checked={!!config.transparentBackground}
            onChange={(e) => onUpdate({ ...config, transparentBackground: e.target.checked })}
            className="accent-[var(--accent)] h-4 w-4 rounded border-gray-300"
          />
          Sin fondo ni bordes
        </label>
      </div>
    </div>
  );
}

// ─── Video Block Editor ──────────────────────────────────────────────────────
export function VideoBlockEditor({ block, onUpdate }: { block: Block; onUpdate: (config: Record<string, unknown>) => void }) {
  const config = block.config as { url?: string; provider?: string };
  const [localUrl, setLocalUrl] = useState(config.url || "");
  const debouncedUrl = useDebounce(localUrl, 500);

  useEffect(() => {
    if (debouncedUrl !== (config.url || "")) {
      onUpdate({ ...config, url: debouncedUrl, provider: detectProvider(debouncedUrl) });
    }
  }, [debouncedUrl]);

  useEffect(() => {
    setLocalUrl(config.url || "");
  }, [config.url]);

  const detectProvider = (url: string): string => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("tiktok.com")) return "tiktok";
    if (url.includes("vimeo.com")) return "vimeo";
    return "youtube";
  };

  return (
    <div className="space-y-3">
      <input
        value={localUrl}
        onChange={(e) => setLocalUrl(e.target.value)}
        placeholder="https://youtube.com/watch?v=..."
        className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
      />
      {config.url && (
        <p className="text-xs text-[var(--text-muted)]">
          Proveedor detectado: <span className="font-medium capitalize">{config.provider || "youtube"}</span>
        </p>
      )}
    </div>
  );
}

// ─── Contact Form Block Editor ───────────────────────────────────────────────
export function ContactFormBlockEditor({ block, onUpdate }: { block: Block; onUpdate: (config: Record<string, unknown>) => void }) {
  const config = block.config as { title?: string; fields?: string[] };
  const [localTitle, setLocalTitle] = useState(config.title || "");
  const debouncedTitle = useDebounce(localTitle, 500);

  useEffect(() => {
    if (debouncedTitle !== (config.title || "")) {
      onUpdate({ ...config, title: debouncedTitle });
    }
  }, [debouncedTitle]);

  useEffect(() => {
    setLocalTitle(config.title || "");
  }, [config.title]);

  return (
    <div className="space-y-3">
      <input
        value={localTitle}
        onChange={(e) => setLocalTitle(e.target.value)}
        placeholder="Título del formulario"
        className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
      />
      <div className="flex gap-3 flex-wrap">
        {["name", "email", "phone", "message"].map((field) => (
          <label key={field} className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer">
            <input
              type="checkbox"
              checked={(config.fields || ["name", "email", "phone", "message"]).includes(field)}
              onChange={(e) => {
                const fields = config.fields || ["name", "email", "phone", "message"];
                const next = e.target.checked ? [...fields, field] : fields.filter((f) => f !== field);
                onUpdate({ ...config, fields: next });
              }}
              className="accent-[var(--accent)]"
            />
            {field === "name" ? "Nombre" : field === "email" ? "Email" : field === "phone" ? "Teléfono" : "Mensaje"}
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Divider Block Editor ────────────────────────────────────────────────────
export function DividerBlockEditor({ block, onUpdate }: { block: Block; onUpdate: (config: Record<string, unknown>) => void }) {
  const config = block.config as { style?: string; height?: number };
  return (
    <div className="flex gap-4 items-center">
      <div className="flex gap-2">
        {(["line", "space", "dots"] as const).map((s) => (
          <button
            key={s}
            onClick={() => onUpdate({ ...config, style: s })}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium border transition-all capitalize ${
              (config.style || "line") === s
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--text-muted)]"
            }`}
          >
            {s === "line" ? "Línea" : s === "space" ? "Espacio" : "Puntos"}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--text-muted)]">Alto:</span>
        <input
          type="range"
          min={8}
          max={64}
          value={config.height || 32}
          onChange={(e) => onUpdate({ ...config, height: Number(e.target.value) })}
          className="w-24 accent-[var(--accent)]"
        />
        <span className="text-xs text-[var(--text-muted)] w-8">{config.height || 32}px</span>
      </div>
    </div>
  );
}

// ─── Social Icons Block Editor ───────────────────────────────────────────────
export function SocialIconsBlockEditor({ block, onUpdate }: { block: Block; onUpdate: (config: Record<string, unknown>) => void }) {
  const config = block.config as { icons?: { platform: string; url: string; title?: string; subtitle?: string }[]; layout?: "row" | "list" };
  const icons = config.icons || [];
  const layout = config.layout || "row";

  const PLATFORMS = ["instagram", "tiktok", "youtube", "twitter", "linkedin", "facebook", "whatsapp"];

  const addIcon = () => {
    onUpdate({ ...config, icons: [...icons, { platform: "instagram", url: "", title: "", subtitle: "" }] });
  };

  const updateIcon = (idx: number, key: string, value: string) => {
    const next = [...icons];
    next[idx] = { ...next[idx], [key]: value };
    onUpdate({ ...config, icons: next });
  };

  const removeIcon = (idx: number) => {
    onUpdate({ ...config, icons: icons.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-xs font-medium text-[var(--text-primary)]">Layout:</label>
        <select
          value={layout}
          onChange={(e) => onUpdate({ ...config, layout: e.target.value as "row" | "list" })}
          className="px-2 py-1.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none"
        >
          <option value="row">Fila de iconos</option>
          <option value="list">Lista con textos</option>
        </select>
      </div>

      <div className="space-y-3">
        {icons.map((icon, idx) => (
          <div key={idx} className="p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] space-y-2">
            <div className="flex items-center gap-2">
              <select
                value={icon.platform}
                onChange={(e) => updateIcon(idx, "platform", e.target.value)}
                className="w-1/3 px-2 py-1.5 rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--text-primary)] text-xs capitalize focus:outline-none bg-transparent"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input
                value={icon.url}
                onChange={(e) => updateIcon(idx, "url", e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent)] bg-transparent"
              />
              <button onClick={() => removeIcon(idx)} className="p-1.5 text-[var(--text-muted)] hover:text-red-500 rounded-md hover:bg-red-500/10">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {layout === "list" && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={icon.title || ""}
                  onChange={(e) => updateIcon(idx, "title", e.target.value)}
                  placeholder="Título (ej: Mi Instagram)"
                  className="px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent)] bg-transparent"
                />
                <input
                  value={icon.subtitle || ""}
                  onChange={(e) => updateIcon(idx, "subtitle", e.target.value)}
                  placeholder="Subtítulo (ej: @mi_usuario)"
                  className="px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent)] bg-transparent"
                />
              </div>
            )}
          </div>
        ))}
        <button
          onClick={addIcon}
          className="flex items-center justify-center w-full gap-2 py-2 text-xs font-medium text-[var(--accent)] border border-dashed border-[var(--border)] rounded-[var(--radius-lg)] hover:bg-[var(--accent)]/5 hover:border-[var(--accent)] transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar red social
        </button>
      </div>
    </div>
  );
}

// ─── Products Block Editor ───────────────────────────────────────────────────
export function ProductsBlockEditor({ block, onUpdate }: { block: Block; onUpdate: (config: Record<string, unknown>) => void }) {
  const config = block.config as { layout?: string; products?: { id: string; url: string; title: string; image: string }[] };
  const products = config.products || [];
  const layout = config.layout || "grid";

  const [newUrl, setNewUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  const handleAddProduct = async () => {
    if (!newUrl) return;
    setIsFetching(true);
    let title = "Nuevo Producto";
    let image = "";

    try {
      const res = await fetch(`/api/admin/metadata?url=${encodeURIComponent(newUrl)}`);
      if (res.ok) {
        const data = await res.json();
        title = data.title || title;
        image = data.image || image;
      }
    } catch (error) {
      console.error("Failed to fetch metadata", error);
    } finally {
      setIsFetching(false);
      onUpdate({
        ...config,
        products: [
          ...products,
          { id: Math.random().toString(36).substring(2, 9), url: newUrl, title, image }
        ]
      });
      setNewUrl("");
    }
  };

  const updateProduct = (id: string, key: string, value: string) => {
    onUpdate({
      ...config,
      products: products.map(p => p.id === id ? { ...p, [key]: value } : p)
    });
  };

  const removeProduct = (id: string) => {
    onUpdate({
      ...config,
      products: products.filter(p => p.id !== id)
    });
  };

  const LAYOUTS = [
    { id: "large_card", label: "Large card" },
    { id: "grid", label: "Grid" },
    { id: "carousel", label: "Carousel" },
    { id: "alternating", label: "Alternating" },
    { id: "text_left", label: "Text left" },
    { id: "text_right", label: "Text right" },
    { id: "story", label: "Story" },
  ];

  return (
    <div className="space-y-4">
      {/* Layout Selection */}
      <div className="space-y-2">
        <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Layout del bloque</span>
        <div className="flex flex-wrap gap-2">
          {LAYOUTS.map(l => (
            <button
              key={l.id}
              onClick={() => onUpdate({ ...config, layout: l.id })}
              className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium border transition-all ${
                layout === l.id
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-3">
        <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Productos afiliados</span>
        
        {products.length === 0 && (
          <p className="text-sm text-[var(--text-muted)] italic">No has agregado productos. Pega un enlace abajo.</p>
        )}

        <div className="space-y-2">
          {products.map(product => (
            <div key={product.id} className="p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] space-y-2 relative group">
              <button
                onClick={() => removeProduct(product.id)}
                className="absolute top-2 right-2 text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="flex items-start gap-3 pr-6">
                {product.image ? (
                  <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-800 border border-[var(--border)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.image} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 border border-[var(--border)]">
                    <Link2 className="w-5 h-5 text-neutral-400" />
                  </div>
                )}
                
                <div className="flex-1 space-y-2 min-w-0">
                  <input
                    value={product.title}
                    onChange={(e) => updateProduct(product.id, "title", e.target.value)}
                    placeholder="Título del producto"
                    className="w-full bg-transparent font-medium text-sm text-[var(--text-primary)] focus:outline-none focus:border-b focus:border-[var(--accent)] truncate"
                  />
                  <input
                    value={product.url}
                    onChange={(e) => updateProduct(product.id, "url", e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-transparent text-xs text-[var(--text-muted)] focus:outline-none focus:border-b focus:border-[var(--accent)] truncate"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Product Form */}
        <div className="flex gap-2 pt-2">
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Pegar enlace de afiliado..."
            className="flex-1 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
            onKeyDown={(e) => e.key === "Enter" && handleAddProduct()}
          />
          <button
            onClick={handleAddProduct}
            disabled={!newUrl || isFetching}
            className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-white text-sm hover:bg-[var(--accent-light)] disabled:opacity-50 min-w-[80px] flex items-center justify-center"
          >
            {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Añadir"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Geo Custom Block Editor ──────────────────────────────────────────────────
const COUNTRIES = [
  { code: "AR", name: "Argentina" },
  { code: "BO", name: "Bolivia" },
  { code: "BR", name: "Brasil" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "CR", name: "Costa Rica" },
  { code: "DO", name: "República Dominicana" },
  { code: "EC", name: "Ecuador" },
  { code: "SV", name: "El Salvador" },
  { code: "ES", name: "España" },
  { code: "US", name: "Estados Unidos" },
  { code: "GT", name: "Guatemala" },
  { code: "HN", name: "Honduras" },
  { code: "MX", name: "México" },
  { code: "NI", name: "Nicaragua" },
  { code: "PA", name: "Panamá" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Perú" },
  { code: "UY", name: "Uruguay" },
  { code: "VE", name: "Venezuela" },
];

export function GeoCustomBlockEditor({ block, onUpdate }: { block: Block; onUpdate: (config: Record<string, unknown>) => void }) {
  const config = block.config as { defaultMessage?: string; rules?: { id: string; countryCode: string; message: string }[] };
  const defaultMessage = config.defaultMessage || "";
  const rules = config.rules || [];

  const handleUpdate = (updates: Partial<typeof config>) => {
    onUpdate({ ...config, ...updates });
  };

  const addRule = () => {
    const newRule = { id: Math.random().toString(36).substring(7), countryCode: "AR", message: "" };
    handleUpdate({ rules: [...rules, newRule] });
  };

  const updateRule = (id: string, field: "countryCode" | "message", value: string) => {
    handleUpdate({
      rules: rules.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    });
  };

  const removeRule = (id: string) => {
    handleUpdate({ rules: rules.filter((r) => r.id !== id) });
  };

  return (
    <div className="space-y-6">
      {/* Default Message */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
            Mensaje Global (por defecto)
          </label>
          <textarea
            value={defaultMessage}
            onChange={(e) => handleUpdate({ defaultMessage: e.target.value })}
            placeholder="Mensaje que verán de países sin regla específica..."
            rows={2}
            className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] resize-vertical font-sans"
          />
        </div>
      </div>

      <div className="border-t border-[var(--border)] pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Reglas Específicas por País
          </label>
          <button
            onClick={addRule}
            className="text-xs font-medium px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Añadir Regla
          </button>
        </div>

        {rules.length === 0 && (
          <p className="text-xs text-[var(--text-muted)] text-center py-4 border border-dashed border-[var(--border)] rounded-[var(--radius-md)]">
            Aún no has creado reglas por país.
          </p>
        )}

        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <select
                  value={rule.countryCode}
                  onChange={(e) => updateRule(rule.id, "countryCode", e.target.value)}
                  className="w-48 px-2 py-1.5 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] shrink-0"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="flex-1" />
                <button
                  onClick={() => removeRule(rule.id)}
                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-[var(--radius-md)] transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <textarea
                value={rule.message}
                onChange={(e) => updateRule(rule.id, "message", e.target.value)}
                placeholder="Escribe el mensaje para este país..."
                rows={2}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] resize-vertical font-sans"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AI Greeting Block Editor ────────────────────────────────────────────────
export function AIGreetingEditor({ block, onUpdate }: { block: Block; onUpdate: (config: Record<string, unknown>) => void }) {
  const config = block.config as Record<string, unknown>;

  const showCity = config.showCity !== false;
  const showReferrer = config.showReferrer !== false;
  const showWeather = config.showWeather !== false;
  const showReturning = config.showReturning !== false;

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-muted)] mb-2">
        Configura qué datos del visitante se muestran en el saludo personalizado.
      </p>

      <Toggle
        label="🏙️ Ciudad"
        description="Muestra la ciudad del visitante"
        checked={showCity}
        onChange={(v) => onUpdate({ ...config, showCity: v })}
      />

      <Toggle
        label="📱 Fuente de tráfico"
        description="Muestra de dónde viene (Instagram, Google, etc.)"
        checked={showReferrer}
        onChange={(v) => onUpdate({ ...config, showReferrer: v })}
      />

      <Toggle
        label="🌤️ Clima"
        description="Comenta el clima real de la ciudad del visitante"
        checked={showWeather}
        onChange={(v) => onUpdate({ ...config, showWeather: v })}
      />

      <Toggle
        label="👋 Visitante recurrente"
        description="Mensaje especial si la persona ya visitó antes"
        checked={showReturning}
        onChange={(v) => onUpdate({ ...config, showReturning: v })}
      />

      <div className="mt-3 p-3 bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-[var(--radius-md)]">
        <p className="text-xs text-[var(--accent)] font-medium mb-1">Vista previa del saludo:</p>
        <p className="text-xs text-[var(--text-muted)] italic">
          &quot;{showCity ? "Buenas tardes desde Buenos Aires 🇦🇷" : "Buenas tardes"}
          {showReferrer ? " — Llegaste desde Instagram" : ""}
          {showWeather ? ". Hermoso día soleado por allá ☀️" : ""}
          {showReturning ? " ¡Qué bueno verte de nuevo! 👋" : ""}&quot;
        </p>
      </div>
    </div>
  );
}

// ─── Cal.com Block ──────────────────────────────────────────────────────────
export function CalComBlockEditor({ block, onUpdate }: { block: Block; onUpdate: (config: Record<string, unknown>) => void }) {
  const config = ((block.config as any)?.calData as Record<string, any>) || {};
  const [snippet, setSnippet] = useState("");

  const handleParseSnippet = (val: string) => {
    setSnippet(val);
    if (!val) return;

    try {
      // 1. Extraer namespace (ej: namespace="15min")
      const namespaceMatch = val.match(/namespace="([^"]+)"/);
      // 2. Extraer calLink (ej: calLink="adrianortiz/15min")
      const calLinkMatch = val.match(/calLink="([^"]+)"/);
      // 3. Extraer config object (ej: config={{"layout":"month_view"}})
      // Usamos un regex con match recursivo simple confiando en el snippet estándar de cal.com
      const configStrMatch = val.match(/config=\{\{([^}]+)\}\}/);
      
      let parsedConfig = {};
      if (configStrMatch && configStrMatch[1]) {
        try {
          parsedConfig = JSON.parse(`{${configStrMatch[1]}}`);
        } catch(e) {
          console.error("No se pudo parsear el objeto config", e);
        }
      }

      onUpdate({
        calData: {
          ...config,
          namespace: namespaceMatch ? namespaceMatch[1] : undefined,
          calLink: calLinkMatch ? calLinkMatch[1] : "",
          config: parsedConfig
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Pegar Snippet */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Código Embed de Cal.com
        </label>
        <p className="text-xs text-[var(--text-muted)] mb-2">
          Copia el código React que te da Cal.com en "Embed" y pégalo abajo. 
        </p>
        <textarea
          value={snippet}
          onChange={(e) => handleParseSnippet(e.target.value)}
          placeholder={'<Cal namespace="15min" calLink="..." />'}
          className="w-full px-3 py-2 text-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--accent)] h-32 font-mono"
        />
      </div>

      {config.calLink && (
        <div className="p-3 bg-[var(--accent)]/10 text-[var(--text-primary)] text-sm rounded-[var(--radius-md)] mt-2">
          Configuración extraída correctamente:<br/>
          <strong className="text-[var(--accent)]">Link:</strong> {config.calLink} <br/>
          {config.namespace && <><strong className="text-[var(--accent)]">Namespace:</strong> {config.namespace} <br/></>}
        </div>
      )}

      {/* Título de la Sección */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Título de la Sección (Opcional)
        </label>
        <input
          type="text"
          value={config.title || ""}
          onChange={(e) => onUpdate({ calData: { ...config, title: e.target.value } })}
          placeholder="Reserva tu cita"
          className="w-full px-3 py-2 text-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      {/* Subtítulo de la Sección */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Subtítulo de la Agrupación (Opcional)
        </label>
        <input
          type="text"
          value={config.subtitle || ""}
          onChange={(e) => onUpdate({ calData: { ...config, subtitle: e.target.value } })}
          placeholder="Reúnete conmigo"
          className="w-full px-3 py-2 text-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      {/* Avatar URL */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Foto de Perfil (Opcional)
        </label>
        <input
          type="text"
          value={config.avatarUrl || ""}
          onChange={(e) => onUpdate({ calData: { ...config, avatarUrl: e.target.value } })}
          placeholder="https://cal.com/api/avatar/..."
          className="w-full px-3 py-2 text-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      {/* Ocultar detalles */}
      <Toggle
        label="Ocultar detalles del evento"
        description="Si activas esto, no se mostrarán los detalles largos del evento de Cal.com"
        checked={!!config.hideDetails}
        onChange={(v) => onUpdate({ calData: { ...config, hideDetails: v } })}
      />
    </div>
  );
}

"use client";

interface DividerBlockProps {
  style?: "line" | "space" | "dots";
  height?: number;
}

export function DividerBlock({ style = "line", height = 32 }: DividerBlockProps) {
  if (style === "space") {
    return <div style={{ height: `${height}px` }} />;
  }

  if (style === "dots") {
    return (
      <div className="flex items-center justify-center gap-2 w-full" style={{ height: `${height}px` }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] opacity-40" />
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] opacity-40" />
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] opacity-40" />
      </div>
    );
  }

  // Default: line
  return (
    <div className="flex items-center w-full" style={{ height: `${height}px` }}>
      <hr className="w-full border-t border-[var(--border)]" />
    </div>
  );
}

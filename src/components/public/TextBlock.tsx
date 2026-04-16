"use client";

import { motion } from "framer-motion";

interface TextBlockProps {
  content: string;
  title?: string;
  alignment?: "left" | "center" | "right";
  transparentBackground?: boolean;
}

// Rudimentary markdown parser for basic formatting
function parseMarkdown(text: string) {
  if (!text) return null;
  
  const lines = text.split('\n');
  
  return lines.map((line, i) => {
    // Empty line to break
    if (line.trim() === '') return <br key={i} />;
    
    // Headers (h1, h2, h3)
    const h1Match = line.match(/^# (.*)$/);
    if (h1Match) return <h1 key={i} className="text-2xl font-bold mb-2 mt-4">{parseFormatting(h1Match[1])}</h1>;
    
    const h2Match = line.match(/^## (.*)$/);
    if (h2Match) return <h2 key={i} className="text-xl font-bold mb-2 mt-3">{parseFormatting(h2Match[1])}</h2>;
    
    const h3Match = line.match(/^### (.*)$/);
    if (h3Match) return <h3 key={i} className="text-lg font-bold mb-2 mt-2">{parseFormatting(h3Match[1])}</h3>;
    
    // Regular paragraph
    return <p key={i} className="mb-2 last:mb-0 min-h-[1.5rem]">{parseFormatting(line)}</p>;
  });
}

// Parses bold and italic within a line
function parseFormatting(line: string) {
  const parts = [];
  let remaining = line;
  let keyIdx = 0;
  
  while (remaining) {
    // Very basic bold **text**
    const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*(.*)/);
    if (boldMatch) {
      if (boldMatch[1]) parts.push(<span key={keyIdx++}>{boldMatch[1]}</span>);
      parts.push(<strong key={keyIdx++}>{boldMatch[2]}</strong>);
      remaining = boldMatch[3];
      continue;
    }
    
    // Very basic italic *text* or _text_
    const italicMatch = remaining.match(/^(.*?)(?:\*|_)(.*?)(?:\*|_)(.*)/);
    if (italicMatch) {
      if (italicMatch[1]) parts.push(<span key={keyIdx++}>{italicMatch[1]}</span>);
      parts.push(<em key={keyIdx++}>{italicMatch[2]}</em>);
      remaining = italicMatch[3];
      continue;
    }
    
    parts.push(<span key={keyIdx++}>{remaining}</span>);
    break;
  }
  
  return parts;
}

export function TextBlock({ content, title, alignment = "left", transparentBackground = false }: TextBlockProps) {
  if (!content && !title) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full ${transparentBackground ? 'p-2' : 'glass rounded-[var(--radius-lg)] p-5'}`}
      style={{ textAlign: alignment }}
    >
      {title && (
        <h3 className="text-lg font-bold mb-3">{title}</h3>
      )}
      <div className="text-sm text-[var(--text-primary)] leading-relaxed">
        {parseMarkdown(content)}
      </div>
    </motion.div>
  );
}

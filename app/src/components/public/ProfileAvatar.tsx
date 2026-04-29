"use client";

import Image from "next/image";
import { useState } from "react";

interface ProfileAvatarProps {
  src: string | null;
  name: string;
  size?: number;
}

/**
 * Generates a base64 SVG with the user's initials as a fallback avatar.
 */
function generateInitialsAvatar(name: string): string {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#06b6d4"/>
          <stop offset="100%" style="stop-color:#0ea5e9"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="50" fill="url(#bg)"/>
      <text x="50" y="50" font-family="system-ui,sans-serif" font-size="36" font-weight="600" 
            fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function ProfileAvatar({ src, name, size = 96 }: ProfileAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const fallback = generateInitialsAvatar(name);
  const imageSrc = imgError || !src ? fallback : src;

  return (
    <div className="avatar-ring inline-block" style={{ width: size + 6, height: size + 6 }}>
      <Image
        unoptimized
        src={imageSrc}
        alt={`Foto de perfil de ${name}`}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        priority
        onError={() => setImgError(true)}
      />
    </div>
  );
}

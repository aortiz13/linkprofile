"use client";

import { useState, useEffect } from "react";
import { TextBlock } from "./TextBlock";

interface GeoCustomBlockProps {
  config: Record<string, unknown> & {
    defaultMessage?: string;
    rules?: { id: string; countryCode: string; message: string }[];
  };
}

export function GeoCustomBlock({ config }: GeoCustomBlockProps) {
  const [country, setCountry] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let active = true;
    const cached = sessionStorage.getItem("geo_country");
    if (cached) {
      setCountry(cached);
    } else {
      fetch("/api/public/geo")
        .then((r) => r.json())
        .then((data) => {
          if (active && data.country) {
            setCountry(data.country);
            sessionStorage.setItem("geo_country", data.country);
          }
        })
        .catch(console.error);
    }
    return () => {
      active = false;
    };
  }, []);

  // Avoid hydration mismatch by waiting for mount
  if (!mounted) return null;

  const currentMessage =
    config.rules?.find((r) => r.countryCode === country)?.message ||
    config.defaultMessage;

  if (!currentMessage) return null;

  return (
    <TextBlock 
      content={currentMessage} 
      alignment="center"
      transparentBackground={false} 
    />
  );
}

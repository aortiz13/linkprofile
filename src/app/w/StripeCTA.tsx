"use client";

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

const DEFAULT_HREF = "https://buy.stripe.com/28EeVccJUfBo3MU4EN1Fe38";
const COOKIE_NAME = "lp_funnel_attr";

function getSessionIdFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  try {
    // base64url → base64
    const b64 = match[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(b64);
    const parsed = JSON.parse(json) as { sessionId?: string };
    return parsed.sessionId ?? null;
  } catch {
    return null;
  }
}

function appendClientRef(url: string, sessionId: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}client_reference_id=${encodeURIComponent(sessionId)}`;
}

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> {
  href?: string;
  children: ReactNode;
}

/**
 * Anchor wrapping the Stripe Payment Link. Intercepts click to inject
 * `client_reference_id` from the funnel attribution cookie at click time —
 * lets the Stripe webhook tie the sale back to the right funnel/variant
 * without forcing a hydration-time effect.
 */
export default function StripeCTA({ href = DEFAULT_HREF, children, ...rest }: Props) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Let modifier-clicks (cmd+click, ctrl+click, middle-click) keep default behavior
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

    const sid = getSessionIdFromCookie();
    if (!sid) return; // No attribution available — fall back to default href

    e.preventDefault();
    window.location.href = appendClientRef(href, sid);
  };

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

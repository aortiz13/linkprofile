/**
 * Deep link URI schemes for mobile apps.
 * Each function takes a handle/username and returns the app-specific URI.
 */
export const platformDeepLinks: Record<string, (handle: string) => string> = {
  instagram: (h) => `instagram://user?username=${h}`,
  tiktok: (h) => `snssdk1233://user/profile/${h}`,
  twitter: (h) => `twitter://user?screen_name=${h}`,
  youtube: (h) => `youtube://www.youtube.com/@${h}`,
};

/**
 * Attempts to open a native app via deep link on mobile.
 * Falls back to the web URL if the app isn't installed.
 */
export function openWithDeepLink(
  platform: string,
  handle: string,
  fallbackUrl: string
): void {
  const deepLinkFn = platformDeepLinks[platform];

  // If no deep link available or not on a device that supports it, just open the URL
  if (!deepLinkFn || typeof window === "undefined") {
    window?.open(fallbackUrl, "_blank");
    return;
  }

  // Check if mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (!isMobile) {
    window.open(fallbackUrl, "_blank");
    return;
  }

  const deepLink = deepLinkFn(handle);
  const start = Date.now();

  // Try to open the app
  window.location.href = deepLink;

  // If still here after 1.5s, app wasn't installed — open web fallback
  setTimeout(() => {
    if (Date.now() - start < 2000) {
      window.open(fallbackUrl, "_blank");
    }
  }, 1500);
}

/**
 * Returns the web fallback URL for a platform + handle
 */
export function getFallbackUrl(platform: string, handle: string): string {
  const urls: Record<string, (h: string) => string> = {
    instagram: (h) => `https://instagram.com/${h}`,
    tiktok: (h) => `https://tiktok.com/@${h}`,
    twitter: (h) => `https://x.com/${h}`,
    youtube: (h) => `https://youtube.com/@${h}`,
    whatsapp: (h) => `https://wa.me/${h.replace(/[^0-9]/g, "")}`,
  };

  return urls[platform]?.(handle) || "#";
}

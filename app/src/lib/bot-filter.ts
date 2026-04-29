const BOT_PATTERNS =
  /googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|slackbot|linkedinbot|discordbot|telegrambot|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider/i;

/**
 * Returns true if the user-agent string belongs to a known bot/crawler.
 */
export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true; // No UA = suspicious, treat as bot
  return BOT_PATTERNS.test(userAgent);
}

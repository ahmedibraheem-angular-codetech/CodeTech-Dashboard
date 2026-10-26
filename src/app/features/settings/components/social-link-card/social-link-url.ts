/** Result of a copy-to-clipboard attempt from SocialLinkCard. */
export type SocialLinkCopyResult =
  | { ok: true }
  | { ok: false; reason: 'empty' | 'unsupported' | 'denied' };

/**
 * Returns a safe http(s) URL for window.open, or null when the value is empty,
 * malformed, or uses an unsupported protocol.
 */
export function toSafeHttpUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  // Reject explicit non-http(s) schemes before prefixing (javascript:, data:, …).
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    if (!parsed.hostname) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

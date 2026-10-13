/** A short human size: `313 KB`, `1.5 MB`. The units stay in Latin letters in every language. */
export function formatFileSize(bytes: number): string {
  const mb = 1024 * 1024;
  if (bytes < mb) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / mb).toFixed(1)} MB`;
}


export function formatFileSize(bytes: number): string {
  const mb = 1024 * 1024;
  if (bytes < mb) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / mb).toFixed(1)} MB`;
}

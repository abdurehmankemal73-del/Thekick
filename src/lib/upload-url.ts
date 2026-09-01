export function isStoredUploadUrl(url: string) {
  if (!url || url.includes("..") || url.includes("\\")) return false;
  return /^\/(uploads|api\/media)\/news\/[A-Za-z0-9._-]+$/.test(url);
}

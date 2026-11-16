export function canDownloadExport(status: string | undefined, manager: boolean, enabled: boolean) {
  return enabled && (manager || status === "approved");
}
export function canReviewExport(manager: boolean, current: string, next: string) {
  return manager && ((current === "pending" && ["approved", "rejected"].includes(next)) || (current === "approved" && next === "revoked"));
}
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
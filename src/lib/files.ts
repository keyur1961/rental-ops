export function fileUrl(relativePath: string): string {
  return `/api/files/${relativePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

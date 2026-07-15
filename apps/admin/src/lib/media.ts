const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${normalized}`;
}

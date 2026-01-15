export const getApiBase = (): string => {
  try {
    const base = (import.meta as any)?.env?.VITE_API_URL || '';
    return typeof base === 'string' ? base : '';
  } catch {
    return '';
  }
};

export const apiFetch = (path: string, init?: RequestInit) => {
  const rawBase = getApiBase();
  const base = (typeof rawBase === 'string' ? rawBase.trim() : '');
  if (!base) return fetch(path, init);

  // Normalize base and path to avoid duplicate segments like /api/api/*
  const normalizedBase = base.replace(/\/+$/, ''); // remove trailing slashes
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // If base already ends with /api and path starts with /api, avoid duplication
  const endsWithApi = /\/api$/i.test(normalizedBase);
  const startsWithApi = /^\/api(\/|$)/i.test(normalizedPath);
  const joined = endsWithApi && startsWithApi
    ? normalizedBase + normalizedPath.replace(/^\/api/, '')
    : normalizedBase + normalizedPath;

  return fetch(joined, init);
};
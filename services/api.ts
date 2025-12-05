export const getApiBase = (): string => {
  try {
    const base = (import.meta as any)?.env?.VITE_API_URL || '';
    return typeof base === 'string' ? base : '';
  } catch {
    return '';
  }
};

export const apiFetch = (path: string, init?: RequestInit) => {
  const base = getApiBase();
  const url = base ? `${base}${path}` : path;
  return fetch(url, init);
};
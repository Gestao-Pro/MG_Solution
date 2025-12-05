export type PriceInfo = {
  id: string;
  amount: number; // cents
  currency: string;
  nickname?: string;
  productName?: string;
  interval?: 'month' | 'year' | string;
};

export type PricingResponse = {
  starter: PriceInfo | null;
  pro: PriceInfo | null;
  premium?: PriceInfo | null;
  starter_yearly?: PriceInfo | null;
  pro_yearly?: PriceInfo | null;
  premium_yearly?: PriceInfo | null;
};

export const getPricingInfo = async (signal?: AbortSignal): Promise<PricingResponse> => {
  const CACHE_KEY = 'pricingInfoV2';
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  try {
    const cachedRaw = sessionStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw) as { ts: number; data: PricingResponse };
      if (cached && typeof cached.ts === 'number' && (Date.now() - cached.ts) < CACHE_TTL_MS) {
        return cached.data;
      }
    }
    // Remove legacy cache to avoid stale data
    sessionStorage.removeItem('pricingInfo');
  } catch {}
  const resp = await apiFetch('/api/pricing', { signal });
  if (!resp.ok) throw new Error('Falha ao obter pricing do servidor.');
  const data = await resp.json() as PricingResponse;
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch {}
  return data;
};

export const formatAmount = (amount?: number, currency?: string, interval: 'month'|'year' = 'month'): string => {
  if (!amount) return 'Preço indisponível';
  const suffix = interval === 'year' ? '/ano' : '/mês';
  try {
    const value = amount / 100;
    const curr = (currency || 'BRL').toUpperCase();
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: curr }).format(value) + suffix;
  } catch {
    return `${(amount/100).toFixed(2)} ${(currency || 'BRL').toUpperCase()}${suffix}`;
  }
};
import { apiFetch } from './api';
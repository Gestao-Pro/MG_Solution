export const getEnv = (key: string, fallback = ''): string => {
  const v = (import.meta as any)?.env?.[key];
  return typeof v === 'string' && v.length > 0 ? v : fallback;
};

export const createCheckoutSession = async (priceId?: string): Promise<string> => {
  const chosenPrice = priceId || getEnv('VITE_STRIPE_PRICE_STARTER', '');
  if (!chosenPrice) throw new Error('Stripe priceId não configurado. Defina VITE_STRIPE_PRICE_STARTER.');
  const token = localStorage.getItem('authToken');
  const resp = await apiFetch('/api/checkout/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ priceId: chosenPrice })
  });
  if (!resp.ok) throw new Error('Falha ao criar sessão de checkout.');
  const data = await resp.json();
  if (!data.url) throw new Error('Resposta inválida do servidor de checkout.');
  return data.url as string;
};

export const getCheckoutSessionInfo = async (sessionId: string): Promise<any> => {
  const token = localStorage.getItem('authToken');
  const resp = await apiFetch(`/api/checkout/session/${encodeURIComponent(sessionId)}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  if (!resp.ok) throw new Error('Falha ao obter sessão de checkout.');
  return await resp.json();
};

export const openBillingPortal = async (sessionId?: string): Promise<string> => {
  const sid = sessionId || localStorage.getItem('lastStripeSessionId') || '';
  if (!sid) throw new Error('SessionId não encontrado para portal de faturamento.');
  const token = localStorage.getItem('authToken');
  const resp = await apiFetch('/api/billing/portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ sessionId: sid })
  });
  if (!resp.ok) throw new Error('Falha ao criar sessão do portal de faturamento.');
  const data = await resp.json();
  if (!data.url) throw new Error('Resposta inválida do servidor do portal de faturamento.');
  return data.url as string;
};
import { apiFetch } from './api';
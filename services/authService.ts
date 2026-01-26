import { trackEvent } from './analyticsService';
import { apiFetch } from './api';

export const getAuthToken = (): string | null => {
  try { return localStorage.getItem('authToken'); } catch { return null; }
};

export const saveAuthToken = (token: string) => {
  try { localStorage.setItem('authToken', token); } catch {}
};

export const clearAuthToken = () => {
  try { localStorage.removeItem('authToken'); } catch {}
};

export const loginWithEmail = async (email: string, password?: string): Promise<string> => {
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: password || '' })
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.error || 'Falha ao autenticar');
  }
  const data = await res.json();
  if (!data?.token) throw new Error('Token ausente na resposta');
  saveAuthToken(data.token);
  try {
    if (data?.isAdmin === true) {
      localStorage.setItem('userPlan', 'premium');
      localStorage.setItem('userBillingCycle', 'yearly');
      try { window.dispatchEvent(new CustomEvent('gp:plan-updated')); } catch {}
    }
  } catch {}
  try { trackEvent('login_success', { method: 'email' }); } catch {}
  return data.token;
};

export const registerWithEmail = async (email: string, password?: string): Promise<string> => {
  const res = await apiFetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: password || '' })
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.error || 'Falha ao registrar');
  }
  const data = await res.json();
  if (!data?.token) throw new Error('Token ausente na resposta');
  saveAuthToken(data.token);
  try {
    if (data?.isAdmin === true) {
      localStorage.setItem('userPlan', 'premium');
      localStorage.setItem('userBillingCycle', 'yearly');
      try { window.dispatchEvent(new CustomEvent('gp:plan-updated')); } catch {}
    }
  } catch {}
  // Plano/ciclo apenas por Stripe ou quando isAdmin for true no Google login
  try { trackEvent('register_success', { method: 'email' }); } catch {}
  return data.token;
};

export const loginWithGoogle = async (idToken: string): Promise<string> => {
  const res = await apiFetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.error || 'Falha ao autenticar com Google');
  }
  const data = await res.json();
  if (!data?.token) throw new Error('Token ausente na resposta');
  saveAuthToken(data.token);
  try { trackEvent('login_success', { method: 'google' }); } catch {}
  try {
    const email = (data?.user?.email as string) || '';
    if (email) localStorage.setItem('userEmail', email);
  } catch {}
  try {
    if (data?.isAdmin === true) {
      localStorage.setItem('userPlan', 'premium');
      localStorage.setItem('userBillingCycle', 'yearly');
      try { window.dispatchEvent(new CustomEvent('gp:plan-updated')); } catch {}
    }
  } catch {}
  return data.token;
};

const safeJson = async (res: Response) => {
  try { return await res.json(); } catch { return null; }
};

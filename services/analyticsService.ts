// analyticsService.ts
// Integração simples com endpoint local para eventos de analytics.

export const trackEvent = async (eventName: string, eventProperties?: Record<string, any>) => {
  try {
    // Log local para debug
    console.log(`Event tracked: ${eventName}`, eventProperties);
    // Envia para backend (proxy /api -> :4000)
    const token = localStorage.getItem('authToken');
    await apiFetch('/api/analytics/event', {
      method: 'POST',
      // Evita aborts em navegações rápidas/fechamento de aba
      keepalive: true,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ name: eventName, payload: eventProperties || {} })
    });
  } catch (err) {
    // Silencioso em produção; mantém log em dev
    console.warn('Falha ao enviar evento de analytics', err);
  }
};

export const identifyUser = (userId: string, userProperties?: Record<string, any>) => {
  console.log(`User identified: ${userId}`, userProperties);
  // Exemplo de integração com Mixpanel/GA — manter apenas log por enquanto
};

export const getOrCreateAnonId = (): string => {
  try {
    const existing = localStorage.getItem('anonId');
    if (existing) return existing;
    const generated = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? (crypto as any).randomUUID()
      : `anon_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    localStorage.setItem('anonId', generated);
    return generated;
  } catch {
    return `anon_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  }
};
import { apiFetch } from './api';
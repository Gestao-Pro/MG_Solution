import { getEnv } from '@/services/billingService';

type Resource = 'chat' | 'tts' | 'superboss';

const getUserPlan = (): 'free'|'starter'|'pro'|'premium' => {
  try {
    const p = (localStorage.getItem('userPlan') || 'free').toLowerCase();
    return (p === 'starter' || p === 'pro' || p === 'premium') ? p as any : 'free';
  } catch { return 'free'; }
};

const getLimit = (res: Resource): number => {
  const plan = getUserPlan();
  if (res === 'chat') {
    if (plan === 'starter') return Number(getEnv('VITE_CHAT_DAILY_LIMIT_STARTER', '200'));
    if (plan === 'pro') return Number(getEnv('VITE_CHAT_DAILY_LIMIT_PRO', '500'));
    if (plan === 'premium') return Number(getEnv('VITE_CHAT_DAILY_LIMIT_PREMIUM', '1000'));
    return Number(getEnv('VITE_CHAT_DAILY_LIMIT_FREE', getEnv('VITE_CHAT_DAILY_LIMIT', '50')));
  } else {
    if (plan === 'starter') return Number(getEnv('VITE_TTS_DAILY_LIMIT_STARTER', '200'));
    if (plan === 'pro') return Number(getEnv('VITE_TTS_DAILY_LIMIT_PRO', '500'));
    if (plan === 'premium') return Number(getEnv('VITE_TTS_DAILY_LIMIT_PREMIUM', '1000'));
    return Number(getEnv('VITE_TTS_DAILY_LIMIT_FREE', getEnv('VITE_TTS_DAILY_LIMIT', '50')));
  }
};

const makeKey = (resource: Resource): string => {
  const d = new Date();
  const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return `usage:${resource}:${dateStr}`;
};

export const getDailyUsage = (resource: Resource): number => {
  try {
    const raw = localStorage.getItem(makeKey(resource));
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch { return 0; }
};

export const getDailyLimitFor = (resource: Resource): number => getLimit(resource);

// ===== SuperBoss usage (mensal) =====
const makeMonthlyBossKey = (): string => {
  const d = new Date();
  const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  return `usage:superboss:${ym}`;
};

export const getMonthlySuperBossCount = (): number => {
  try {
    const raw = localStorage.getItem(makeMonthlyBossKey());
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch { return 0; }
};

export const incrementMonthlySuperBossCount = (): void => {
  try {
    const curr = getMonthlySuperBossCount();
    localStorage.setItem(makeMonthlyBossKey(), String(curr + 1));
  } catch {}
};

export const getMonthlySuperBossLimit = (plan: 'free'|'starter'|'pro'|'premium', cycle: 'monthly'|'yearly'): number => {
  if (plan === 'premium') return Number.POSITIVE_INFINITY; // ilimitado
  if (plan === 'pro' && cycle === 'yearly') return 10;
  return 0; // sem acesso nos demais
};

export const canUseSuperBoss = (plan: 'free'|'starter'|'pro'|'premium', cycle: 'monthly'|'yearly'): boolean => {
  const limit = getMonthlySuperBossLimit(plan, cycle);
  if (!Number.isFinite(limit)) return true;
  const used = getMonthlySuperBossCount();
  return used < limit;
};
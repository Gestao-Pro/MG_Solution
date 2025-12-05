import { AGENTS, AGENT_AREAS } from '@/constants';
import { Plan, BillingCycle } from '@/contexts/PlanContext';

// Contagem base de agentes incluídos por plano (sem bônus) para mensal e anual.
// No anual, os bônus serão adicionados via seleção do usuário.
export const INCLUDED_AGENT_COUNTS: Record<Plan, { monthly: number; yearly: number }> = {
  free: { monthly: 6, yearly: 6 }, // 1 por área
  starter: { monthly: 5, yearly: 5 },
  pro: { monthly: 19, yearly: 19 },
  premium: { monthly: 30, yearly: 30 },
};

// Capacidade de bônus (em "unidades de slot") por plano/ciclo.
// Starter anual: +2 slots; Pro anual: +3 slots; Premium: sem bônus (já inclui todos).
export const BONUS_CAPACITY: Record<Plan, { monthly: number; yearly: number }> = {
  free: { monthly: 0, yearly: 0 },
  starter: { monthly: 0, yearly: 2 },
  pro: { monthly: 0, yearly: 3 },
  premium: { monthly: 0, yearly: 0 },
};

// Agentes que manipulam documentos/dados/imagens são considerados "pesados" (consomem 2 slots).
const isHeavyAgent = (agentId: string): boolean => {
  const ag = AGENTS.find(a => a.id === agentId);
  if (!ag) return false;
  return Boolean(ag.canHandleDocuments || ag.canHandleDataFiles || ag.canHandleImages);
};

// Persistência simples de seleção de bônus no localStorage
const makeBonusKey = (plan: Plan, cycle: BillingCycle) => `bonusSelections:${plan}:${cycle}`;

export const getBonusSelectionsForPlanAndCycle = (plan: Plan, cycle: BillingCycle): string[] => {
  try {
    const raw = localStorage.getItem(makeBonusKey(plan, cycle));
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) return arr.filter(id => typeof id === 'string');
    return [];
  } catch { return []; }
};

export const setBonusSelectionsForPlanAndCycle = (plan: Plan, cycle: BillingCycle, agentIds: string[]) => {
  try {
    const unique = Array.from(new Set(agentIds));
    localStorage.setItem(makeBonusKey(plan, cycle), JSON.stringify(unique));
  } catch {}
};

// Seleciona agentes de forma balanceada entre áreas (round-robin) até atingir o total permitido.
export const getBaseEnabledAgentIdsForPlanAndCycle = (plan: Plan, cycle: BillingCycle): string[] => {
  const target = INCLUDED_AGENT_COUNTS[plan]?.[cycle] ?? INCLUDED_AGENT_COUNTS.free.monthly;
  const result: string[] = [];
  const areaQueues = AGENT_AREAS.map(area => AGENTS.filter(a => a.area === area).map(a => a.id));
  let added = 0;
  let areaIndex = 0;
  // round-robin pelos arrays de áreas
  while (added < target) {
    const queue = areaQueues[areaIndex % areaQueues.length];
    const nextId = queue.shift();
    if (nextId) {
      result.push(nextId);
      added++;
    }
    areaIndex++;
    if (areaQueues.every(q => q.length === 0)) break;
  }
  return result;
};

// Lista global de agentes habilitados considerando seleção de bônus.
export const getEnabledAgentIdsForPlanAndCycle = (plan: Plan, cycle: BillingCycle): string[] => {
  const base = getBaseEnabledAgentIdsForPlanAndCycle(plan, cycle);
  const capacity = BONUS_CAPACITY[plan]?.[cycle] ?? 0;
  if (!capacity) return base;
  const selected = getBonusSelectionsForPlanAndCycle(plan, cycle)
    .filter(id => !base.includes(id))
    .filter(id => AGENTS.some(a => a.id === id));
  // Consome capacidade com peso 2 para agentes "pesados"
  let used = 0;
  const extras: string[] = [];
  for (const id of selected) {
    const cost = isHeavyAgent(id) ? 2 : 1;
    if (used + cost > capacity) break;
    extras.push(id);
    used += cost;
  }
  return [...base, ...extras];
};

// Legado: mantém função por área para compatibilidade, delegando à lista global e filtrando por área.
export const getEnabledAgentIdsForAreaAndPlanAndCycle = (area: string, plan: Plan, cycle: BillingCycle): string[] => {
  const global = new Set(getEnabledAgentIdsForPlanAndCycle(plan, cycle));
  return AGENTS.filter(a => a.area === area && global.has(a.id)).map(a => a.id);
};
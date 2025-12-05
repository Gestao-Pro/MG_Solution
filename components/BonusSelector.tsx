import React, { useEffect, useMemo, useState } from 'react';
import { AGENTS, AGENT_AREAS } from '@/constants';
import { Plan, BillingCycle } from '@/contexts/PlanContext';
import {
  BONUS_CAPACITY,
  getBaseEnabledAgentIdsForPlanAndCycle,
  getBonusSelectionsForPlanAndCycle,
  setBonusSelectionsForPlanAndCycle,
} from '@/services/planLimits';

type Props = {
  plan: Plan;
  cycle: BillingCycle;
};

// Peso 2 para agentes "pesados" (documentos/dados/imagens)
const isHeavy = (agentId: string): boolean => {
  const ag = AGENTS.find(a => a.id === agentId);
  if (!ag) return false;
  return Boolean(ag.canHandleDocuments || ag.canHandleDataFiles || ag.canHandleImages);
};

const BonusSelector: React.FC<Props> = ({ plan, cycle }) => {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setSelected(getBonusSelectionsForPlanAndCycle(plan, cycle));
  }, [plan, cycle]);

  const baseIds = useMemo(() => getBaseEnabledAgentIdsForPlanAndCycle(plan, cycle), [plan, cycle]);
  const capacity = BONUS_CAPACITY[plan]?.[cycle] ?? 0;
  const candidates = useMemo(() => AGENTS.filter(a => !baseIds.includes(a.id)), [baseIds]);

  const usedUnits = selected.reduce((acc, id) => acc + (isHeavy(id) ? 2 : 1), 0);
  const remaining = Math.max(0, capacity - usedUnits);

  const toggle = (id: string) => {
    const cost = isHeavy(id) ? 2 : 1;
    const isSelected = selected.includes(id);
    if (isSelected) {
      const next = selected.filter(x => x !== id);
      setSelected(next);
      setBonusSelectionsForPlanAndCycle(plan, cycle, next);
    } else {
      if (remaining < cost) return; // sem capacidade
      const next = [...selected, id];
      setSelected(next);
      setBonusSelectionsForPlanAndCycle(plan, cycle, next);
    }
  };

  if (capacity === 0) {
    return (
      <div className="rounded border border-slate-700 bg-slate-800 p-4 text-sm text-gray-300">
        Este plano/ciclo não possui bônus selecionáveis.
      </div>
    );
  }

  return (
    <div className="rounded border border-slate-700 bg-slate-800 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Selecione seus agentes bônus</h3>
        <span className="text-xs text-gray-400">Capacidade: {capacity} · Usados: {usedUnits} · Restantes: {remaining}</span>
      </div>
      <p className="text-xs text-gray-400 mt-1">Agentes avançados (documentos/dados/imagens) consomem 2 vagas.</p>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
        {AGENT_AREAS.map(area => {
          const list = candidates.filter(a => a.area === area);
          if (!list.length) return null;
          return (
            <div key={area} className="rounded border border-slate-700 p-3">
              <h4 className="text-sm text-white font-medium mb-2">{area}</h4>
              <ul className="space-y-2">
                {list.map(a => {
                  const heavy = isHeavy(a.id);
                  const checked = selected.includes(a.id);
                  const disabled = !checked && (remaining < (heavy ? 2 : 1));
                  return (
                    <li key={a.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggle(a.id)}
                      />
                      <span className="text-sm text-gray-200">{a.name}</span>
                      {heavy && <span className="text-[10px] text-gray-400">· pesado (2)</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BonusSelector;
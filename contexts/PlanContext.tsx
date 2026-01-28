import React, { createContext, useContext, useEffect, useState } from 'react';

export type Plan = 'free' | 'starter' | 'pro' | 'premium';
export type BillingCycle = 'monthly' | 'yearly';

type PlanContextValue = {
  plan: Plan;
  setPlan: (p: Plan) => void;
  cycle: BillingCycle;
  setCycle: (c: BillingCycle) => void;
};

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [plan, setPlanState] = useState<Plan>('free');
  const [cycle, setCycleState] = useState<BillingCycle>('monthly');

  useEffect(() => {
    try {
      const rawPlan = (localStorage.getItem('userPlan') || 'free').toLowerCase();
      const normalizedPlan: Plan = (rawPlan === 'starter' || rawPlan === 'pro' || rawPlan === 'premium') ? (rawPlan as Plan) : 'free';
      setPlanState(normalizedPlan);
      const rawCycle = (localStorage.getItem('userBillingCycle') || 'monthly').toLowerCase();
      const normalizedCycle: BillingCycle = rawCycle === 'yearly' ? 'yearly' : 'monthly';
      setCycleState(normalizedCycle);
    } catch {}
  }, []);

  useEffect(() => {
    const updateFromStorage = () => {
      try {
        const rawPlan = (localStorage.getItem('userPlan') || 'free').toLowerCase();
        const normalizedPlan: Plan = (rawPlan === 'starter' || rawPlan === 'pro' || rawPlan === 'premium') ? (rawPlan as Plan) : 'free';
        setPlanState(normalizedPlan);
        const rawCycle = (localStorage.getItem('userBillingCycle') || 'monthly').toLowerCase();
        const normalizedCycle: BillingCycle = rawCycle === 'yearly' ? 'yearly' : 'monthly';
        setCycleState(normalizedCycle);
      } catch {}
    };
    const onPlanUpdated = () => updateFromStorage();
    const onStorage = (e: StorageEvent) => {
      if (!e) return;
      if (e.key === 'userPlan' || e.key === 'userBillingCycle') updateFromStorage();
    };
    try { window.addEventListener('gp:plan-updated', onPlanUpdated as any); } catch {}
    try { window.addEventListener('storage', onStorage); } catch {}
    return () => {
      try { window.removeEventListener('gp:plan-updated', onPlanUpdated as any); } catch {}
      try { window.removeEventListener('storage', onStorage); } catch {}
    };
  }, []);

  const setPlan = (p: Plan) => {
    setPlanState(p);
    try { localStorage.setItem('userPlan', p); } catch {}
  };

  const setCycle = (c: BillingCycle) => {
    setCycleState(c);
    try { localStorage.setItem('userBillingCycle', c); } catch {}
  };

  return (
    <PlanContext.Provider value={{ plan, setPlan, cycle, setCycle }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = (): PlanContextValue => {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
};

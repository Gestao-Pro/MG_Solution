import React, { useEffect, useState } from 'react';
import { usePlan } from '@/contexts/PlanContext';
import { createCheckoutSession, openBillingPortal, getEnv } from '@/services/billingService';
import { getPricingInfo, formatAmount } from '@/services/pricingService';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/components/ToastProvider';
import { trackEvent, getOrCreateAnonId } from '@/services/analyticsService';
import BonusSelector from '@/components/BonusSelector';

const BillingPage: React.FC = () => {
  const { plan, setPlan } = usePlan();
  const { addToast } = useToast();
  const userId = (localStorage.getItem('userEmail') as string) || getOrCreateAnonId();
  const [selectedPlan, setSelectedPlan] = useState<'starter'|'pro'|'premium'>('starter');
  const [selectedCycle, setSelectedCycle] = useState<'monthly'|'yearly'>('monthly');
  const [pricing, setPricing] = useState<{starter?: any, starterYearly?: any, pro?: any, proYearly?: any, premium?: any, premiumYearly?: any}>({});
  const starterConfigured = !!getEnv('VITE_STRIPE_PRICE_STARTER','');
  const proConfigured = !!getEnv('VITE_STRIPE_PRICE_PRO','');
  const premiumConfigured = !!getEnv('VITE_STRIPE_PRICE_PREMIUM','');
  const starterYearlyConfigured = !!getEnv('VITE_STRIPE_PRICE_STARTER_YEARLY','');
  const proYearlyConfigured = !!getEnv('VITE_STRIPE_PRICE_PRO_YEARLY','');
  const premiumYearlyConfigured = !!getEnv('VITE_STRIPE_PRICE_PREMIUM_YEARLY','');
  const location = useLocation();

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const p = await getPricingInfo(ctrl.signal);
        setPricing({ starter: p.starter || undefined, starterYearly: p.starter_yearly || undefined, pro: p.pro || undefined, proYearly: p.pro_yearly || undefined, premium: p.premium || undefined, premiumYearly: p.premium_yearly || undefined });
        const hasY = Boolean(p.starter_yearly || p.pro_yearly || p.premium_yearly);
        trackEvent('pricing_loaded', { source: 'billing', hasYearly: hasY, starter: Boolean(p.starter), pro: Boolean(p.pro), premium: Boolean(p.premium), userId });
      } catch (e) {
        if ((e as any)?.name === 'AbortError') return;
        const msg = (e as any)?.message || 'unknown_error';
        trackEvent('pricing_error', { source: 'billing', message: msg, userId });
      }
    })();
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const planParam = (params.get('plan') || '').toLowerCase();
    if (planParam === 'starter' || planParam === 'pro' || planParam === 'premium') setSelectedPlan(planParam as any);
    const cycleParam = (params.get('cycle') || '').toLowerCase();
    if (cycleParam === 'yearly' || cycleParam === 'monthly') setSelectedCycle(cycleParam as any);
    if (planParam || cycleParam) {
      trackEvent('billing_query_params', { plan: planParam || null, cycle: cycleParam || null, userId });
    }
  }, [location.search]);

  const planLabel = plan === 'pro' ? 'Pro' : plan === 'starter' ? 'Starter' : plan === 'premium' ? 'Premium' : 'Free';

  const discountPercent = (planKey: 'starter'|'pro'|'premium') => {
    const monthly = planKey === 'starter' ? pricing?.starter : planKey === 'pro' ? pricing?.pro : pricing?.premium;
    const yearly = planKey === 'starter' ? pricing?.starterYearly : planKey === 'pro' ? pricing?.proYearly : pricing?.premiumYearly;
    if (!monthly?.amount || !yearly?.amount) return null;
    const monthlyYearTotal = monthly.amount * 12;
    const savings = monthlyYearTotal - yearly.amount;
    if (savings <= 0) return null;
    const pct = Math.round((savings / monthlyYearTotal) * 100);
    return pct;
  };

  const handleUpgrade = async () => {
    try {
      const info = selectedPlan === 'starter'
        ? (selectedCycle === 'yearly' ? (pricing?.starterYearly || pricing?.starter) : pricing?.starter)
        : selectedPlan === 'pro'
          ? (selectedCycle === 'yearly' ? (pricing?.proYearly || pricing?.pro) : pricing?.pro)
          : (selectedCycle === 'yearly' ? (pricing?.premiumYearly || pricing?.premium) : pricing?.premium);
      const priceId = info?.id || '';
      trackEvent('billing_upgrade_click', { plan: selectedPlan, cycle: selectedCycle, priceId: priceId || null, userId });
      if (!priceId) throw new Error('Preço do plano indisponível. Verifique /api/pricing e configuração Stripe.');
      const url = await createCheckoutSession(priceId);
      window.location.href = url;
    } catch (e) {
      addToast('Falha ao iniciar checkout. Verifique configuração Stripe.', 'error');
    }
  };

  const handleManage = async () => {
    try {
      trackEvent('billing_manage_click', { userId });
      const url = await openBillingPortal();
      window.location.href = url;
    } catch (e) {
      addToast('Falha ao abrir portal de faturamento.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Billing</h1>
        <div className="space-y-2">
          <p className="text-gray-700 dark:text-gray-300">Plano atual: <span className="font-medium">{planLabel}</span></p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-600 dark:text-gray-300">Ciclo:</span>
            <div className="inline-flex rounded border dark:border-gray-700 overflow-hidden">
              <button className={`px-2 py-1 text-xs ${selectedCycle==='monthly' ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}
                onClick={() => { setSelectedCycle('monthly'); trackEvent('billing_cycle_toggle', { cycle: 'monthly', userId }); }}>Mensal</button>
              <button className={`px-2 py-1 text-xs ${selectedCycle==='yearly' ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}
                onClick={() => { if (!starterYearlyConfigured && !proYearlyConfigured) return; setSelectedCycle('yearly'); trackEvent('billing_cycle_toggle', { cycle: 'yearly', userId }); }} disabled={!starterYearlyConfigured && !proYearlyConfigured}>Anual</button>
            </div>
            {(!starterYearlyConfigured && !proYearlyConfigured) && (
              <span className="text-xs text-gray-500">Planos anuais não configurados</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <button
              onClick={() => { setSelectedPlan('starter'); trackEvent('billing_plan_select', { plan: 'starter', userId }); }}
              className={`text-left p-4 rounded border ${selectedPlan==='starter' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Starter</h3>
                <span className={`text-xs px-2 py-1 rounded ${selectedPlan==='starter' ? 'bg-yellow-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>{selectedPlan==='starter' ? 'Selecionado' : 'Selecionar'}</span>
              </div>
              {pricing?.starter?.productName && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{pricing.starter.productName}{pricing?.starter?.nickname ? ` · ${pricing.starter.nickname}` : ''}</p>
              )}
              {(() => {
                const info = selectedCycle==='yearly' ? (pricing?.starterYearly || pricing?.starter) : pricing?.starter;
                const interval: 'month'|'year' = (info?.interval === 'year' || info?.interval === 'month') ? (info.interval as 'month'|'year') : (selectedCycle==='yearly' ? 'year' : 'month');
                return (<p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{formatAmount(info?.amount, info?.currency, interval)}</p>);
              })()}
              {selectedCycle==='yearly' && discountPercent('starter') && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1" title="Economia: (12 × preço mensal − preço anual) ÷ (12 × preço mensal)">Economize {discountPercent('starter')}% no anual</p>
              )}
              <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc pl-5 mt-2">
                <li>Chat/TTS 60 RPM, 200 por dia</li>
                <li>Imagen liberada</li>
                <li>Ideal para uso profissional moderado</li>
              </ul>
            </button>
            <button
              onClick={() => { setSelectedPlan('pro'); trackEvent('billing_plan_select', { plan: 'pro', userId }); }}
              className={`text-left p-4 rounded border ${selectedPlan==='pro' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pro</h3>
                <span className={`text-xs px-2 py-1 rounded ${selectedPlan==='pro' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>{selectedPlan==='pro' ? 'Selecionado' : 'Selecionar'}</span>
              </div>
              {pricing?.pro?.productName && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{pricing.pro.productName}{pricing?.pro?.nickname ? ` · ${pricing.pro.nickname}` : ''}</p>
              )}
              {(() => {
                const info = selectedCycle==='yearly' ? (pricing?.proYearly || pricing?.pro) : pricing?.pro;
                const interval: 'month'|'year' = (info?.interval === 'year' || info?.interval === 'month') ? (info.interval as 'month'|'year') : (selectedCycle==='yearly' ? 'year' : 'month');
                return (<p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{formatAmount(info?.amount, info?.currency, interval)}</p>);
              })()}
              {selectedCycle==='yearly' && discountPercent('pro') && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1" title="Economia: (12 × preço mensal − preço anual) ÷ (12 × preço mensal)">Economize {discountPercent('pro')}% no anual</p>
              )}
              <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc pl-5 mt-2">
                <li>Chat/TTS 90 RPM, 500 por dia</li>
                <li>Imagen liberada</li>
                <li>Recursos avançados e maior throughput</li>
              </ul>
            </button>
            <button
              onClick={() => { setSelectedPlan('premium'); trackEvent('billing_plan_select', { plan: 'premium', userId }); }}
              className={`text-left p-4 rounded border ${selectedPlan==='premium' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Premium</h3>
                <span className={`text-xs px-2 py-1 rounded ${selectedPlan==='premium' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>{selectedPlan==='premium' ? 'Selecionado' : 'Selecionar'}</span>
              </div>
              {pricing?.premium?.productName && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{pricing.premium.productName}{pricing?.premium?.nickname ? ` · ${pricing.premium.nickname}` : ''}</p>
              )}
              {(() => {
                const info = selectedCycle==='yearly' ? (pricing?.premiumYearly || pricing?.premium) : pricing?.premium;
                const interval: 'month'|'year' = (info?.interval === 'year' || info?.interval === 'month') ? (info.interval as 'month'|'year') : (selectedCycle==='yearly' ? 'year' : 'month');
                return (<p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{formatAmount(info?.amount, info?.currency, interval)}</p>);
              })()}
              {selectedCycle==='yearly' && discountPercent('premium') && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1" title="Economia: (12 × preço mensal − preço anual) ÷ (12 × preço mensal)">Economize {discountPercent('premium')}% no anual</p>
              )}
              <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc pl-5 mt-2">
                <li>Chat/TTS 120 RPM, 1000 por dia</li>
                <li>Imagen liberada</li>
                <li>Suporte dedicado e consultoria</li>
              </ul>
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleUpgrade}
              disabled={selectedPlan==='starter' ? (selectedCycle==='yearly' ? (!pricing?.starterYearly?.id && !pricing?.starter?.id) : !pricing?.starter?.id) : selectedPlan==='pro' ? (selectedCycle==='yearly' ? (!pricing?.proYearly?.id && !pricing?.pro?.id) : !pricing?.pro?.id) : (selectedCycle==='yearly' ? (!pricing?.premiumYearly?.id && !pricing?.premium?.id) : !pricing?.premium?.id)}
              className={`px-3 py-2 rounded ${selectedPlan==='starter' ? ((selectedCycle==='yearly' ? (pricing?.starterYearly?.id || pricing?.starter?.id) : pricing?.starter?.id) ? 'bg-yellow-600 text-white hover:bg-yellow-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed') : selectedPlan==='pro' ? ((selectedCycle==='yearly' ? (pricing?.proYearly?.id || pricing?.pro?.id) : pricing?.pro?.id) ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed') : ((selectedCycle==='yearly' ? (pricing?.premiumYearly?.id || pricing?.premium?.id) : pricing?.premium?.id) ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed')}`}
            >Fazer Upgrade para {selectedPlan==='starter' ? 'Starter' : selectedPlan==='pro' ? 'Pro' : 'Premium'}</button>
            {plan !== 'free' && (
              <button onClick={handleManage} className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">Gerenciar assinatura</button>
            )}
          </div>
          {(!(pricing?.starter?.id) || !(pricing?.pro?.id) || !(pricing?.premium?.id)) && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Não foi possível carregar todos os preços mensais do Stripe. Verifique o endpoint <code>/api/pricing</code> e a configuração do backend.
            </p>
          )}
          {selectedCycle==='yearly' && (!pricing?.starterYearly?.id || !pricing?.proYearly?.id || !pricing?.premiumYearly?.id) && (
            <p className="text-xs text-yellow-700 dark:text-yellow-300">Alguns preços anuais não estão configurados no Stripe/servidor.</p>
          )}
        </div>
        {(selectedCycle==='yearly' && (selectedPlan==='starter' || selectedPlan==='pro')) && (
          <div className="mt-6">
            <BonusSelector plan={selectedPlan} cycle={selectedCycle} />
          </div>
        )}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Planos</h2>
          <ul className="text-gray-700 dark:text-gray-300 list-disc pl-5">
            <li>Free: Chat/TTS 30 RPM, 50 por dia. Imagen indisponível.</li>
            <li>Starter: Chat/TTS 60 RPM, 200 por dia. Imagen liberada.</li>
            <li>Pro: Chat/TTS 90 RPM, 500 por dia. Imagen liberada e futuras features avançadas.</li>
            <li>Premium: Chat/TTS 120 RPM, 1000 por dia. Suporte dedicado.</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notas</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Este é um ambiente de desenvolvimento. Em produção, o plano é obtido do backend e validado nos serviços de IA.</p>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
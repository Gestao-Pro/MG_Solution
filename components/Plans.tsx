import React, { useEffect, useState } from 'react';
import AnimatedElement from './AnimatedElement';
import { useNavigate } from 'react-router-dom';
import { formatAmount, getPricingInfo, PriceInfo } from '../services/pricingService';
import { trackEvent, getOrCreateAnonId } from '../services/analyticsService';

const Plans: React.FC = () => {
  const userId = (localStorage.getItem('userEmail') as string) || getOrCreateAnonId();
  const [starter, setStarter] = useState<PriceInfo | null>(null);
  const [starterYearly, setStarterYearly] = useState<PriceInfo | null>(null);
  const [pro, setPro] = useState<PriceInfo | null>(null);
  const [proYearly, setProYearly] = useState<PriceInfo | null>(null);
  const [premium, setPremium] = useState<PriceInfo | null>(null);
  const [premiumYearly, setPremiumYearly] = useState<PriceInfo | null>(null);
  const [cycle, setCycle] = useState<'monthly'|'yearly'>('monthly');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const data = await getPricingInfo(ctrl.signal);
        setStarter(data.starter);
        setStarterYearly(data.starter_yearly || null);
        setPro(data.pro);
        setProYearly(data.pro_yearly || null);
        setPremium(data.premium || null);
        setPremiumYearly(data.premium_yearly || null);
        const hasY = Boolean(data.starter_yearly || data.pro_yearly || data.premium_yearly);
        trackEvent('pricing_loaded', { source: 'plans', hasYearly: hasY, starter: Boolean(data.starter), pro: Boolean(data.pro), premium: Boolean(data.premium), userId });
      } catch (e) {
        // Ignora cancelamentos intencionais para evitar ruído
        if ((e as any)?.name === 'AbortError') return;
        setError('Não foi possível carregar os preços no momento.');
        const msg = (e as any)?.message || 'unknown_error';
        trackEvent('pricing_error', { source: 'plans', message: msg, userId });
      }
    })();
    return () => ctrl.abort();
  }, []);

  const hasYearly = Boolean(starterYearly || proYearly || premiumYearly);
  const priceFor = (plan: 'starter'|'pro') => {
    const info = plan === 'starter'
      ? (cycle === 'yearly' ? starterYearly || starter : starter)
      : (cycle === 'yearly' ? proYearly || pro : pro);
    const interval: 'month'|'year' = (info?.interval === 'year' || info?.interval === 'month')
      ? (info.interval as 'month'|'year')
      : (cycle === 'yearly' ? 'year' : 'month');
    return formatAmount(info?.amount, info?.currency, interval);
  };

  const priceForPremium = () => {
    const info = cycle === 'yearly' ? premiumYearly || premium : premium;
    const interval: 'month'|'year' = (info?.interval === 'year' || info?.interval === 'month')
      ? (info.interval as 'month'|'year')
      : (cycle === 'yearly' ? 'year' : 'month');
    return formatAmount(info?.amount, info?.currency, interval);
  };

  const discountPercent = (plan: 'starter'|'pro') => {
    const monthly = plan === 'starter' ? starter : pro;
    const yearly = plan === 'starter' ? starterYearly : proYearly;
    if (!monthly?.amount || !yearly?.amount) return null;
    const monthlyYearTotal = monthly.amount * 12;
    const savings = monthlyYearTotal - yearly.amount;
    if (savings <= 0) return null;
    const pct = Math.round((savings / monthlyYearTotal) * 100);
    return pct;
  };

  const onCtaClick = (plan: 'starter'|'pro'|'premium') => {
    trackEvent('landing_cta_click', { plan, cycle, userId });
    navigate(`/billing?plan=${plan}&cycle=${cycle}`);
  };

  const onFreeClick = () => {
    trackEvent('landing_free_click', { userId });
    navigate('/login');
  };

  return (
    <section id="plans" className="py-20 md:py-32 overflow-hidden">
      <div className="container mx-auto px-6">
        <AnimatedElement className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Planos Simples e Transparentes</h2>
          <p className="text-lg text-gray-400">Escolha o plano ideal para o seu momento e comece agora.</p>
        </AnimatedElement>
        {error && (
          <div className="text-center mb-6 text-yellow-500">{error}</div>
        )}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="text-sm text-gray-400">Ciclo:</span>
              <div className="inline-flex rounded border border-slate-700 overflow-hidden">
                <button
                  className={`px-3 py-1 text-sm ${cycle==='monthly' ? 'bg-slate-700 text-white' : 'text-gray-300'}`}
                  onClick={() => { setCycle('monthly'); trackEvent('landing_cycle_toggle', { cycle: 'monthly', userId }); }}
                >Mensal</button>
                <button
                  className={`px-3 py-1 text-sm ${cycle==='yearly' ? 'bg-slate-700 text-white' : 'text-gray-300'}`}
                  onClick={() => { if (hasYearly) { setCycle('yearly'); trackEvent('landing_cycle_toggle', { cycle: 'yearly', userId }); } }}
                  disabled={!hasYearly}
                >Anual</button>
              </div>
          {!hasYearly && (
            <span className="text-xs text-gray-500">Planos anuais não configurados</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <AnimatedElement>
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <h3 className="text-xl font-semibold text-white">Starter</h3>
              {starter?.productName && (
                <p className="text-xs text-gray-400">{starter.productName}{starter?.nickname ? ` · ${starter.nickname}` : ''}</p>
              )}
              <p className="text-gray-400 mt-1">{priceFor('starter')}</p>
              <ul className="text-sm text-gray-300 list-disc pl-5 mt-3 space-y-1">
                <li>Chat/TTS 60 RPM · 200/dia</li>
                <li>Imagem liberada</li>
                <li>Ideal para uso profissional moderado</li>
                <li>Agentes incluídos: {cycle==='yearly' ? '7 (anual)' : '5 (mensal)'}{cycle==='yearly' ? ' · +2 bônus selecionáveis' : ''}</li>
                <li>Agentes adicionais como add-on (preço por especialidade)</li>
              </ul>
              <div className="mt-4 flex items-center gap-3">
                <button onClick={() => onCtaClick('starter')} className="inline-block px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700">Assinar Starter</button>
                {cycle==='yearly' && hasYearly && discountPercent('starter') && (
                  <span className="text-xs text-green-400" title="Economia: (12 × preço mensal − preço anual) ÷ (12 × preço mensal)">Economize {discountPercent('starter')}%</span>
                )}
              </div>
            </div>
          </AnimatedElement>
          <AnimatedElement delay={100}>
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <h3 className="text-xl font-semibold text-white">Pro</h3>
              {pro?.productName && (
                <p className="text-xs text-gray-400">{pro.productName}{pro?.nickname ? ` · ${pro.nickname}` : ''}</p>
              )}
              <p className="text-gray-400 mt-1">{priceFor('pro')}</p>
              <ul className="text-sm text-gray-300 list-disc pl-5 mt-3 space-y-1">
                <li>Chat/TTS 90 RPM · 500/dia</li>
                <li>Imagem liberada</li>
                <li>Recursos avançados e maior throughput</li>
                <li>Agentes incluídos: {cycle==='yearly' ? '22 (anual)' : '19 (mensal)'}{cycle==='yearly' ? ' · +3 bônus selecionáveis' : ''}</li>
                {cycle==='yearly' && (
                  <li>Inclui 10 interações com SuperBoss (modo leve)</li>
                )}
                <li>Agentes adicionais como add-on (preço por especialidade)</li>
              </ul>
              <div className="mt-4 flex items-center gap-3">
                <button onClick={() => onCtaClick('pro')} className="inline-block px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">Assinar Pro</button>
                {cycle==='yearly' && hasYearly && discountPercent('pro') && (
                  <span className="text-xs text-green-400" title="Economia: (12 × preço mensal − preço anual) ÷ (12 × preço mensal)">Economize {discountPercent('pro')}%</span>
                )}
              </div>
            </div>
          </AnimatedElement>
          <AnimatedElement delay={200}>
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <h3 className="text-xl font-semibold text-white">Premium</h3>
              {premium?.productName && (
                <p className="text-xs text-gray-400">{premium.productName}{premium?.nickname ? ` · ${premium.nickname}` : ''}</p>
              )}
              <p className="text-gray-400 mt-1">{priceForPremium()}</p>
              <ul className="text-sm text-gray-300 list-disc pl-5 mt-3 space-y-1">
                <li>Chat/TTS 120 RPM · 1000/dia</li>
                <li>Imagem liberada</li>
                <li>Suporte dedicado e consultoria</li>
                <li>Agentes incluídos: {cycle==='yearly' ? '30 (anual)' : '30 (mensal)'}{cycle==='yearly' ? '' : ''}</li>
                <li>SuperBoss ilimitado</li>
                <li>Agentes adicionais como add-on (preço por especialidade)</li>
              </ul>
              <div className="mt-4 flex items-center gap-3">
                <button onClick={() => onCtaClick('premium')} className="inline-block px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700">Assinar Premium</button>
                {cycle==='yearly' && hasYearly && premiumYearly && premium && (
                  <span className="text-xs text-green-400" title="Economia anual vs mensal">
                    Economize {(() => {
                      const monthly = premium?.amount; const yearly = premiumYearly?.amount;
                      if (!monthly || !yearly) return 0;
                      const total = monthly * 12; const savings = total - yearly; if (savings <= 0) return 0;
                      return Math.round((savings / total) * 100);
                    })()}%
                  </span>
                )}
              </div>
            </div>
          </AnimatedElement>
        </div>
        <div className="text-center mt-6 text-xs text-gray-400">
          Agentes adicionais podem ser adquiridos individualmente conforme a necessidade. O valor varia de acordo com a especialidade estratégica do agente.
        </div>
        <div className="text-center mt-10">
          <button onClick={onFreeClick} className="text-indigo-400 hover:text-indigo-300">Prefere testar primeiro? Acesse a versão Free</button>
        </div>
      </div>
    </section>
  );
};

export default Plans;
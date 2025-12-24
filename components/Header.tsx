
import React, { useEffect, useState } from 'react';
import { Menu, Sun, Moon, PenTool, Save, LogOut, Crown, X } from 'lucide-react'; // Import Save, Logout and Upgrade icons
import IconButton from './IconButton';
import { createCheckoutSession, openBillingPortal, getEnv } from '@/services/billingService';
import { getPricingInfo, formatAmount } from '@/services/pricingService';
import { trackEvent } from '@/services/analyticsService';
import { useToast } from '@/components/ToastProvider';
import { CreditCard } from 'lucide-react';
import { UserProfile } from '../types';
import { usePlan } from '@/contexts/PlanContext';
import { getDailyUsage, getDailyLimitFor } from '@/services/usageService';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
    toggleSidebar: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    userProfile: UserProfile;
    onEditProfile: () => void;
    onSaveSession: (problemSummary: string) => void; // Add onSaveSession prop
    onLogout: () => void; // Add onLogout prop
    onUpgrade?: () => void; // Optional upgrade CTA
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, theme, toggleTheme, userProfile, onEditProfile, onSaveSession, onLogout, onUpgrade }) => {
    const userInitial = userProfile.userName ? userProfile.userName.charAt(0).toUpperCase() : '?';
    const { addToast } = useToast();
    const { plan } = usePlan();
    const planLabel = plan === 'pro' ? 'Pro' : plan === 'starter' ? 'Starter' : plan === 'premium' ? 'Premium' : 'Free';
    const navigate = useNavigate();
    const chatUsage = getDailyUsage('chat');
    const chatLimit = getDailyLimitFor('chat');
    const ttsUsage = getDailyUsage('tts');
    const ttsLimit = getDailyLimitFor('tts');

    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const toggleUpgradeMenu = () => setUpgradeMenuOpenWithEvent();
    const [selectedCycle, setSelectedCycle] = useState<'month' | 'year'>('month');
    const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'premium'>('starter');
    const [pricing, setPricing] = useState<{starter?: any, pro?: any, premium?: any, starterYearly?: any, proYearly?: any, premiumYearly?: any}>({});
    const [pricingError, setPricingError] = useState<string | null>(null);
    const [isPricingLoading, setIsPricingLoading] = useState(false);
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [showBenefits, setShowBenefits] = useState<boolean>(true);
    
    // Helpers: economia no anual e tooltips
    const computeSavingsPercent = (monthly?: number, yearly?: number) => {
      if (!monthly || !yearly || monthly <= 0) return null;
      const baseline = monthly * 12;
      const savings = Math.max(0, baseline - yearly);
      const pct = Math.round((savings / baseline) * 100);
      if (!isFinite(pct) || pct <= 0) return null;
      return pct;
    };
    const getSelectedCycleSavingsText = () => {
      if (selectedCycle !== 'year') return null;
      const m = selectedPlan === 'starter' ? pricing?.starter?.amount : selectedPlan === 'pro' ? pricing?.pro?.amount : pricing?.premium?.amount;
      const y = selectedPlan === 'starter' ? pricing?.starterYearly?.amount : selectedPlan === 'pro' ? pricing?.proYearly?.amount : pricing?.premiumYearly?.amount;
      const pct = computeSavingsPercent(m, y);
      return pct ? `Economize ${pct}%` : null;
    };
    const getPlanTooltip = (plan: 'starter'|'pro'|'premium') => {
      const base = plan === 'starter' ? '60 RPM · 200/dia' : plan === 'pro' ? '90 RPM · 500/dia' : '120 RPM · 1000/dia';
      const bonus = selectedCycle === 'year' ? (plan === 'starter' ? ' · +1 agente (anual)' : plan === 'pro' ? ' · +2 agentes (anual)' : ' · +3 agentes (anual)') : '';
      return `${base}${bonus}`;
    };
    useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    const starterYearlyConfigured = !!getEnv('VITE_STRIPE_PRICE_STARTER_YEARLY','');
    const proYearlyConfigured = !!getEnv('VITE_STRIPE_PRICE_PRO_YEARLY','');
    const premiumYearlyConfigured = !!getEnv('VITE_STRIPE_PRICE_PREMIUM_YEARLY','');

    const setUpgradeMenuOpenWithEvent = () => {
      setUpgradeOpen(prev => {
        const next = !prev;
        if (next) trackEvent('header_upgrade_open');
        return next;
      });
    };

    const handleCycleSelect = (c: 'month'|'year') => {
      setSelectedCycle(c);
      trackEvent('header_cycle_select', { cycle: c });
    };

    const handlePlanSelect = (p: 'starter'|'pro'|'premium') => {
      setSelectedPlan(p);
      trackEvent('header_plan_select', { plan: p });
    };
    useEffect(() => {
      if (!upgradeOpen) return;
      (async () => {
        setPricingError(null);
        setIsPricingLoading(true);
        try {
          const p = await getPricingInfo();
          setPricing({
            starter: p.starter || undefined,
            pro: p.pro || undefined,
            premium: p.premium || undefined,
            starterYearly: p.starter_yearly || undefined,
            proYearly: p.pro_yearly || undefined,
            premiumYearly: p.premium_yearly || undefined,
          });
        } catch (e) {
          setPricingError('Não foi possível carregar preços.');
        } finally {
          setIsPricingLoading(false);
        }
      })();
    }, [upgradeOpen]);
    const upgradeTo = async (target: 'starter'|'pro'|'premium') => {
      try {
        const monthlyInfo = target === 'starter'
          ? pricing?.starter
          : target === 'pro'
            ? pricing?.pro
            : pricing?.premium;
        const yearlyInfo  = target === 'starter'
          ? pricing?.starterYearly
          : target === 'pro'
            ? pricing?.proYearly
            : pricing?.premiumYearly;

        // Fallback para .env apenas se o servidor não retornou preços
        const monthlyEnv = target === 'starter'
          ? getEnv('VITE_STRIPE_PRICE_STARTER','')
          : target === 'pro'
            ? getEnv('VITE_STRIPE_PRICE_PRO','')
            : getEnv('VITE_STRIPE_PRICE_PREMIUM','');
        const yearlyEnv  = target === 'starter'
          ? getEnv('VITE_STRIPE_PRICE_STARTER_YEARLY','')
          : target === 'pro'
            ? getEnv('VITE_STRIPE_PRICE_PRO_YEARLY','')
            : getEnv('VITE_STRIPE_PRICE_PREMIUM_YEARLY','');

        const priceId = selectedCycle === 'year'
          ? (yearlyInfo?.id || monthlyInfo?.id || yearlyEnv || monthlyEnv)
          : (monthlyInfo?.id || monthlyEnv);

        if (!priceId) throw new Error('Preço do plano não configurado.');
        trackEvent('header_upgrade_click', { plan: target, cycle: selectedCycle, priceId });
        setSelectedPlan(target);
        const url = await createCheckoutSession(priceId);
        window.location.href = url;
      } catch (e) {
        addToast('Falha ao iniciar checkout. Verifique configuração Stripe.', 'error');
      }
    };

    const handleUpgrade = async () => {
      navigate('/billing');
    };

    const handleManageBilling = async () => {
      try {
        const url = await openBillingPortal();
        window.location.href = url;
      } catch (e) {
        addToast('Falha ao abrir portal de faturamento. Faça upgrade primeiro.', 'error');
      }
    };

    return (
        <header className="flex-shrink-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
            <IconButton 
                icon={Menu} 
                onClick={toggleSidebar} 
                tooltip="Mostrar/Esconder Menu" 
                className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            />
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate" style={{maxWidth: '150px'}}>{userProfile.userName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" style={{maxWidth: '150px'}}>{userProfile.userRole}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {userInitial}
                    </div>
                </div>
                <IconButton 
                    icon={PenTool}
                    onClick={onEditProfile}
                    tooltip="Editar Perfil"
                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                />
                <IconButton 
                    icon={Save}
                    onClick={() => onSaveSession("Sessão Salva Manualmente")} // Call onSaveSession with a default problem summary
                    tooltip="Salvar Sessão"
                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                />
                <button
                  onClick={() => navigate('/billing')}
                  className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="Abrir Billing"
                >
                  Plano: {planLabel}
                </button>
                <span className="px-2 py-1 text-xs rounded bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  Uso diário — Chat {chatUsage}/{chatLimit} · TTS {ttsUsage}/{ttsLimit}
                </span>
                {onUpgrade ? (
                  <IconButton 
                    icon={Crown}
                    onClick={onUpgrade}
                    tooltip="Upgrade"
                    className="text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-gray-800"
                  />
                ) : (
                  <>
                    {!isMobile ? (
                      <div className="relative">
                        <IconButton 
                          icon={Crown}
                          onClick={toggleUpgradeMenu}
                          tooltip="Upgrade"
                          className="text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-gray-800"
                        />
                        {upgradeOpen && (
                          <>
                            <div className="fixed inset-0 bg-black/30 z-40 animate-[fadeIn_160ms_ease-out]" onClick={() => setUpgradeOpen(false)} />
                            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[700px] max-w-[95vw] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto animate-[fadeIn_180ms_ease-out] motion-safe:animate-[slideUp_180ms_ease-out]">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">Upgrade de plano</p>
                                <button onClick={() => setUpgradeOpen(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Fechar">
                                  <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                </button>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-300">Selecione um plano para fazer upgrade:</p>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 dark:text-gray-300">Ciclo</span>
                                <div className="inline-flex rounded overflow-hidden border border-gray-200 dark:border-gray-700">
                                  <button
                                    onClick={() => handleCycleSelect('month')}
                                    className={`px-2 py-1 ${selectedCycle === 'month' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                                  >Mensal</button>
                                  <button
                                    onClick={() => handleCycleSelect('year')}
                                    className={`px-2 py-1 ${selectedCycle === 'year' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                                  >Anual</button>
                                </div>
                                {getSelectedCycleSavingsText() ? (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">{getSelectedCycleSavingsText()}</span>
                                ) : null}
                              </div>
                              <div className="flex items-center justify-between text-xs mt-2">
                                <span className="text-gray-600 dark:text-gray-300">Plano</span>
                                <div className="inline-flex rounded overflow-hidden border border-gray-200 dark:border-gray-700">
                                  <button
                                    onClick={() => handlePlanSelect('starter')}
                                    className={`px-2 py-1 ${selectedPlan === 'starter' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 ring-2 ring-yellow-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                                  >Starter</button>
                                  <button
                                    onClick={() => handlePlanSelect('pro')}
                                    className={`px-2 py-1 ${selectedPlan === 'pro' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 ring-2 ring-indigo-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                                  >Pro</button>
                                  <button
                                    onClick={() => handlePlanSelect('premium')}
                                    className={`px-2 py-1 ${selectedPlan === 'premium' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 ring-2 ring-purple-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                                  >Premium</button>
                                </div>
                              </div>
                              {selectedCycle === 'year' && (!pricing?.starterYearly?.id || !pricing?.proYearly?.id || !pricing?.premiumYearly?.id) ? (
                                <p className="text-[11px] text-yellow-700 dark:text-yellow-400 mt-1">Alguns preços anuais não foram carregados do servidor. Verifique o endpoint <code>/api/pricing</code> e a configuração do backend.</p>
                              ) : null}
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button
                                  onClick={() => upgradeTo('starter')}
                                  disabled={isPricingLoading || (selectedCycle === 'year' ? !pricing?.starterYearly?.id : !pricing?.starter?.id)}
                                  className={`group w-full px-4 py-3 text-left rounded-lg shadow-md hover:shadow-lg ${(selectedCycle === 'year' ? !!pricing?.starterYearly?.id : !!pricing?.starter?.id) && !isPricingLoading ? 'bg-gradient-to-b from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white ring-1 ring-white/20 dark:ring-white/10' : 'bg-gray-200 text-gray-500 cursor-not-allowed'} ${selectedPlan === 'starter' ? 'ring-2 ring-yellow-300 ring-offset-1' : ''}`}
                                  title={getPlanTooltip('starter')}
                                >
                                  <div className="flex items-baseline justify-between">
                                    <span className="font-semibold text-sm">Starter</span>
                                    <span className="font-bold text-lg tracking-tight leading-none">{isPricingLoading ? 'Carregando…' : (selectedCycle === 'year' && pricing?.starterYearly ? formatAmount(pricing?.starterYearly?.amount, pricing?.starterYearly?.currency, 'year') : formatAmount(pricing?.starter?.amount, pricing?.starter?.currency, 'month'))}</span>
                                  </div>
                                  <p className="text-xs leading-tight opacity-80 mt-1">60 RPM · 200/dia</p>
                                </button>
                                <button
                                  onClick={() => upgradeTo('pro')}
                                  disabled={isPricingLoading || (selectedCycle === 'year' ? !pricing?.proYearly?.id : !pricing?.pro?.id)}
                                  className={`group w-full px-4 py-3 text-left rounded-lg shadow-md hover:shadow-lg ${(selectedCycle === 'year' ? !!pricing?.proYearly?.id : !!pricing?.pro?.id) && !isPricingLoading ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white ring-1 ring-white/20 dark:ring-white/10' : 'bg-gray-200 text-gray-500 cursor-not-allowed'} ${selectedPlan === 'pro' ? 'ring-2 ring-indigo-300 ring-offset-1' : ''}`}
                                  title={getPlanTooltip('pro')}
                                >
                                  <div className="flex items-baseline justify-between">
                                    <span className="font-semibold text-sm">Pro</span>
                                    <span className="font-bold text-lg tracking-tight leading-none">{isPricingLoading ? 'Carregando…' : (selectedCycle === 'year' && pricing?.proYearly ? formatAmount(pricing?.proYearly?.amount, pricing?.proYearly?.currency, 'year') : formatAmount(pricing?.pro?.amount, pricing?.pro?.currency, 'month'))}</span>
                                  </div>
                                  <p className="text-xs leading-tight opacity-80 mt-1">90 RPM · 500/dia</p>
                                </button>
                                <button
                                  onClick={() => upgradeTo('premium')}
                                  disabled={isPricingLoading || (selectedCycle === 'year' ? !pricing?.premiumYearly?.id : !pricing?.premium?.id)}
                                  className={`group w-full px-4 py-3 text-left rounded-lg shadow-md hover:shadow-lg ${(selectedCycle === 'year' ? !!pricing?.premiumYearly?.id : !!pricing?.premium?.id) && !isPricingLoading ? 'bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white ring-1 ring-white/20 dark:ring-white/10' : 'bg-gray-200 text-gray-500 cursor-not-allowed'} ${selectedPlan === 'premium' ? 'ring-2 ring-purple-300 ring-offset-1' : ''}`}
                                  title={getPlanTooltip('premium')}
                                >
                                  <div className="flex items-baseline justify-between">
                                    <span className="font-semibold text-sm">Premium</span>
                                    <span className="font-bold text-lg tracking-tight leading-none">{isPricingLoading ? 'Carregando…' : (selectedCycle === 'year' && pricing?.premiumYearly ? formatAmount(pricing?.premiumYearly?.amount, pricing?.premiumYearly?.currency, 'year') : formatAmount(pricing?.premium?.amount, pricing?.premium?.currency, 'month'))}</span>
                                  </div>
                                  <p className="text-xs leading-tight opacity-80 mt-1">120 RPM · 1000/dia</p>
                                </button>
                              </div>
                              {selectedCycle === 'month' && (!pricing?.starter?.id || !pricing?.pro?.id || !pricing?.premium?.id) ? (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-2">Alguns preços mensais não foram carregados do servidor. Verifique o endpoint <code>/api/pricing</code> e a configuração do backend.</p>
                              ) : null}
                              {pricingError ? (
                                <p className="text-xs text-yellow-600 dark:text-yellow-400">{pricingError}</p>
                              ) : null}
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Benefícios dos planos</p>
                                  <button onClick={() => setShowBenefits((s) => !s)} className="text-xs underline text-gray-600 dark:text-gray-300">{showBenefits ? 'Ocultar' : 'Mostrar'}</button>
                                </div>
                                {showBenefits && (
                                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-300">
                                    <div>
                                      <p className="font-medium text-gray-800 dark:text-gray-100">Starter</p>
                                      <ul className="list-disc pl-4 space-y-1">
                                        <li>60 RPM (Chat/TTS)</li>
                                        <li>200 requisições por dia</li>
                                        <li>Agentes incluídos: 5 (mensal) · +1 bônus no anual</li>
                                        <li>Agentes adicionais como add-on (preço por especialidade)</li>
                                        <li>Suporte básico por e-mail</li>
                                      </ul>
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-800 dark:text-gray-100">Pro</p>
                                      <ul className="list-disc pl-4 space-y-1">
                                        <li>90 RPM (Chat/TTS)</li>
                                        <li>500 requisições por dia</li>
                                        <li>Agentes incluídos: 19 (mensal) · +2 bônus no anual</li>
                                        <li>Agentes adicionais como add-on (preço por especialidade)</li>
                                        <li>Suporte prioritário</li>
                                        <li>Recursos avançados e personalização</li>
                                      </ul>
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-800 dark:text-gray-100">Premium</p>
                                      <ul className="list-disc pl-4 space-y-1">
                                        <li>120 RPM (Chat/TTS)</li>
                                        <li>1000 requisições por dia</li>
                                        <li>Agentes incluídos: 30 (mensal) · +3 bônus no anual</li>
                                        <li>Agentes adicionais como add-on (preço por especialidade)</li>
                                        <li>Suporte dedicado e consultoria</li>
                                      </ul>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => { trackEvent('header_billing_view', { cycle: selectedCycle, plan: selectedPlan }); navigate(`/billing?plan=${selectedPlan}&cycle=${selectedCycle}`); }}
                                className="w-full px-3 py-2 text-left rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                              >Ver página de Billing</button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <>
                        <IconButton 
                          icon={Crown}
                          onClick={toggleUpgradeMenu}
                          tooltip="Upgrade"
                          className="text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-gray-800"
                        />
                        {upgradeOpen && (
                          <>
                            <div className="fixed inset-0 bg-black/30 z-40 animate-[fadeIn_160ms_ease-out]" onClick={() => setUpgradeOpen(false)} />
                            <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-4 space-y-3 max-h-[75vh] overflow-y-auto animate-[fadeIn_200ms_ease-out] motion-safe:animate-[slideUp_200ms_ease-out]">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">Upgrade de plano</p>
                                <button onClick={() => setUpgradeOpen(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Fechar">
                                  <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                </button>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-300">Selecione um plano para fazer upgrade:</p>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 dark:text-gray-300">Ciclo</span>
                                <div className="inline-flex rounded overflow-hidden border border-gray-200 dark:border-gray-700">
                                  <button
                                    onClick={() => handleCycleSelect('month')}
                                    className={`px-3 py-2 ${selectedCycle === 'month' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                                  >Mensal</button>
                                  <button
                                    onClick={() => handleCycleSelect('year')}
                                    className={`px-3 py-2 ${selectedCycle === 'year' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                                  >Anual</button>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-xs mt-2">
                                <span className="text-gray-600 dark:text-gray-300">Plano</span>
                                <div className="inline-flex rounded overflow-hidden border border-gray-200 dark:border-gray-700">
                                  <button
                                    onClick={() => handlePlanSelect('starter')}
                                    className={`px-3 py-2 ${selectedPlan === 'starter' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                                  >Starter</button>
                                  <button
                                    onClick={() => handlePlanSelect('pro')}
                                    className={`px-3 py-2 ${selectedPlan === 'pro' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                                  >Pro</button>
                                  <button
                                    onClick={() => handlePlanSelect('premium')}
                                    className={`px-3 py-2 ${selectedPlan === 'premium' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                                  >Premium</button>
                                </div>
                              </div>
                              {selectedCycle === 'year' && (!pricing?.starterYearly?.id || !pricing?.proYearly?.id || !pricing?.premiumYearly?.id) ? (
                                <p className="text-[11px] text-yellow-700 dark:text-yellow-400 mt-1">Alguns preços anuais não foram carregados do servidor. Verifique o endpoint <code>/api/pricing</code> e a configuração do backend.</p>
                              ) : null}
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button
                                  onClick={() => upgradeTo('starter')}
                                  disabled={isPricingLoading || (selectedCycle === 'year' ? !pricing?.starterYearly?.id : !pricing?.starter?.id)}
                                  className={`group w-full px-4 py-3 text-left rounded-lg shadow-md hover:shadow-lg ${(selectedCycle === 'year' ? !!pricing?.starterYearly?.id : !!pricing?.starter?.id) && !isPricingLoading ? 'bg-gradient-to-b from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white ring-1 ring-white/20 dark:ring-white/10' : 'bg-gray-200 text-gray-500 cursor-not-allowed'} ${selectedPlan === 'starter' ? 'ring-2 ring-yellow-300 ring-offset-1' : ''}`}
                                  title={getPlanTooltip('starter')}
                                >
                                  <div className="flex items-baseline justify-between">
                                    <span className="font-semibold text-sm">Starter</span>
                                    <span className="font-bold text-lg tracking-tight leading-none">{isPricingLoading ? 'Carregando…' : (selectedCycle === 'year' && pricing?.starterYearly ? formatAmount(pricing?.starterYearly?.amount, pricing?.starterYearly?.currency, 'year') : formatAmount(pricing?.starter?.amount, pricing?.starter?.currency, 'month'))}</span>
                                  </div>
                                  <p className="text-xs leading-tight opacity-80 mt-1">60 RPM · 200/dia</p>
                                </button>
                                <button
                                  onClick={() => upgradeTo('pro')}
                                  disabled={isPricingLoading || (selectedCycle === 'year' ? !pricing?.proYearly?.id : !pricing?.pro?.id)}
                                  className={`group w-full px-4 py-3 text-left rounded-lg shadow-md hover:shadow-lg ${(selectedCycle === 'year' ? !!pricing?.proYearly?.id : !!pricing?.pro?.id) && !isPricingLoading ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white ring-1 ring-white/20 dark:ring-white/10' : 'bg-gray-200 text-gray-500 cursor-not-allowed'} ${selectedPlan === 'pro' ? 'ring-2 ring-indigo-300 ring-offset-1' : ''}`}
                                  title={getPlanTooltip('pro')}
                                >
                                  <div className="flex items-baseline justify-between">
                                    <span className="font-semibold text-sm">Pro</span>
                                    <span className="font-bold text-lg tracking-tight leading-none">{isPricingLoading ? 'Carregando…' : (selectedCycle === 'year' && pricing?.proYearly ? formatAmount(pricing?.proYearly?.amount, pricing?.proYearly?.currency, 'year') : formatAmount(pricing?.pro?.amount, pricing?.pro?.currency, 'month'))}</span>
                                  </div>
                                  <p className="text-xs leading-tight opacity-80 mt-1">90 RPM · 500/dia</p>
                                </button>
                                <button
                                  onClick={() => upgradeTo('premium')}
                                  disabled={isPricingLoading || (selectedCycle === 'year' ? !pricing?.premiumYearly?.id : !pricing?.premium?.id)}
                                  className={`group w-full px-4 py-3 text-left rounded-lg shadow-md hover:shadow-lg ${(selectedCycle === 'year' ? !!pricing?.premiumYearly?.id : !!pricing?.premium?.id) && !isPricingLoading ? 'bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white ring-1 ring-white/20 dark:ring-white/10' : 'bg-gray-200 text-gray-500 cursor-not-allowed'} ${selectedPlan === 'premium' ? 'ring-2 ring-purple-300 ring-offset-1' : ''}`}
                                  title={getPlanTooltip('premium')}
                                >
                                  <div className="flex items-baseline justify-between">
                                    <span className="font-semibold text-sm">Premium</span>
                                    <span className="font-bold text-lg tracking-tight leading-none">{isPricingLoading ? 'Carregando…' : (selectedCycle === 'year' && pricing?.premiumYearly ? formatAmount(pricing?.premiumYearly?.amount, pricing?.premiumYearly?.currency, 'year') : formatAmount(pricing?.premium?.amount, pricing?.premium?.currency, 'month'))}</span>
                                  </div>
                                  <p className="text-xs leading-tight opacity-80 mt-1">120 RPM · 1000/dia</p>
                                </button>
                              </div>
                              {selectedCycle === 'month' && (!pricing?.starter?.id || !pricing?.pro?.id || !pricing?.premium?.id) ? (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                                  Alguns preços mensais não foram carregados do servidor. Verifique o endpoint <code>/api/pricing</code> e a configuração do backend.
                                  {' '}
                                  <a href="https://docs.stripe.com/billing/prices" target="_blank" rel="noopener noreferrer" className="underline">Ver documentação Stripe</a>.
                                </p>
                              ) : null}
                              {pricingError ? (
                                <p className="text-xs text-yellow-600 dark:text-yellow-400">{pricingError}</p>
                              ) : null}
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Benefícios dos planos</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-300">
                                  <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-100">Starter</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                      <li>60 RPM (Chat/TTS)</li>
                                      <li>200 requisições por dia</li>
                                      <li>Agentes incluídos: 5 (mensal) · +1 bônus no anual</li>
                                      <li>Agentes adicionais como add-on (preço por especialidade)</li>
                                      <li>Suporte básico por e-mail</li>
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-100">Pro</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                      <li>90 RPM (Chat/TTS)</li>
                                      <li>500 requisições por dia</li>
                                      <li>Agentes incluídos: 19 (mensal) · +2 bônus no anual</li>
                                      <li>Agentes adicionais como add-on (preço por especialidade)</li>
                                      <li>Suporte prioritário</li>
                                      <li>Recursos avançados e personalização</li>
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-100">Premium</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                      <li>120 RPM (Chat/TTS)</li>
                                      <li>1000 requisições por dia</li>
                                      <li>Agentes incluídos: 30 (mensal) · +3 bônus no anual</li>
                                      <li>Agentes adicionais como add-on (preço por especialidade)</li>
                                      <li>Suporte dedicado e consultoria</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => { trackEvent('header_billing_view', { cycle: selectedCycle, plan: selectedPlan }); navigate(`/billing?plan=${selectedPlan}&cycle=${selectedCycle}`); }}
                                className="w-full px-3 py-2 text-left rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                              >Ver página de Billing</button>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
                { plan !== 'free' && (
                  <IconButton
                    icon={CreditCard}
                    onClick={handleManageBilling}
                    tooltip="Gerenciar assinatura"
                    className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-800"
                  />
                )}
                <IconButton 
                    icon={theme === 'dark' ? Sun : Moon} 
                    onClick={toggleTheme} 
                    tooltip={theme === 'dark' ? "Modo Claro" : "Modo Escuro"} 
                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                />
                <IconButton 
                    icon={LogOut}
                    onClick={onLogout}
                    tooltip="Sair"
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800"
                />
            </div>
        </header>
    );
};

export default Header;
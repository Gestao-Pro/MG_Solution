
import React, { useEffect, useState } from 'react';
import { Menu, Sun, Moon, PenTool, Save, LogOut, Crown } from 'lucide-react'; // Import Save, Logout and Upgrade icons
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
        }
      })();
    }, [upgradeOpen]);
    const upgradeTo = async (target: 'starter'|'pro'|'premium') => {
      try {
        const monthlyPrice = target === 'starter'
          ? getEnv('VITE_STRIPE_PRICE_STARTER','')
          : target === 'pro'
            ? getEnv('VITE_STRIPE_PRICE_PRO','')
            : getEnv('VITE_STRIPE_PRICE_PREMIUM','');
        const yearlyPrice  = target === 'starter'
          ? getEnv('VITE_STRIPE_PRICE_STARTER_YEARLY','')
          : target === 'pro'
            ? getEnv('VITE_STRIPE_PRICE_PRO_YEARLY','')
            : getEnv('VITE_STRIPE_PRICE_PREMIUM_YEARLY','');
        const priceId = selectedCycle === 'year' ? (yearlyPrice || monthlyPrice) : monthlyPrice;
        if (!priceId) throw new Error('Preço do plano não configurado.');
        trackEvent('header_upgrade_click', { plan: target, cycle: selectedCycle });
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
                  <div className="relative">
                    <IconButton 
                      icon={Crown}
                      onClick={toggleUpgradeMenu}
                      tooltip="Upgrade"
                      className="text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-gray-800"
                    />
                    {upgradeOpen && (
                      <div className="absolute right-0 mt-2 w-64 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-3 space-y-2 z-50">
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
                        </div>
                        <div className="flex items-center justify-between text-xs mt-2">
                          <span className="text-gray-600 dark:text-gray-300">Plano</span>
                          <div className="inline-flex rounded overflow-hidden border border-gray-200 dark:border-gray-700">
                            <button
                              onClick={() => handlePlanSelect('starter')}
                              className={`px-2 py-1 ${selectedPlan === 'starter' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                            >Starter</button>
                            <button
                              onClick={() => handlePlanSelect('pro')}
                              className={`px-2 py-1 ${selectedPlan === 'pro' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                            >Pro</button>
                            <button
                              onClick={() => handlePlanSelect('premium')}
                              className={`px-2 py-1 ${selectedPlan === 'premium' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                            >Premium</button>
                          </div>
                        </div>
                        {selectedCycle === 'year' && (!starterYearlyConfigured || !proYearlyConfigured || !premiumYearlyConfigured) ? (
                          <p className="text-[11px] text-yellow-700 dark:text-yellow-400 mt-1">Planos anuais não configurados. Configure VITE_STRIPE_PRICE_*_YEARLY para habilitar.</p>
                        ) : null}
                        <div className="flex flex-col gap-2 mt-2">
                          <button
                            onClick={() => upgradeTo('starter')}
                            disabled={selectedCycle === 'year' ? !starterYearlyConfigured : !getEnv('VITE_STRIPE_PRICE_STARTER','')}
                            className={`w-full px-3 py-2 text-left rounded ${(selectedCycle === 'year' ? starterYearlyConfigured : !!getEnv('VITE_STRIPE_PRICE_STARTER','')) ? 'bg-yellow-600 text-white hover:bg-yellow-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                          >Starter — {selectedCycle === 'year' && pricing?.starterYearly ? formatAmount(pricing?.starterYearly?.amount, pricing?.starterYearly?.currency, 'year') : formatAmount(pricing?.starter?.amount, pricing?.starter?.currency, 'month')} · 60 RPM / 200 dia</button>
                          <button
                            onClick={() => upgradeTo('pro')}
                            disabled={selectedCycle === 'year' ? !proYearlyConfigured : !getEnv('VITE_STRIPE_PRICE_PRO','')}
                            className={`w-full px-3 py-2 text-left rounded ${(selectedCycle === 'year' ? proYearlyConfigured : !!getEnv('VITE_STRIPE_PRICE_PRO','')) ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                          >Pro — {selectedCycle === 'year' && pricing?.proYearly ? formatAmount(pricing?.proYearly?.amount, pricing?.proYearly?.currency, 'year') : formatAmount(pricing?.pro?.amount, pricing?.pro?.currency, 'month')} · 90 RPM / 500 dia</button>
                          <button
                            onClick={() => upgradeTo('premium')}
                            disabled={selectedCycle === 'year' ? !premiumYearlyConfigured : !getEnv('VITE_STRIPE_PRICE_PREMIUM','')}
                            className={`w-full px-3 py-2 text-left rounded ${(selectedCycle === 'year' ? premiumYearlyConfigured : !!getEnv('VITE_STRIPE_PRICE_PREMIUM','')) ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                          >Premium — {selectedCycle === 'year' && pricing?.premiumYearly ? formatAmount(pricing?.premiumYearly?.amount, pricing?.premiumYearly?.currency, 'year') : formatAmount(pricing?.premium?.amount, pricing?.premium?.currency, 'month')} · 120 RPM / 1000 dia</button>
                        </div>
                        {!getEnv('VITE_STRIPE_PRICE_STARTER','') || !getEnv('VITE_STRIPE_PRICE_PRO','') || !getEnv('VITE_STRIPE_PRICE_PREMIUM','') ? (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                            Configurar VITE_STRIPE_PRICE_STARTER/PRO/PREMIUM no <code>.env</code> para habilitar o upgrade.
                            {' '}
                            <a href="https://docs.stripe.com/billing/prices" target="_blank" rel="noopener noreferrer" className="underline">Ver documentação Stripe</a>.
                          </p>
                        ) : null}
                        {pricingError ? (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400">{pricingError}</p>
                        ) : null}
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Benefícios dos planos</p>
                          <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-300">
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
                    )}
                  </div>
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
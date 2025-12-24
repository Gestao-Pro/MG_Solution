import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ToastProvider';
import { getCheckoutSessionInfo, getEnv, openBillingPortal } from '@/services/billingService';
import { trackEvent, identifyUser, getOrCreateAnonId } from '@/services/analyticsService';
import { usePlan } from '@/contexts/PlanContext';
// removed react-query usage for debugging simplicity

const StripeSuccessPage: React.FC = () => {
  const { addToast } = useToast();
  const { setPlan, setCycle } = usePlan();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    if (!sessionId) {
      addToast('Sessão Stripe ausente.', 'error');
      navigate('/');
      return;
    }
    (async () => {
      try {
        const info = await getCheckoutSessionInfo(sessionId);
        localStorage.setItem('lastStripeSessionId', sessionId);
        // Map plan by priceId
        const envAny = (import.meta as any).env || {};
        const starterPrice = envAny.VITE_STRIPE_PRICE_STARTER || '';
        const proPrice = envAny.VITE_STRIPE_PRICE_PRO || '';
        const premiumPrice = envAny.VITE_STRIPE_PRICE_PREMIUM || '';
        const starterPriceYearly = envAny.VITE_STRIPE_PRICE_STARTER_YEARLY || '';
        const proPriceYearly = envAny.VITE_STRIPE_PRICE_PRO_YEARLY || '';
        const premiumPriceYearly = envAny.VITE_STRIPE_PRICE_PREMIUM_YEARLY || '';
        const priceId = info?.line_items?.[0]?.price?.id || info?.priceId || '';
        let plan = 'free';
        let cycle: 'monthly' | 'yearly' = 'monthly';
        if (priceId && (priceId === starterPrice || priceId === starterPriceYearly)) {
          plan = 'starter';
          cycle = priceId === starterPriceYearly ? 'yearly' : 'monthly';
        } else if (priceId && (priceId === proPrice || priceId === proPriceYearly)) {
          plan = 'pro';
          cycle = priceId === proPriceYearly ? 'yearly' : 'monthly';
        } else if (priceId && (priceId === premiumPrice || priceId === premiumPriceYearly)) {
          plan = 'premium';
          cycle = priceId === premiumPriceYearly ? 'yearly' : 'monthly';
        }
        console.log('Stripe session info:', info);
        console.log('Derived priceId:', priceId);
        console.log('Computed plan/cycle:', plan, cycle);
        localStorage.setItem('userPlan', plan);
        localStorage.setItem('userBillingCycle', cycle);
        const userId = (localStorage.getItem('userEmail') as string) || getOrCreateAnonId();
        try { identifyUser(userId, { plan }); } catch {}
        setPlan(plan as any);
        setCycle(cycle);
        try { trackEvent('purchase_success', { plan, priceId, userId }); } catch {}
        addToast('Assinatura confirmada. Plano aplicado.', 'success');
        navigate('/chat');
      } catch (e) {
        addToast('Erro ao confirmar assinatura.', 'error');
        navigate('/');
      }
    })();
  }, [location.search]);

  const envAny = (import.meta as any).env || {};
  console.log('VITE_STRIPE_PRICE_STARTER:', envAny.VITE_STRIPE_PRICE_STARTER);
  console.log('VITE_STRIPE_PRICE_PRO:', envAny.VITE_STRIPE_PRICE_PRO);
  console.log('VITE_STRIPE_PRICE_PREMIUM:', envAny.VITE_STRIPE_PRICE_PREMIUM);
  console.log('VITE_API_URL:', envAny.VITE_API_URL);
  console.log('All import.meta.env keys:', Object.keys(envAny));

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-3">
        <p className="text-gray-800 dark:text-gray-200">Processando confirmação de assinatura...</p>
        <button
          onClick={async () => {
            try {
              const url = await openBillingPortal();
              window.location.href = url;
            } catch (e) {
              addToast('Falha ao abrir portal de faturamento.', 'error');
            }
          }}
          className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Gerenciar assinatura
        </button>
      </div>
    </div>
  );
};

export default StripeSuccessPage;
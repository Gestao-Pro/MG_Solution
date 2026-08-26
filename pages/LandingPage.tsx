import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingHeader } from '../components/LandingHeader';
import { Hero } from '../components/Hero';
import { HowItWorks } from '../components/HowItWorks';
import SuperBossSection from '../components/SuperBossSection';
import AgentsSection from '../components/AgentsSection';
import UseCasesSection from '../components/UseCasesSection';
import DifferentialSection from '../components/DifferentialSection';
import { Features } from '../components/Features';
import DecisionCTA from '../components/DecisionCTA';
import Plans from '../components/Plans';
import { FAQ } from '../components/FAQ';
import { FinalCTA } from '../components/FinalCTA';
import { Footer } from '../components/Footer';
import Chatbot from '../components/Chatbot';
//import Cursor from '../components/Cursor';
import ParallaxBg from '../components/ParallaxBg';
import { useLandingAnimations } from '../hooks/useLandingAnimations';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const handleLoginClick = () => navigate('/login');

  // Ativa animações GSAP (hero + scroll reveal)
  useLandingAnimations();

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <ParallaxBg />
      <LandingHeader onLoginClick={handleLoginClick} />

      {/* 1. Hero */}
      <Hero onLoginClick={handleLoginClick} />

      {/* 2. Como funciona */}
      <HowItWorks />

      {/* 3. SuperBoss */}
      <SuperBossSection />

      {/* 4. Especialistas */}
      <AgentsSection />

      {/* 5. O que você pode perguntar à GestãoPro? */}
      <UseCasesSection />

      {/* 6. Mais do que um chatbot */}
      <DifferentialSection />

      {/* 7. O que você pode fazer com a GestãoPro? */}
      <Features />

      {/* 8. Antes de uma decisão importante... */}
      <DecisionCTA />

      {/* 9. Planos */}
      <Plans />

      {/* 10. FAQ */}
      <FAQ />

      {/* 11. CTA Final */}
      <FinalCTA onLoginClick={handleLoginClick} />

      <Footer />
      <Chatbot />
    </div>
  );
};

export default LandingPage;
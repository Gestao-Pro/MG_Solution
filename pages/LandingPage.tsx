import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingHeader } from '../components/LandingHeader';
import { Hero } from '../components/Hero';
import { HowItWorks } from '../components/HowItWorks';
import AgentsSection from '../components/AgentsSection';
import { Features } from '../components/Features';
import Plans from '../components/Plans';
import { FAQ } from '../components/FAQ';
import { FinalCTA } from '../components/FinalCTA';
import { Footer } from '../components/Footer';
import Chatbot from '../components/Chatbot';
import Cursor from '../components/Cursor';
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
      <Cursor />
      <LandingHeader onLoginClick={handleLoginClick} />
      <Hero onLoginClick={handleLoginClick} />
      <HowItWorks />
      <AgentsSection />
      <Features />
      <Plans />
      <FAQ />
      <FinalCTA onLoginClick={handleLoginClick} />
      <Footer />
      <Chatbot />
    </div>
  );
};

export default LandingPage;
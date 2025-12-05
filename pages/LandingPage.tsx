import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingHeader } from '../components/LandingHeader';
import { Hero } from '../components/Hero';
import { HowItWorks } from '../components/HowItWorks';
import AgentsSection from '../components/AgentsSection';
import { Features } from '../components/Features';
import Plans from '../components/Plans';
import { FAQ } from '../components/FAQ';
import { Footer } from '../components/Footer';
import Chatbot from '../components/Chatbot';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const handleLoginClick = () => navigate('/login');
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <LandingHeader onLoginClick={handleLoginClick} />
      <Hero onLoginClick={handleLoginClick} />
      <HowItWorks />
      <AgentsSection />
      <Features />
      <Plans />
      <FAQ />
      <Footer />
      <Chatbot />
    </div>
  );
};

export default LandingPage;
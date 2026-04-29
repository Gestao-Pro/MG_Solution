import React from 'react';
import { LightBulbIcon, ShareIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

interface StepCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const StepCard: React.FC<StepCardProps> = ({ icon: Icon, title, description }) => (
  <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700 text-center transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30">
    <div className="bg-indigo-600/20 p-4 rounded-full inline-flex items-center justify-center mb-6">
      <Icon className="h-8 w-8 text-indigo-400" />
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{description}</p>
  </div>
);

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: LightBulbIcon,
      title: "1. Apresente seu Desafio",
      description: "Descreva seu problema ou objetivo para o SuperBoss. Ele entenderá suas necessidades e o que precisa ser feito.",
    },
    {
      icon: ShareIcon,
      title: "2. Orquestração Inteligente",
      description: "O SuperBoss distribui a tarefa para os agentes de IA mais qualificados, que trabalharão em conjunto para encontrar a melhor solução.",
    },
    {
      icon: RocketLaunchIcon,
      title: "3. Receba a Solução",
      description: "Obtenha relatórios detalhados, planos de ação e insights valiosos, prontos para serem implementados no seu negócio.",
    },
  ];

  return (
    <section id="how-it-works" className="reveal py-12 bg-slate-950 text-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 text-indigo-400">Como o GestãoPro funciona</h2>
        <p className="text-base text-gray-300 mb-8 max-w-xl mx-auto">
          Em poucos passos, você organiza seu negócio e ganha mais produtividade no dia a dia.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StepCard 
            icon={LightBulbIcon} 
            title="1. Diga o que você precisa resolver" 
            description="Descreva sua tarefa, ideia ou problema de forma simples." 
          />
          <StepCard 
            icon={ShareIcon} 
            title="2. A IA organiza e sugere soluções" 
            description="Receba sugestões inteligentes para melhorar sua organização e produtividade." 
          />
          <StepCard 
            icon={RocketLaunchIcon} 
            title="3. Execute com mais rapidez" 
            description="Aplique as soluções e economize tempo no seu dia a dia." 
          />
        </div>
      </div>
    </section>
  );
};
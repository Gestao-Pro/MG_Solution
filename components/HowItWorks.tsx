import React from 'react';
import { LightBulbIcon, ShareIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

interface StepCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const StepCard: React.FC<StepCardProps> = ({ icon: Icon, title, description }) => (
  <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
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
    <section id="how-it-works" className="py-20 bg-slate-950 text-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold mb-6 text-indigo-400">Como a GestãoPro Funciona</h2>
        <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
          Transforme seus desafios em soluções eficientes em apenas três passos simples com a ajuda da nossa inteligência artificial.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <StepCard key={index} icon={step.icon} title={step.title} description={step.description} />
          ))}
        </div>
      </div>
    </section>
  );
};
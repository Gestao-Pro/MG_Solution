import React from 'react';
import { MagnifyingGlassIcon, UserGroupIcon, ScaleIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { FeatureCard } from './FeatureCard';

export const Features: React.FC = () => {
  const featureData = [
    {
      title: "Análise inteligente",
      description: "Entenda melhor problemas, cenários e oportunidades antes de tomar uma decisão.",
      icon: MagnifyingGlassIcon,
    },
    {
      title: "Recomendações especializadas",
      description: "Receba diferentes perspectivas de especialistas de IA para avaliar seus desafios.",
      icon: UserGroupIcon,
    },
    {
      title: "Decisões mais assertivas",
      description: "Avalie alternativas, riscos e oportunidades com mais clareza antes de escolher um caminho.",
      icon: ScaleIcon,
    },
    {
      title: "Melhoria contínua",
      description: "Aprenda com cada análise e refine suas estratégias ao longo do tempo.",
      icon: ArrowTrendingUpIcon,
    },
  ];

  return (
    <section id="features" className="reveal py-20 bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-indigo-400">Inteligência para cada decisão do seu negócio</h2>
        <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto">
          Ferramentas e especialistas de IA para ajudar você a analisar problemas, encontrar oportunidades e tomar decisões com mais clareza.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featureData.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
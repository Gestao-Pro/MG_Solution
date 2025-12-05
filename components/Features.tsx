import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { FeatureCard } from './FeatureCard';

const features = [
  {
    title: "Orquestração de IA",
    description: "O SuperBoss analisa seu problema e distribui as tarefas para os agentes de IA mais qualificados, garantindo uma solução completa e eficiente.",
    icon: CheckCircleIcon,
  },
  {
    title: "Agentes Especialistas",
    description: "Conte com agentes de IA especializados em diversas áreas como Estratégia, Vendas, Marketing, Pessoas, Processos e Finanças.",
    icon: CheckCircleIcon,
  },
  {
    title: "Soluções Personalizadas",
    description: "Cada desafio é único. Nossos agentes trabalham em conjunto para criar soluções sob medida para as necessidades específicas do seu negócio.",
    icon: CheckCircleIcon,
  },
  {
    title: "Otimização Contínua",
    description: "A GestãoPro aprende e se adapta. Nossos agentes otimizam continuamente seus processos para garantir os melhores resultados a longo prazo.",
    icon: CheckCircleIcon,
  },
];

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold mb-6 text-indigo-400">Recursos Poderosos para o Seu Negócio</h2>
        <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
          A GestãoPro combina a inteligência artificial mais avançada com uma orquestração inteligente para transformar a maneira como você gerencia sua empresa.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
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
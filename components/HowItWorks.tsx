import React from 'react';
import { LightBulbIcon, ShareIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface StepCardProps {
  icon: React.ElementType;
  step: string;
  title: string;
  description: string;
}

const StepCard: React.FC<StepCardProps> = ({ icon: Icon, step, title, description }) => (
  <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700 text-center transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30">
    <div className="text-indigo-400 text-xs font-bold tracking-widest uppercase mb-3">{step}</div>
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
      step: "01",
      title: "Apresente o desafio",
      description: "Conte à GestãoPro o problema, dúvida ou decisão que você precisa analisar.",
    },
    {
      icon: ShareIcon,
      step: "02",
      title: "Consulte os especialistas",
      description: "Os especialistas de IA analisam a situação sob diferentes perspectivas do negócio.",
    },
    {
      icon: DocumentTextIcon,
      step: "03",
      title: "Receba recomendações",
      description: "Receba análises, alternativas, riscos, oportunidades e recomendações para avaliar os possíveis caminhos.",
    },
    {
      icon: CheckCircleIcon,
      step: "04",
      title: "Você decide",
      description: "A decisão e a execução continuam sob seu controle. Você continua no comando.",
    },
  ];

  return (
    <section id="how-it-works" className="reveal py-12 bg-slate-950 text-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 text-indigo-400">Como a GestãoPro ajuda você a decidir melhor</h2>
        <p className="text-base text-gray-300 mb-8 max-w-2xl mx-auto">
          Você apresenta o desafio. A GestãoPro analisa diferentes perspectivas e apresenta recomendações para ajudar você a escolher o melhor caminho.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <StepCard
              key={step.step}
              icon={step.icon}
              step={step.step}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
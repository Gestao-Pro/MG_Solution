import React from 'react';
import { MagnifyingGlassIcon, ScaleIcon, SparklesIcon, MapIcon } from '@heroicons/react/24/outline';
import { FeatureCard } from './FeatureCard';

export const Features: React.FC = () => {
  const featureData = [
    {
      title: "🔎 Analisar",
      description: "Entenda melhor problemas, cenários, dados e oportunidades antes de tomar uma decisão.",
      icon: MagnifyingGlassIcon,
    },
    {
      title: "⚖️ Comparar",
      description: "Avalie diferentes alternativas, caminhos e estratégias antes de escolher.",
      icon: ScaleIcon,
    },
    {
      title: "🎯 Recomendar",
      description: "Receba recomendações especializadas baseadas no contexto apresentado por você.",
      icon: SparklesIcon,
    },
    {
      title: "📈 Planejar",
      description: "Estruture estratégias, próximos passos e possibilidades com mais clareza.",
      icon: MapIcon,
    },
  ];

  return (
    <section id="features" className="reveal py-20 bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-indigo-400">O que você pode fazer com a GestãoPro?</h2>
        <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto">
          Use especialistas de IA para analisar situações, comparar possibilidades e estruturar melhores decisões.
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
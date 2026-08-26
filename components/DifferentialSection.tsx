import React from 'react';
import { UserGroupIcon, LightBulbIcon, StarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface DifferentialPoint {
  icon: React.ElementType;
  title: string;
  description: string;
}

const PointCard: React.FC<DifferentialPoint> = ({ icon: Icon, title, description }) => (
  <div className="flex gap-4 items-start p-5 bg-slate-800/40 border border-slate-700 rounded-xl hover:border-indigo-500/30 transition-all duration-300">
    <div className="flex-shrink-0 bg-indigo-600/20 p-3 rounded-lg">
      <Icon className="h-6 w-6 text-indigo-400" />
    </div>
    <div>
      <h3 className="text-white font-bold mb-1">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);

export const DifferentialSection: React.FC = () => {
  const points: DifferentialPoint[] = [
    {
      icon: UserGroupIcon,
      title: "Especialistas por área",
      description: "Marketing, vendas, finanças, estratégia, pessoas, processos e outras áreas — cada um analisando sob sua perspectiva.",
    },
    {
      icon: LightBulbIcon,
      title: "Múltiplas perspectivas",
      description: "Um problema empresarial pode ser analisado por diferentes ângulos. Tenha visões complementares antes de decidir.",
    },
    {
      icon: StarIcon,
      title: "SuperBoss",
      description: "Um conselheiro estratégico que ajuda a conectar as diferentes perspectivas e orientar sua tomada de decisão.",
    },
    {
      icon: ShieldCheckIcon,
      title: "Você no controle",
      description: "As recomendações ajudam na decisão, mas a decisão final continua sendo sua. IA trabalhando ao seu lado, não no seu lugar.",
    },
  ];

  return (
    <section id="differential" className="reveal py-20 md:py-28 bg-slate-950 text-white">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Mais do que um chatbot de IA</h2>
          <p className="text-lg text-gray-400">
            A GestãoPro organiza especialistas de IA por áreas do negócio e permite que você consulte diferentes perspectivas para analisar seus desafios.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {points.map((point) => (
            <PointCard key={point.title} {...point} />
          ))}
        </div>
        <p className="text-center text-indigo-300 font-semibold mt-12 text-lg">
          Uma equipe de especialistas em IA pensando junto com você.
        </p>
      </div>
    </section>
  );
};

export default DifferentialSection;

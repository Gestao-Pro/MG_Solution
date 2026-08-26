import React from 'react';

interface UseCaseCardProps {
  area: string;
  areaColor: string;
  question: string;
  complement: string;
}

const UseCaseCard: React.FC<UseCaseCardProps> = ({ area, areaColor, question, complement }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col gap-3 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 h-full">
    <span className={`text-xs font-bold uppercase tracking-widest ${areaColor}`}>{area}</span>
    <p className="text-white font-semibold leading-snug text-base">"{question}"</p>
    <p className="text-gray-400 text-sm leading-relaxed mt-auto">{complement}</p>
  </div>
);

export const UseCasesSection: React.FC = () => {
  const cases: UseCaseCardProps[] = [
    {
      area: "Estratégia",
      areaColor: "text-indigo-400",
      question: "Devo expandir minha empresa agora ou fortalecer minha operação primeiro?",
      complement: "Analise cenários, riscos e oportunidades antes de decidir.",
    },
    {
      area: "Marketing",
      areaColor: "text-pink-400",
      question: "Por que minhas campanhas estão gerando vendas, mas minha margem caiu?",
      complement: "Analise possíveis causas e avalie alternativas estratégicas.",
    },
    {
      area: "Finanças",
      areaColor: "text-green-400",
      question: "Minha empresa está crescendo, mas o caixa está apertado. O que devo analisar?",
      complement: "Obtenha uma visão mais estruturada antes de tomar decisões financeiras.",
    },
    {
      area: "Vendas",
      areaColor: "text-yellow-400",
      question: "Minha equipe recebe muitos leads, mas a conversão está baixa. Onde pode estar o problema?",
      complement: "Analise possíveis gargalos e estratégias para melhorar os resultados.",
    },
    {
      area: "Pessoas",
      areaColor: "text-purple-400",
      question: "Devo contratar agora ou redistribuir as funções da equipe?",
      complement: "Avalie diferentes alternativas antes de decidir.",
    },
    {
      area: "Processos",
      areaColor: "text-cyan-400",
      question: "Onde estão os principais gargalos da minha operação?",
      complement: "Analise possíveis pontos de melhoria e receba recomendações.",
    },
  ];

  return (
    <section id="use-cases" className="reveal py-20 md:py-28 bg-slate-950 text-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            O que você pode perguntar à GestãoPro?
          </h2>
          <p className="text-lg text-gray-400">
            Antes de tomar uma decisão importante, apresente o contexto e consulte seus especialistas de IA.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {cases.map((c) => (
            <UseCaseCard key={c.area} {...c} />
          ))}
        </div>
        <p className="text-center text-indigo-300 font-semibold mt-12 text-base">
          Você apresenta o problema. A GestãoPro analisa e recomenda. Você decide.
        </p>
      </div>
    </section>
  );
};

export default UseCasesSection;

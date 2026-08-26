import React from 'react';
import { SUPERBOSS_AVATAR_URL } from '../constants';

const FlowStep: React.FC<{ label: string; last?: boolean }> = ({ label, last }) => (
  <div className="flex flex-col items-center">
    <div className="bg-slate-800 border border-indigo-500/40 text-indigo-300 font-semibold text-sm px-5 py-2 rounded-full shadow-md">
      {label}
    </div>
    {!last && (
      <div className="w-px h-5 bg-indigo-500/30 my-1" />
    )}
  </div>
);

export const SuperBossSection: React.FC = () => {
  return (
    <section id="superboss" className="reveal py-20 md:py-32 bg-slate-900 text-white overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Coluna texto */}
          <div className="lg:w-1/2">
            <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-3">
              Conselheiro Estratégico de IA
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Conheça o SuperBoss
            </h2>
            <p className="text-xl text-indigo-300 font-semibold mb-6">
              Seu conselheiro estratégico de IA
            </p>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              Você apresenta uma situação ou decisão importante. O SuperBoss entende o contexto, identifica quais especialistas podem contribuir e reúne diferentes perspectivas para ajudar você a tomar uma decisão mais assertiva.
            </p>
            <div className="inline-block bg-indigo-600/15 border border-indigo-500/30 rounded-xl px-6 py-4">
              <p className="text-indigo-200 font-bold text-lg italic">
                "Ele não decide por você. Ele ajuda você a decidir melhor."
              </p>
            </div>
          </div>

          {/* Coluna fluxo visual */}
          <div className="lg:w-1/2 flex flex-col items-center gap-0">
            {/* Avatar */}
            <div className="mb-6">
              <img
                src={SUPERBOSS_AVATAR_URL}
                alt="SuperBoss — Conselheiro Estratégico de IA"
                className="w-24 h-24 rounded-full border-4 border-indigo-500 shadow-2xl object-cover"
              />
            </div>

            {/* Fluxo */}
            <div className="flex flex-col items-center w-full max-w-xs">
              <FlowStep label="Você apresenta o desafio" />
              <FlowStep label="SuperBoss" />
              <div className="grid grid-cols-3 gap-2 my-2 w-full">
                {['Estratégia', 'Finanças', 'Marketing', 'Vendas', 'Pessoas', 'Processos'].map((area) => (
                  <div
                    key={area}
                    className="bg-slate-800/70 border border-slate-700 text-gray-300 text-xs text-center px-2 py-1.5 rounded-lg"
                  >
                    {area}
                  </div>
                ))}
              </div>
              <div className="w-px h-5 bg-indigo-500/30 my-1" />
              <FlowStep label="Análises e perspectivas" />
              <FlowStep label="Recomendação" />
              <FlowStep label="Você decide" last />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default SuperBossSection;

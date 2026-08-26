import React from 'react';

export const DecisionCTA: React.FC = () => {
  return (
    <section className="reveal py-16 bg-slate-900 text-white border-y border-slate-800">
      <div className="container mx-auto px-6 text-center max-w-3xl">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
          Antes de uma decisão importante, consulte seus especialistas.
        </h2>
        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
          Uma contratação. Uma nova campanha. Uma expansão. Um investimento. Uma mudança de preço. Um novo produto. Um problema financeiro.
        </p>
        <p className="text-indigo-300 font-semibold text-lg mb-6">
          Apresente o contexto. Analise as possibilidades. Avalie os riscos. Receba recomendações. Decida.
        </p>
        <p className="text-white font-bold text-xl tracking-wide">
          Você continua no comando.
        </p>
      </div>
    </section>
  );
};

export default DecisionCTA;

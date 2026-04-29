import React from 'react';

export const FinalCTA: React.FC<{ onLoginClick?: () => void }> = ({ onLoginClick }) => {
  return (
    <section className="reveal py-20 bg-indigo-600 text-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Comece a organizar seu negócio hoje
        </h2>
        <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
          Use inteligência artificial para ganhar tempo, ter mais controle e crescer com mais eficiência.
        </p>
        <button
          onClick={onLoginClick}
          className="bg-white text-indigo-600 font-bold py-4 px-10 rounded-full text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-2xl"
        >
          Começar grátis agora
        </button>
      </div>
    </section>
  );
};

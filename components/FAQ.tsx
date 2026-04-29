import React, { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="faq-item border-b border-slate-700 py-4">
      <button
        className="flex justify-between items-center w-full text-left text-lg font-semibold text-white focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        {question}
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <p className="mt-2 text-gray-300 leading-relaxed">
          {answer}
        </p>
      )}
    </div>
  );
};

export const FAQ: React.FC = () => {
  const faqs = [
    {
      question: "Preciso saber usar Inteligência Artificial?",
      answer: "Não! O GestãoPro foi feito para ser simples e intuitivo. Você conversa com a IA de forma natural, como se estivesse falando com um consultor.",
    },
    {
      question: "Funciona para pequenos negócios?",
      answer: "Com certeza. A plataforma foi desenhada especificamente para atender MEIs, micro e pequenas empresas que precisam de organização e eficiência.",
    },
    {
      question: "Consigo usar sozinho?",
      answer: "Sim. A ferramenta orienta você em cada passo, sugerindo soluções e planos de ação práticos para o seu dia a dia.",
    },
    {
      question: "Em quanto tempo vejo resultados?",
      answer: "Muitos usuários percebem ganho de tempo e clareza logo no primeiro dia, ao organizar suas tarefas e receber as primeiras orientações estratégicas.",
    },
    {
      question: "Serve para o meu tipo de negócio?",
      answer: "Sim. Nossos agentes cobrem áreas universais como Vendas, Marketing, Finanças e Processos, adaptando as sugestões à sua realidade específica.",
    },
  ];

  return (
    <section id="faq" className="reveal py-20 bg-slate-950 text-white">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-indigo-400">Perguntas Frequentes</h2>
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
};
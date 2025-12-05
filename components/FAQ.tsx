import React, { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-700 py-4">
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
      question: "O que é a GestãoPro?",
      answer: "A GestãoPro é uma plataforma de gestão inteligente que utiliza inteligência artificial para otimizar processos e auxiliar na tomada de decisões estratégicas para pequenas e médias empresas.",
    },
    {
      question: "Como o SuperBoss funciona?",
      answer: "O SuperBoss é o nosso orquestrador de IA. Ele analisa o seu problema, identifica as necessidades e distribui as tarefas para os agentes de IA mais qualificados, garantindo uma solução completa e eficiente.",
    },
    {
      question: "Quais tipos de agentes de IA a GestãoPro oferece?",
      answer: "Oferecemos agentes especializados em diversas áreas, como Estratégia, Vendas, Marketing, Pessoas, Processos e Finanças. Cada um é treinado para resolver desafios específicos da sua área.",
    },
    {
      question: "A GestãoPro é adequada para o meu tipo de negócio?",
      answer: "Sim! A GestãoPro é ideal para MEIs, micro e pequenas empresas que buscam otimizar sua gestão, aumentar a produtividade e tomar decisões mais assertivas com o apoio da inteligência artificial.",
    },
    {
      question: "Como posso começar a usar a GestãoPro?",
      answer: "É simples! Clique no botão 'Comece Agora' em nossa página, preencha o formulário de contato e nossa equipe entrará em contato para apresentar uma solução personalizada para o seu negócio.",
    },
  ];

  return (
    <section id="faq" className="py-20 bg-slate-950 text-white">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-indigo-400">Perguntas Frequentes</h2>
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
};
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
      question: "Então, o que a GestãoPro realmente faz?",
      answer: "A GestãoPro funciona como uma equipe de especialistas de IA e um conselheiro estratégico. Você apresenta um problema, dúvida ou decisão; os especialistas analisam o contexto, apresentam diferentes perspectivas e recomendações, e você utiliza essas informações para tomar a decisão final.",
    },
    {
      question: "Preciso saber usar Inteligência Artificial?",
      answer: "Não! A GestãoPro foi feita para ser simples e intuitiva. Você apresenta seu desafio de forma natural, como se estivesse consultando um especialista, e recebe análises e recomendações prontas para avaliar.",
    },
    {
      question: "Funciona para pequenos negócios?",
      answer: "Com certeza. A plataforma foi desenhada especificamente para atender MEIs, micro e pequenas empresas que precisam de análise, orientação estratégica e apoio na tomada de decisões.",
    },
    {
      question: "Consigo usar sozinho?",
      answer: "Sim. Os especialistas da GestãoPro orientam você em cada análise, apresentando perspectivas e recomendações práticas para apoiar suas decisões no dia a dia.",
    },
    {
      question: "A GestãoPro toma decisões sozinha?",
      answer: "Não. A GestãoPro foi desenvolvida para apoiar o empresário na tomada de decisões. Seus especialistas analisam situações, identificam oportunidades, avaliam alternativas e apresentam recomendações. A decisão final é sempre do usuário.",
    },
    {
      question: "A GestãoPro executa processos automaticamente?",
      answer: "Não. A GestãoPro não é uma plataforma de automação de processos empresariais. Seu papel é oferecer inteligência, análise e recomendações para ajudar você a decidir com mais segurança e assertividade.",
    },
    {
      question: "A GestãoPro substitui meu ERP?",
      answer: "Não. A GestãoPro não tem como objetivo substituir seu ERP ou os sistemas operacionais da empresa. Ela atua como uma camada de inteligência e aconselhamento para ajudar você a analisar informações e tomar decisões melhores.",
    },
    {
      question: "A GestãoPro substitui o empresário?",
      answer: "Não. A GestãoPro foi criada para ampliar a capacidade de análise do empresário, não para substituí-lo. A IA oferece conhecimento, perspectivas e recomendações. Você continua no comando.",
    },
    {
      question: "Serve para o meu tipo de negócio?",
      answer: "Sim. Os especialistas cobrem áreas universais como Vendas, Marketing, Finanças, Estratégia, Processos e Pessoas, adaptando as análises e recomendações à sua realidade específica.",
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
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { SUPERBOSS_AVATAR_URL } from '../constants';

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, text: "Olá! 👋 Sou o SuperBoss, o orquestrador de IA da GestãoPro. Como posso ajudar você hoje?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const FALLBACK_SVG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#6366f1"/>
            <stop offset="100%" stop-color="#0ea5e9"/>
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="32" fill="url(#g)"/>
        <text x="50%" y="54%" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#ffffff" text-anchor="middle">SB</text>
      </svg>`
    );

  const setFallback = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const t = e.target as HTMLImageElement;
    if (t.src !== FALLBACK_SVG) {
      t.src = FALLBACK_SVG;
    }
  };
  
  const getBotResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    if (lowerInput.includes('preço') || lowerInput.includes('valor')) {
      return "Para informações sobre preços e planos, por favor, clique no botão 'Comece Agora' e preencha o formulário de contato. Nossa equipe entrará em contato com uma proposta personalizada!";
    }
    if (lowerInput.includes('agentes')) {
      return "Temos agentes especialistas em Estratégia, Vendas, Marketing, Pessoas, Processos e Finanças. Cada um é treinado para resolver desafios específicos da sua área. Você pode conhecer todos na seção 'Agentes' da página.";
    }
    if (lowerInput.includes('superboss')) {
        return "Eu sou o SuperBoss! Minha função é analisar seu problema e distribuir as tarefas para os agentes mais qualificados, garantindo uma solução completa e eficiente."
    }
    if (lowerInput.includes('olá') || lowerInput.includes('oi')) {
        return "Olá! É um prazer conversar com você. Tem alguma dúvida sobre a GestãoPro?"
    }
    return "Desculpe, não entendi sua pergunta. Você poderia tentar reformular? Você pode perguntar sobre 'preços', 'agentes' ou sobre mim, o 'SuperBoss'.";
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
    };
    setMessages(prev => [...prev, userMessage]);
    
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: Date.now() + 1,
        text: getBotResponse(inputValue),
        sender: 'bot'
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);

    setInputValue('');
  };

  return (
    <>
      <div className={`fixed bottom-8 right-8 transition-all duration-300 ${isOpen ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-800 rounded-full w-20 h-20 flex items-center justify-center shadow-2xl hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transform hover:scale-110 transition-all duration-300"
          aria-label="Abrir chat"
        >
          <img src={SUPERBOSS_AVATAR_URL} alt="Abrir Chat" className="w-16 h-16 rounded-full object-cover" onError={setFallback} />
        </button>
      </div>

      <div className={`fixed bottom-8 right-8 w-[calc(100%-4rem)] max-w-sm h-[70vh] max-h-[600px] bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <header className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={SUPERBOSS_AVATAR_URL} alt="SuperBoss Avatar" className="w-10 h-10 rounded-full" onError={setFallback} />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
            </div>
            <div>
              <h3 className="font-bold text-white">SuperBoss</h3>
              <p className="text-xs text-gray-400">Assistente GestãoPro</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white" aria-label="Fechar chat">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex flex-col gap-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-700 text-gray-200 rounded-bl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
             <div ref={chatEndRef} />
          </div>
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 pl-4 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 rounded-md text-white hover:bg-indigo-700 disabled:bg-slate-600" disabled={!inputValue.trim()}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Chatbot;
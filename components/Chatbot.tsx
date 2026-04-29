import React, { useState, useRef, useEffect } from 'react';
// Definimos um tipo local simples para o mini chat do SuperBoss
interface ChatMessage {
  id: number;
  text: string;
  sender: 'bot' | 'user';
}
import { SUPERBOSS_AVATAR_URL, AGENTS } from '../constants';

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, text: "Olá! 👋 Sou o SuperBoss, o orquestrador de IA da GestãoPro. Como posso ajudar você hoje?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<null | HTMLDivElement>(null);
  const typingIntervalRef = useRef<number | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingMessageId, setTypingMessageId] = useState<number | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, []);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === '' || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
    };
    
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInputValue('');
    setIsTyping(true);

    const animateBotReply = (fullText: string) => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      const botId = Date.now() + 1;
      setMessages(prev => [...prev, { id: botId, text: '', sender: 'bot' }]);
      const delay = fullText.length > 180 ? 15 : 30;
      let i = 0;
      setTypingMessageId(botId);
      typingIntervalRef.current = window.setInterval(() => {
        i++;
        setMessages(prev => prev.map(m => m.id === botId ? { ...m, text: fullText.slice(0, i) } : m));
        if (i >= fullText.length) {
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
          setIsTyping(false);
          setTypingMessageId(null);
        }
      }, delay);
    };

    try {
      const response = await fetch('/api/ai/public-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.text,
          chatHistory: messages.slice(-6)
        }),
      });

      if (response.status === 429) {
        animateBotReply("Muitas mensagens enviadas! Por favor, aguarde um minuto antes de continuar.");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }
      
      const data = await response.json();
      animateBotReply(data.text || "Desculpe, tive um problema técnico. Pode repetir?");
    } catch (error: any) {
      console.error('Chat Error:', error);
      animateBotReply(`Erro: ${error.message}. Verifique se a GEMINI_API_KEY no Vercel está correta e faça um Redeploy.`);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div className={`fixed bottom-8 right-8 z-50 transition-all duration-300 ${isOpen ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
        <div className="relative">
          {!isOpen && (
            <div className="absolute bottom-[calc(100%+1.25rem)] left-1/2 -translate-x-1/2 inline-block bg-gradient-to-r from-indigo-600 to-sky-500 text-white text-xs md:text-sm font-medium px-3 py-1 leading-snug rounded-xl shadow-2xl ring-1 ring-white/20 backdrop-blur-sm animate-pulse pointer-events-none text-center w-[130px]">
              <span className="block whitespace-nowrap">Olá! Tire suas</span>
              <span className="block whitespace-nowrap">dúvidas comigo</span>
              <span className="absolute left-1/2 -translate-x-1/2 bottom-[-0.9rem] w-2 h-2 bg-indigo-600 rotate-45 shadow-md"></span>
            </div>
          )}
          <button
            onClick={() => setIsOpen(true)}
            className="chatbot-float bg-slate-800 rounded-full w-20 h-20 flex items-center justify-center shadow-2xl hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transform hover:scale-110 transition-all duration-300"
            aria-label="Abrir chat"
          >
            <img src={SUPERBOSS_AVATAR_URL} alt="Abrir Chat" className="w-16 h-16 rounded-full object-cover" onError={setFallback} />
          </button>
        </div>
      </div>

      <div className={`fixed bottom-8 right-8 w-[calc(100%-4rem)] max-w-sm h-[70vh] max-h-[600px] bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <header className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <img src={SUPERBOSS_AVATAR_URL} alt="SuperBoss" className="w-full h-full rounded-full object-cover border border-indigo-500/50" onError={setFallback} />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full"></span>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">SuperBoss Chat</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Online agora</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white" aria-label="Fechar chat">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 p-4 overflow-y-auto gp-scroll">
          <div className="flex flex-col gap-4">
            {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {(() => {
                const isTypingMsg = typingMessageId === msg.id && msg.sender === 'bot';
                const bubbleBase = 'max-w-[80%] p-3 rounded-2xl';
                const userBubble = 'bg-indigo-600 text-white rounded-br-none';
                const botBubble = `relative overflow-hidden rounded-bl-none ${isTypingMsg ? 'animate-pulse' : ''} bg-gradient-to-r from-indigo-600 to-sky-500 text-white ring-1 ring-white/15 shadow-2xl shadow-indigo-900/30 backdrop-blur-sm`;
                return (
                  <div className={`${bubbleBase} ${msg.sender === 'user' ? userBubble : botBubble}`}>
                    <span>{msg.text}</span>
                    {isTypingMsg && (
                      <span className="inline-block align-middle ml-1 w-[1px] h-4 bg-white/80"></span>
                    )}
                  </div>
                );
              })()}
            </div>
            ))}
             <div ref={chatEndRef} />
          </div>
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e as any);
                }
              }}
              placeholder="Digite sua mensagem..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 pl-4 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isTyping}
            />
            <button 
              type="submit" 
              className="absolute right-2 z-10 p-2 bg-indigo-600 rounded-md text-white hover:bg-indigo-700 disabled:bg-slate-700 disabled:opacity-50 transition-all" 
              disabled={!inputValue.trim() || isTyping}
              aria-label="Enviar mensagem"
            >
              {isTyping ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Chatbot;

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
  
  const getBotResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    const normalized = lowerInput.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const hasPlanWord = /\b(starter|pro|premium)\b/.test(lowerInput);
    const hasPlan = lowerInput.includes('plano') || lowerInput.includes('planos') || hasPlanWord;
    const hasPrice = lowerInput.includes('preço') || lowerInput.includes('valor') || lowerInput.includes('preços') || lowerInput.includes('valores');
    const hasAgents = lowerInput.includes('agentes') || lowerInput.includes('avatar') || lowerInput.includes('especialistas');
    const hasCount = lowerInput.includes('quantos') || lowerInput.includes('quantidade') || lowerInput.includes('qtd');
    const hasCycle = lowerInput.includes('mensal') || lowerInput.includes('anual') || lowerInput.includes('ano') || lowerInput.includes('mês');
    const wantsChangePlan = lowerInput.includes('mudar') || lowerInput.includes('trocar') || lowerInput.includes('upgrade') || lowerInput.includes('downgrade') || lowerInput.includes('alterar');
    const asksBossRole = lowerInput.includes('função') || lowerInput.includes('o que você faz') || lowerInput.includes('o que vc faz') || lowerInput.includes('quem é você') || lowerInput.includes('seu papel') || lowerInput.includes('sua missão');
    const asksAgentFunctions = lowerInput.includes('cada agente') || lowerInput.includes('função dos agentes') || lowerInput.includes('o que fazem os agentes') || lowerInput.includes('o que cada um faz') || (lowerInput.includes('o que') && hasAgents);
    const asksHelp = lowerInput.includes('ajuda') || lowerInput.includes('ajudar') || lowerInput.includes('me ajudar') || lowerInput.includes('problema') || lowerInput.includes('desafio') || lowerInput.includes('empresa');
    const asksHowHelp = (lowerInput.includes('como') && (lowerInput.includes('ajuda') || lowerInput.includes('ajudar'))) || lowerInput.includes('como você pode me ajudar') || lowerInput.includes('como pode me ajudar');
    const asksWhatGP = lowerInput.includes('gestãopro') || lowerInput.includes('gestao pro') || lowerInput.includes('gestão pro') || (lowerInput.includes('o que') && (lowerInput.includes('gestão') || lowerInput.includes('gestao')));
    const asksBenefits = lowerInput.includes('benefício') || lowerInput.includes('beneficios') || lowerInput.includes('vantagem') || lowerInput.includes('vantagens') || lowerInput.includes('benefits') || lowerInput.includes('como funciona');
    const asksPrivacy = lowerInput.includes('privacidade') || lowerInput.includes('lgpd') || lowerInput.includes('gdpr') || lowerInput.includes('segurança') || lowerInput.includes('security') || lowerInput.includes('dados');
    const asksIntegrations = lowerInput.includes('integra') || lowerInput.includes('integração') || lowerInput.includes('integrações') || lowerInput.includes('api') || lowerInput.includes('crm') || lowerInput.includes('whatsapp') || lowerInput.includes('excel') || lowerInput.includes('planilha') || lowerInput.includes('google') || lowerInput.includes('drive');
    const asksTrial = lowerInput.includes('teste') || lowerInput.includes('demo') || lowerInput.includes('demonstração') || lowerInput.includes('experimente') || lowerInput.includes('prova');
    const asksCancel = lowerInput.includes('cancelar') || lowerInput.includes('cancelamento') || lowerInput.includes('reembolso') || lowerInput.includes('refund');
    const asksSupport = lowerInput.includes('suporte') || lowerInput.includes('contato') || lowerInput.includes('atendimento') || lowerInput.includes('falar com alguém');
    const asksLimits = lowerInput.includes('limite') || lowerInput.includes('limites') || lowerInput.includes('quota') || lowerInput.includes('cota') || lowerInput.includes('uso') || lowerInput.includes('recursos');
    const asksSla = lowerInput.includes('sla') || lowerInput.includes('disponibilidade') || lowerInput.includes('uptime') || lowerInput.includes('tempo de resposta');
    const asksLanguages = lowerInput.includes('idioma') || lowerInput.includes('língua') || lowerInput.includes('lingua') || lowerInput.includes('português') || lowerInput.includes('ingles') || lowerInput.includes('inglês');
    const asksTeam = lowerInput.includes('equipe') || lowerInput.includes('usuários') || lowerInput.includes('usuarios') || lowerInput.includes('assentos') || lowerInput.includes('membros');
    const asksRoi = lowerInput.includes('roi') || lowerInput.includes('retorno') || lowerInput.includes('resultados') || lowerInput.includes('casos') || lowerInput.includes('case') || lowerInput.includes('sucesso');
    const asksStrategy = lowerInput.includes('estratégia') || lowerInput.includes('estrategia') || lowerInput.includes('planejamento') || lowerInput.includes('okrs') || lowerInput.includes('bi');
    const asksSales = lowerInput.includes('vendas') || lowerInput.includes('comercial') || lowerInput.includes('prospecção') || lowerInput.includes('prospeccao') || lowerInput.includes('crm') || lowerInput.includes('negociação') || lowerInput.includes('negociacao');
    const asksMarketing = lowerInput.includes('marketing') || lowerInput.includes('campanha') || lowerInput.includes('tráfego') || lowerInput.includes('trafego') || lowerInput.includes('conteúdo') || lowerInput.includes('conteudo') || lowerInput.includes('mídia') || lowerInput.includes('midia');
    const asksPeople = lowerInput.includes('pessoas') || lowerInput.includes('rh') || lowerInput.includes('recrutamento') || lowerInput.includes('onboarding') || lowerInput.includes('cultura') || lowerInput.includes('desempenho') || lowerInput.includes('clima');
    const asksProcesses = lowerInput.includes('processos') || lowerInput.includes('sop') || lowerInput.includes('padronização') || lowerInput.includes('padronizacao') || lowerInput.includes('automação') || lowerInput.includes('automacao') || lowerInput.includes('workflow') || lowerInput.includes('fluxo');
    const asksFinance = lowerInput.includes('finanças') || lowerInput.includes('financas') || lowerInput.includes('financeiro') || lowerInput.includes('caixa') || lowerInput.includes('fluxo de caixa') || lowerInput.includes('dre') || lowerInput.includes('precificação') || lowerInput.includes('precificacao') || lowerInput.includes('orçamento') || lowerInput.includes('orcamento');
    const hasShortGreeting =
      normalized.includes('ola') ||
      normalized.includes('oi') ||
      normalized.includes('e ai') ||
      normalized.includes('eai') ||
      normalized.includes('tudo bem') ||
      normalized.includes('bom dia') ||
      normalized.includes('boa tarde') ||
      normalized.includes('boa noite') ||
      normalized.includes('salve') ||
      normalized.includes('fala') ||
      normalized.includes('opa') ||
      normalized.includes('beleza') ||
      normalized.includes('blz');
    const wordCount = lowerInput.trim().split(/\s+/).length;
    const onlyGreeting = hasShortGreeting && wordCount <= 4 && !(
      hasPlan || hasPrice || hasAgents || hasCount || hasCycle || wantsChangePlan ||
      asksBossRole || asksAgentFunctions || asksHelp || asksHowHelp || asksWhatGP ||
      asksBenefits || asksPrivacy || asksIntegrations || asksTrial || asksCancel ||
      asksSupport || asksLimits || asksSla || asksLanguages || asksTeam || asksRoi ||
      asksStrategy || asksSales || asksMarketing || asksPeople || asksProcesses || asksFinance
    );

    const buildAgentSummary = (): string => {
      const byArea: Record<string, { name: string; specialty: string }[]> = {};
      for (const a of AGENTS) {
        const key = a.area || 'Geral';
        if (!byArea[key]) byArea[key] = [];
        byArea[key].push({ name: a.name, specialty: a.specialty });
      }
      const lines: string[] = [];
      for (const area of Object.keys(byArea)) {
        const list = byArea[area].map(x => `${x.name} — ${x.specialty}`).join('; ');
        lines.push(`${area}: ${list}`);
      }
      return `Nossos agentes e funções:\n${lines.join('\n')}\nVocê pode conhecer todos na seção 'Agentes' da página.`;
    };

    if (hasPrice || hasPlan) {
      return "Oferecemos 3 planos: Starter, Pro e Premium, com opções mensal e anual. Para ver valores e comparar benefícios, visite a seção 'Planos' ou clique em 'Comece Agora' para que nossa equipe envie uma proposta adequada ao seu contexto.";
    }
    if (asksWhatGP) {
      return "A GestãoPro é uma plataforma de IA com o SuperBoss e agentes especialistas (Estratégia, Vendas, Marketing, Pessoas, Processos, Finanças). Você traz o objetivo; nós diagnosticamos, criamos um plano de ação e executamos com os agentes certos.";
    }
    if (asksBenefits) {
      return "Principais benefícios: diagnóstico rápido; plano de ação personalizado; especialistas por área; usa seus documentos e dados; acompanha execução e consolida resultados.";
    }
    if (asksPrivacy) {
      return "Tratamos seus dados com segurança e conformidade (LGPD/GDPR), conexões criptografadas e controle do que você compartilha.";
    }
    if (asksIntegrations) {
      return "Integramos por arquivos (PDF, Excel, DOCX) e via API. CRM/Drive/WhatsApp podem ser conectados sob demanda.";
    }
    if (asksTrial) {
      return "Você pode testar na landing e solicitar uma demonstração. Clique em 'Comece Agora' para começar.";
    }
    if (asksCancel) {
      return "Você pode cancelar a qualquer momento. Reembolso segue as condições do plano contratado.";
    }
    if (asksSupport) {
      return "Oferecemos suporte por chat e e-mail. Abrimos chamados e acompanhamos até a resolução.";
    }
    if (asksLimits) {
      return "Há limites diários por recurso e plano. Avisamos quando você se aproxima do limite e oferecemos alternativas.";
    }
    if (asksSla) {
      return "Priorizamos alta disponibilidade e tempo de resposta consistente. O SLA varia conforme o plano.";
    }
    if (asksLanguages) {
      return "Suportamos conversas em português e inglês. Documentos em PT e EN são aceitos.";
    }
    if (asksTeam) {
      return "Planos permitem múltiplos usuários na equipe. A gestão é feita no Portal de cobrança.";
    }
    if (asksRoi) {
      return "Apresentamos exemplos e estimativas de ROI conforme seu contexto. Fale com nosso time para detalhes.";
    }
    if (asksStrategy) {
      return "Em Estratégia: definimos metas, um plano claro, BI para indicadores e iniciativas de inovação.";
    }
    if (asksSales) {
      return "Em Vendas: melhoramos prospecção, roteiro consultivo, cadências no CRM e negociação para fechar mais.";
    }
    if (asksMarketing) {
      return "Em Marketing: público e mensagem, canais, orçamento, testes A/B e métricas da campanha.";
    }
    if (asksPeople) {
      return "Em Pessoas: organizar equipe, descrições de cargo, onboarding, rotinas e indicadores de clima e desempenho.";
    }
    if (asksProcesses) {
      return "Em Processos: mapear fluxos, padronizar SOPs, automatizar etapas e acompanhar eficiência.";
    }
    if (asksFinance) {
      return "Em Finanças: fluxo de caixa, precificação, DRE simples, metas e controles práticos.";
    }
    if (hasAgents && hasCount && lowerInput.includes('starter')) {
      return "No plano Starter você tem acesso aos agentes essenciais da sua área. A quantidade varia conforme a área escolhida. Na seção 'Agentes' você vê quais estão habilitados para seu plano e pode testar cada um.";
    }
    if (wantsChangePlan && hasPlan) {
      return "Sim, você pode mudar de plano. Se já é cliente, use a área de cobrança (Portal) para upgrade ou solicite pelo suporte. Se está começando, clique em 'Comece Agora' e informe o plano desejado.";
    }
    if (asksAgentFunctions) {
      return buildAgentSummary();
    }
    if (asksHowHelp) {
      return "Eu. e toda a equipe do GestãoPro estamos aqui para ajudar você nos desafios diários da sua empresa: analiso sua situação e proponho soluções práticas e eficientes. Você tem mais alguma dúvida?";
    }
    if (asksHelp) {
      return "Sim. Ajudo nos desafios diários da sua empresa: analiso sua situação e proponho soluções práticas. Posso ajudar am mais alguma dúvida?";
    }
    if (asksBossRole || lowerInput.includes('superboss')) {
      return "Eu sou o SuperBoss, o orquestrador dos agentes. Analiso seus desafios e objetivos e distribuo tarefas para os especialistas certos, acompanhando execução e consolidando resultados para você.";
    }
    if (hasAgents) {
      return "Temos agentes especialistas em Estratégia, Vendas, Marketing, Pessoas, Processos e Finanças. Cada um resolve desafios específicos da sua área. Conheça todos na seção 'Agentes' da página.";
    }
    if (onlyGreeting) {
      const greetings = ["Olá!", "Oi!", "E aí!", "Tudo bem?"];
      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
      return `${randomGreeting} Em que posso ajudar hoje?`;
    }
    return "Desculpe, não entendi sua pergunta. Você pode perguntar sobre planos, preços, agentes ou sobre o SuperBoss.";
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
    
    const animateBotReply = (fullText: string) => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      const botId = Date.now() + 1;
      setMessages(prev => [...prev, { id: botId, text: '', sender: 'bot' }]);
      const delay = fullText.length > 180 ? 18 : 36;
      let i = 0;
      setIsTyping(true);
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
    setTimeout(() => {
      const reply = getBotResponse(inputValue);
      animateBotReply(reply);
    }, 600);

    setInputValue('');
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

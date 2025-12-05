import React, { useRef, useState } from 'react';
import { AGENTS, VIDEO_IDS, AGENT_AREAS } from '../constants';
import { Agent } from '../types';
import AnimatedElement from './AnimatedElement';
import Avatar from './Avatar';

const AgentCard: React.FC<{ agent: Agent }> = ({ agent }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const videoId = VIDEO_IDS[agent.id];
  const prefersReducedMotion = typeof window !== 'undefined' && 'matchMedia' in window
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  const originParam = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${prefersReducedMotion ? 0 : 1}&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${videoId}&enablejsapi=1&origin=${encodeURIComponent(originParam)}`
    : '';

  const handleEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (!videoId) return;
    setShowPreview(true);
  };

  const handleLeave = () => {
    if (!videoId) return;
    setShowPreview(false);
    setIsMuted(true);
  };

  const handleCardLeave: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const nextTarget = e.relatedTarget as EventTarget | null;
    const nextNode = (typeof Node !== 'undefined' && nextTarget instanceof Node) ? nextTarget : null;
    if (nextNode && popoverRef.current?.contains(nextNode)) {
      return;
    }
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      handleLeave();
      closeTimeoutRef.current = null;
    }, 120);
  };

  const handleToggleClick = () => {
    if (!videoId) return;
    setShowPreview(prev => !prev);
  };

  const handleUnmute = () => {
    // Usa a API do YouTube via postMessage para ativar som e tocar o vídeo
    try {
      const target = iframeRef.current?.contentWindow;
      if (target) {
        target.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*');
        target.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }), '*');
        target.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
      }
    } catch {}
    setIsMuted(false);
  };

  return (
    <div
      ref={cardRef}
      className="relative bg-slate-800/60 p-6 rounded-xl border border-slate-700 text-center transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-900/50 transform hover:-translate-y-2 h-full"
      onPointerEnter={handleEnter}
      onPointerLeave={handleCardLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      onClick={handleToggleClick}
      tabIndex={0}
      aria-label={`Mostrar prévia do vídeo do agente ${agent.name}`}
    >
      <div className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-slate-600 overflow-hidden">
        <Avatar agent={agent} />
      </div>
      <h3 className="text-xl font-bold text-white">{agent.name}</h3>
      <p className="text-indigo-400 text-sm font-medium mb-2">{agent.area}</p>
      <p className="text-gray-400 text-sm">{agent.specialty}</p>

      {videoId && (
        <div
          ref={popoverRef}
          onPointerLeave={handleLeave}
          className={`absolute inset-0 -m-2 z-50 flex items-center justify-center transition-opacity duration-100 ease-out ${
            showPreview ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className={`bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden px-2 pt-2 pb-2 transform transition-transform duration-200 ease-out ${showPreview ? 'scale-100' : 'scale-95'}`}
               style={{ width: 'calc(100% + 24px)' }}>
            <div className="mx-auto" style={{ aspectRatio: '16 / 9' }}>
              <iframe
                title={`Apresentação do agente ${agent.name}`}
                src={showPreview ? embedUrl : undefined}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                className="w-full h-full border-0 rounded"
                ref={iframeRef}
                allowFullScreen
                sandbox="allow-same-origin allow-scripts allow-popups allow-presentation"
              />
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-gray-300" aria-live="polite">Prévia</span>
              <button
                type="button"
                onClick={handleUnmute}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded"
                aria-label="Ativar som do vídeo"
              >
                Ativar som
              </button>
            </div>
            {!showPreview && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleToggleClick}
                  className="bg-black/60 text-white text-xs font-semibold py-1.5 px-3 rounded-full"
                >
                  Assistir prévia
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AgentsSection: React.FC = () => {
  const [activeArea, setActiveArea] = useState<string>(AGENT_AREAS[0]);

  const areas = AGENT_AREAS;

  const filteredAgents = AGENTS.filter(agent => agent.area === activeArea);

  return (
    <section id="agents" className="py-20 md:py-32 bg-slate-900/50 overflow-hidden">
      <div className="container mx-auto px-6">
        <AnimatedElement className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Conheça seu Time de Especialistas Virtuais</h2>
          <p className="text-lg text-gray-400">
            Nossos agentes de IA são especialistas em suas respectivas áreas, prontos para impulsionar cada setor do seu negócio.
          </p>
        </AnimatedElement>

        <AnimatedElement delay={200} className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12">
          {areas.map(area => (
            <button
              key={area}
              onClick={() => setActiveArea(area)}
              className={`py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${
                activeArea === area
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              {area}
            </button>
          ))}
        </AnimatedElement>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredAgents.map((agent, index) => (
             <AnimatedElement key={agent.name} delay={index * 100}>
              <AgentCard agent={agent} />
            </AnimatedElement>
          ))}
        </div>
      </div>
      
    </section>
  );
};

export default AgentsSection;

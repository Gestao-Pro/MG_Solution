import React, { useRef, useState, useEffect } from 'react';
import { AGENTS, VIDEO_IDS, AGENT_AREAS } from '../constants';
import { Agent } from '../types';
import AnimatedElement from './AnimatedElement';
import Avatar from './Avatar';
import { Play, X } from 'lucide-react';
import gsap from 'gsap';

const AgentCard: React.FC<{ agent: Agent }> = ({ agent }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [wasClicked, setWasClicked] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoUrl = `/videos/${agent.name}.mp4`;
  const isTouch = typeof window !== 'undefined' && 'matchMedia' in window ? window.matchMedia('(hover: none)').matches : false;

  const handleEnter = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) {
      return;
    }

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setWasClicked(true);
    setShowPreview(true);
  };

  const handleLeave = () => {
    setShowPreview(false);
    setIsMuted(true);
    setWasClicked(false);
  };

  const handleCardLeave: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (isTouch) return;
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
    setWasClicked(true);
    setShowPreview(prev => !prev);
  };

  const handleUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1;
      videoRef.current.play().catch(() => {});
    }
    setIsMuted(false);
    setWasClicked(true);
  };

  return (
    <div
      ref={cardRef}
      className="agent-card relative bg-slate-800/60 p-4 rounded-xl border border-slate-700 text-center transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-900/50 transform hover:-translate-y-2 h-full cursor-pointer group"
      onPointerEnter={isTouch ? undefined : handleEnter}
      onPointerLeave={isTouch ? undefined : handleCardLeave}
      onFocus={handleEnter}
      onBlur={isTouch ? undefined : handleLeave}
      onClick={handleToggleClick}
      tabIndex={0}
      aria-label={`Mostrar prévia do vídeo do agente ${agent.name}`}
    >
      <div className="relative w-16 h-16 rounded-full mx-auto mb-3 border-4 border-slate-600 overflow-hidden group-hover:border-indigo-500 transition-colors">
        <Avatar agent={agent} />
        
        {!showPreview && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-10 h-10 border border-white/30 rounded-full animate-pulse-ring"></div>
              <div className="relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg animate-pulse-dot">
                <Play className="w-5 h-5 text-white/60 ml-0.5" fill="currentColor" />
              </div>
            </div>
          </div>
        )}
      </div>
      <h3 className="text-lg font-bold text-white">{agent.name}</h3>
      <p className="text-indigo-400 text-xs font-medium mb-1">{agent.area}</p>
      <p className="text-gray-400 text-xs">{agent.specialty}</p>

      <div
        ref={popoverRef}
        onPointerLeave={isTouch ? undefined : handleLeave}
        className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:absolute md:inset-0 md:-m-2 md:z-50 md:bg-transparent md:p-0 transition-opacity duration-200 ease-out ${
          showPreview ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => {
            if (e.target === popoverRef.current) handleLeave();
        }}
      >
        <div className={`relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden p-2 transform transition-transform duration-200 ease-out w-full max-w-lg md:w-[calc(100%+24px)] ${showPreview ? 'scale-100' : 'scale-95'}`}>
          <button 
            onClick={(e) => { e.stopPropagation(); handleLeave(); }}
            className="absolute top-2 right-2 z-10 p-1 bg-black/50 rounded-full text-white md:hidden hover:bg-black/70"
          >
            <X size={20} />
          </button>
          <div className="mx-auto bg-black rounded" style={{ aspectRatio: '16 / 9' }}>
            {showPreview && (
              <video
                ref={videoRef}
                src={videoUrl}
                autoPlay
                muted={!wasClicked}
                loop
                playsInline
                className="w-full h-full object-cover rounded"
                onCanPlay={() => {
                  if (wasClicked && videoRef.current) {
                    videoRef.current.play().catch(() => {
                      if (videoRef.current) videoRef.current.muted = true;
                      videoRef.current?.play().catch(() => {});
                    });
                  }
                }}
              />
            )}
          </div>
          <div className="flex items-center justify-between px-1 py-2 md:px-3">
            <span className="text-xs text-gray-300" aria-live="polite">Prévia</span>
            {!wasClicked && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleUnmute(); }}
                className="text-xs bg-indigo-600/80 hover:bg-indigo-700 text-white px-2 py-1 rounded transition-colors"
                aria-label="Ativar som do vídeo"
              >
                Ativar som
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AgentsSection: React.FC = () => {
  const [activeArea, setActiveArea] = useState<string>(AGENT_AREAS[0]);
  const gridRef = useRef<HTMLDivElement>(null);
  const areas = AGENT_AREAS;
  const filteredAgents = AGENTS.filter(agent => agent.area === activeArea);

  useEffect(() => {
    if (gridRef.current) {
      const cardWrappers = gridRef.current.children;
      if (cardWrappers.length > 0) {
        gsap.fromTo(cardWrappers, 
          { opacity: 0, x: 20, scale: 0.98 },
          { 
            opacity: 1, 
            x: 0, 
            scale: 1, 
            duration: 0.6, 
            stagger: 0.06, 
            ease: "power3.out",
            force3D: true,
            clearProps: "transform,opacity" 
          }
        );
      }
    }
  }, [activeArea]);

  return (
    <section id="agents" className="reveal py-20 md:py-32 bg-slate-900/50 overflow-hidden">
      <div className="container mx-auto px-6">
        <AnimatedElement className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Áreas em que a IA pode ajudar seu negócio</h2>
          <p className="text-lg text-gray-400">
            O GestãoPro atua em diferentes áreas para ajudar você a crescer com mais organização e eficiência.
          </p>
        </AnimatedElement>

        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12">
          {areas.map(area => (
            <button
              key={area}
              onClick={() => setActiveArea(area)}
              className={`py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${
                activeArea === area
                  ? 'bg-indigo-600 text-white shadow-lg scale-105'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        <div 
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
        >
          {filteredAgents.map((agent) => (
            <div key={agent.name}>
              <AgentCard agent={agent} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AgentsSection;

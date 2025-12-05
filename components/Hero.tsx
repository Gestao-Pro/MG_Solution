import React, { useRef, useState } from 'react';
import { SUPERBOSS_AVATAR_URL, SUPERBOSS_VIDEO_URL } from '../constants';

export const Hero: React.FC<{ onLoginClick?: () => void }> = ({ onLoginClick }) => {
  const [showPreview, setShowPreview] = useState(false);
  const avatarRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const toEmbedUrl = (href: string) => {
    try {
      const u = new URL(href);
      const host = u.hostname;
      const prefersReducedMotion = typeof window !== 'undefined' && 'matchMedia' in window
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;
      if (host.includes('youtube.com') || host.includes('youtu.be')) {
        let id = '';
        if (host.includes('youtu.be')) {
          id = u.pathname.slice(1);
        } else if (u.pathname.startsWith('/shorts/')) {
          id = u.pathname.split('/')[2] || '';
        } else {
          id = u.searchParams.get('v') || '';
        }
        if (id) {
          const params = new URLSearchParams({
            autoplay: prefersReducedMotion ? '0' : '1',
            playsinline: '1',
            controls: '0',
            rel: '0',
            modestbranding: '1',
            loop: '1',
            playlist: id,
            enablejsapi: '1',
            origin: typeof window !== 'undefined' ? window.location.origin : ''
          });
          return `https://www.youtube.com/embed/${id}?${params.toString()}`;
        }
      }
      if (host.includes('canva.com')) {
        return `${href}${href.includes('?') ? '&' : '?'}embed&autoplay=${prefersReducedMotion ? 0 : 1}&muted=1&loop=1`;
      }
      return href;
    } catch {
      return href;
    }
  };
  const embedUrl = toEmbedUrl(SUPERBOSS_VIDEO_URL);
  const isYouTubeEmbed = embedUrl.includes('youtube.com/embed');

  const handleUnmute = () => {
    if (isYouTubeEmbed && iframeRef.current?.contentWindow) {
      const target = iframeRef.current.contentWindow;
      try {
        target.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
        target.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*');
        target.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }), '*');
        target.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
      } catch (e) {
        // silencioso: se falhar, usuário pode usar os controles
      }
    }
  };

  const handleEnter = () => setShowPreview(true);
  const handleLeave = () => setShowPreview(false);
  const handleToggleClick = () => setShowPreview(prev => !prev);

  const handleContainerLeave: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const next = e.relatedTarget as Node | null;
    if (next && popoverRef.current?.contains(next)) {
      return;
    }
    handleLeave();
  };

  return (
    <section id="home" className="relative bg-gradient-to-br from-slate-900 to-slate-950 text-white py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10">
        {/* Padrão de fundo local para evitar 404 externo */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center bg-repeat [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      </div>
      <div className="container mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="lg:w-1/2 text-center lg:text-left">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            Sua Gestão <span className="text-indigo-400">Potencializada</span> por <span className="text-indigo-400">Inteligência Artificial</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-md lg:max-w-none mx-auto lg:mx-0">
            O SuperBoss, seu orquestrador de IA, analisa seu problema e distribui as tarefas para os agentes mais qualificados, garantindo uma solução completa e eficiente para o seu negócio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              type="button"
              onClick={() => onLoginClick?.()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Comece Agora
            </button>
            <a
              href="#how-it-works"
              className="bg-transparent border border-indigo-500 text-indigo-300 font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 hover:bg-indigo-600 hover:text-white"
            >
              Saiba Mais
            </a>
          </div>
        </div>
        <div className="lg:w-1/2 flex justify-center lg:justify-end">
          <div
            ref={avatarRef}
            className="relative w-64 h-64 md:w-80 md:h-80"
            onPointerEnter={handleEnter}
            onPointerLeave={handleContainerLeave}
            onMouseEnter={handleEnter}
            onMouseLeave={handleContainerLeave}
            onClick={handleToggleClick}
          >
            <img
              src={SUPERBOSS_AVATAR_URL}
              alt="SuperBoss AI"
              className="absolute inset-0 w-full h-full rounded-full object-cover shadow-2xl border-4 border-indigo-500 transform transition-transform duration-300"
            />
            <div
              ref={popoverRef}
              onPointerLeave={handleLeave}
              onMouseLeave={handleLeave}
              className={`absolute inset-0 z-50 transition-opacity duration-150 ${
                showPreview ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-indigo-500">
                <iframe
                  title="Apresentação do SuperBoss"
                  src={showPreview ? embedUrl : undefined}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="w-full h-full border-0"
                  ref={iframeRef}
                  allowFullScreen
                  sandbox="allow-same-origin allow-scripts allow-popups allow-presentation"
                />
                {!showPreview && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={handleToggleClick}
                      className="bg-black/60 text-white text-sm font-semibold py-2 px-4 rounded-full"
                    >
                      Assistir prévia
                    </button>
                  </div>
                )}
                {isYouTubeEmbed && showPreview && (
                  <button
                    type="button"
                    onClick={handleUnmute}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 px-4 rounded-full shadow-md"
                    aria-label="Ativar som do vídeo"
                  >
                    Ativar som
                  </button>
                )}
                {showPreview && (
                  <a
                    href={SUPERBOSS_VIDEO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-4 right-4 text-xs text-gray-300 hover:text-white"
                  >
                    Abrir no YouTube
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
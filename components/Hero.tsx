import React, { useRef, useState } from 'react';
import { SUPERBOSS_AVATAR_URL, SUPERBOSS_VIDEO_URL } from '../constants';
import { Play } from 'lucide-react';

export const Hero: React.FC<{ onLoginClick?: () => void }> = ({ onLoginClick }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [wasClicked, setWasClicked] = useState(false);
  const avatarRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoUrl = "/videos/SuperBoss.mp4";

  const handleUnmute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1;
      videoRef.current.play().catch(() => {});
      setWasClicked(true);
    }
  };

  const handleEnter = () => {
    setWasClicked(true); // Attempting unmuted autoplay on hover
    setShowPreview(true);
  };
  
  const handleLeave = () => {
    setShowPreview(false);
    setWasClicked(false);
  };

  const handleToggleClick = () => {
    setWasClicked(true);
    setShowPreview(prev => !prev);
  };

  const handleContainerLeave: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const next = e.relatedTarget as Node | null;
    if (next && popoverRef.current?.contains(next)) {
      return;
    }
    handleLeave();
  };

  return (
    <section id="home" className="relative text-white py-10 md:py-1 overflow-hidden min-h-[600px] md:min-h-screen flex items-center">
      {/* Background Image/GIF */}
      <div className="absolute inset-0 z-0 bg-[#030712] overflow-hidden">
        <img 
          src="https://i.postimg.cc/fT4SxjCF/VD_GIF.gif" 
          alt="Background" 
          className="absolute top-10 md:top-0 left-[80%] md:left-1/2 -translate-x-1/2 w-[55%] md:w-full h-full object-contain md:object-cover object-top origin-top scale-[2.8] md:scale-100 md:object-[center_20px]"
        />
        {/* Overlay para garantir legibilidade apenas na base */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-800/10 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 md:px-10 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="lg:w-3/4 text-center lg:text-left flex flex-col items-center lg:items-start mt-[45vw] sm:mt-[350px] md:mt-[350px]">
          <h1 className="hero-title text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight mb-3 md:mb-6 max-w-2xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            Organize seu negócio e ganhe tempo com <span className="text-indigo-400">Inteligência Artificial</span>
          </h1>
          <p className="hero-sub text-sm md:text-base text-gray-300 mb-2 max-w-xl mx-auto lg:mx-0">
            Pare de se perder em tarefas. Organize seu dia, crie conteúdos e tome decisões mais rápido — tudo em um só lugar.
          </p>
          <p className="hero-sub text-xs md:text-sm text-indigo-300 mb-6 font-medium">
            Economize horas por semana e tenha mais controle do seu negócio.
          </p>
          <div className="hero-sub flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
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
              Ver Como Funciona
            </a>
          </div>
        </div>
        <div className="lg:w-1/2 flex justify-center lg:justify-end">
          <div
            ref={avatarRef}
            className="relative w-64 h-64 md:w-80 md:h-80 cursor-pointer group"
            onPointerEnter={handleEnter}
            onPointerLeave={handleContainerLeave}
            onMouseEnter={handleEnter}
            onMouseLeave={handleContainerLeave}
            onClick={handleToggleClick}
          >
            <img
              src={SUPERBOSS_AVATAR_URL}
              alt="SuperBoss AI"
              className="absolute inset-0 w-full h-full rounded-full object-cover shadow-2xl border-4 border-indigo-500 transform transition-transform duration-300 group-hover:scale-105"
            />
            
            {!showPreview && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-20 h-20 border-2 border-white/30 rounded-full animate-pulse-ring"></div>
                  <div className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-xl animate-pulse-dot">
                    <Play className="w-10 h-10 text-white/50 ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>
            )}

            <div
              ref={popoverRef}
              onPointerLeave={handleLeave}
              onMouseLeave={handleLeave}
              className={`absolute inset-0 z-50 transition-opacity duration-150 ${
                showPreview ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-indigo-500 bg-black">
                {showPreview && (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    autoPlay
                    muted={!wasClicked}
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                    onCanPlay={() => {
                      if (wasClicked && videoRef.current) {
                        videoRef.current.play().catch(() => {
                           // Se falhar com áudio, tenta mudo
                           if (videoRef.current) videoRef.current.muted = true;
                           videoRef.current?.play().catch(() => {});
                        });
                      }
                    }}
                  />
                )}
                {!wasClicked && showPreview && (
                  <button
                    type="button"
                    onClick={handleUnmute}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-indigo-600/80 hover:bg-indigo-700 text-white text-xs font-semibold py-1.5 px-4 rounded-full shadow-md backdrop-blur-sm transition-all"
                  >
                    Ativar som
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

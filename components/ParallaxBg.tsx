import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * ParallaxBg – fundo com gradiente radial que move levemente com o mouse.
 * Efeito sutil: máx. 20px de deslocamento para não distrair.
 * Uso: colocar como primeiro filho do container da landing.
 */
const ParallaxBg: React.FC = () => {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Em mobile ou prefers-reduced, apenas mostra o gradiente estático
    const hasMouse =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (prefersReduced || !hasMouse) return;

    const el = bgRef.current;
    if (!el) return;

    const MAX_OFFSET = 20; // px — movimento máximo

    const onMove = (e: MouseEvent) => {
      const xRatio = e.clientX / window.innerWidth - 0.5;   // -0.5 a 0.5
      const yRatio = e.clientY / window.innerHeight - 0.5;  // -0.5 a 0.5

      gsap.to(el, {
        x: xRatio * MAX_OFFSET,
        y: yRatio * MAX_OFFSET,
        duration: 1.6,
        ease: 'power1.out',
        overwrite: 'auto',
      });
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Blob 1 — canto superior esquerdo */}
      <div
        ref={bgRef}
        style={{
          position: 'absolute',
          inset: '-10%',   // ligeiramente maior que a viewport para acomodar o deslocamento
          background:
            'radial-gradient(ellipse 70% 55% at 20% 20%, rgba(99,60,255,0.12) 0%, transparent 70%), ' +
            'radial-gradient(ellipse 60% 45% at 80% 75%, rgba(79,40,220,0.10) 0%, transparent 65%)',
          willChange: 'transform',
        }}
      />
    </div>
  );
};

export default ParallaxBg;

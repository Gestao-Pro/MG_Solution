import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Cursor – cursor interativo que segue o mouse com anel roxo.
 * pointer-events: none garante que não interfira em cliques.
 * Renderizado apenas em dispositivos com suporte a hover (mouse).
 */
const Cursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Só ativa em dispositivos com mouse (hover:hover)
    const hasHover =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!hasHover || prefersReduced) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Mostra os cursores
    dot.style.display = 'block';
    ring.style.display = 'block';

    // Posição inicial fora da tela
    gsap.set([dot, ring], { x: -100, y: -100 });

    const onMove = (e: MouseEvent) => {
      // Ponto central — segue imediatamente
      gsap.to(dot, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.12,
        ease: 'power2.out',
      });
      // Anel — segue com leve delay (efeito elástico)
      gsap.to(ring, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.45,
        ease: 'power3.out',
      });
    };

    // Hover em elementos clicáveis → expande o anel
    const onEnterClickable = () => {
      gsap.to(ring, { scale: 1.8, opacity: 0.5, duration: 0.25 });
      gsap.to(dot, { scale: 0.5, duration: 0.25 });
    };
    const onLeaveClickable = () => {
      gsap.to(ring, { scale: 1, opacity: 1, duration: 0.25 });
      gsap.to(dot, { scale: 1, duration: 0.25 });
    };

    const clickables = document.querySelectorAll(
      'a, button, [role="button"], input, select, textarea, label'
    );

    window.addEventListener('mousemove', onMove);
    clickables.forEach((el) => {
      el.addEventListener('mouseenter', onEnterClickable);
      el.addEventListener('mouseleave', onLeaveClickable);
    });

    return () => {
      window.removeEventListener('mousemove', onMove);
      clickables.forEach((el) => {
        el.removeEventListener('mouseenter', onEnterClickable);
        el.removeEventListener('mouseleave', onLeaveClickable);
      });
    };
  }, []);

  return (
    <>
      {/* Ponto central */}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          display: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#6c63ff',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 99999,
          willChange: 'transform',
        }}
      />
      {/* Anel externo */}
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          display: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '2px solid #6c63ff',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 99998,
          willChange: 'transform',
          opacity: 0.85,
        }}
      />
    </>
  );
};

export default Cursor;

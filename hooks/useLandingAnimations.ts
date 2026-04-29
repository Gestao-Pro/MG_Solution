import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * useLandingAnimations
 * Hook global de animações da landing page.
 * - Anima entrada do Hero (fade + slide up) nas classes .hero-title e .hero-sub
 * - Anima todas as seções com scroll reveal via classe .reveal
 */
export const useLandingAnimations = () => {
  useEffect(() => {
    // Respeita preferência de redução de movimento
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) return;

    // --- HEADER ANIMATION ---
    const header = document.querySelector('header');
    if (header) {
      gsap.fromTo(header, 
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', delay: 0.2 }
      );
    }

    // --- HERO ANIMATIONS ---
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    const heroTitle = document.querySelectorAll('.hero-title');
    const heroSub = document.querySelectorAll('.hero-sub');

    if (heroTitle.length) {
      gsap.set(heroTitle, { opacity: 0, y: 40 });
      heroTl.to(heroTitle, { opacity: 1, y: 0, duration: 0.9, stagger: 0.15 });
    }

    if (heroSub.length) {
      gsap.set(heroSub, { opacity: 0, y: 30 });
      heroTl.to(heroSub, { opacity: 1, y: 0, duration: 0.8 }, '-=0.5');
    }

    // --- SCROLL REVEAL ---
    const revealEls = document.querySelectorAll('.reveal');

    revealEls.forEach((el) => {
      gsap.set(el, { opacity: 0, y: 50 });

      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        onEnter: () => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: 'power3.out',
          });
        },
        once: true,
      });
    });

    // --- FAQ STAGGERED REVEAL ---
    const faqSection = document.querySelector('#faq');
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqSection && faqItems.length) {
      gsap.set(faqItems, { opacity: 0, x: -20 });
      ScrollTrigger.create({
        trigger: faqSection,
        start: 'top 80%',
        onEnter: () => {
          gsap.to(faqItems, {
            opacity: 1,
            x: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out'
          });
        },
        once: true
      });
    }

    // --- CHATBOT FLOATING ---
    const chatbotBtn = document.querySelector('.chatbot-float');
    let chatbotTween: gsap.core.Tween | null = null;
    if (chatbotBtn) {
      chatbotTween = gsap.to(chatbotBtn, {
        y: -10,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
      });
    }

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      heroTl.kill();
      if (header) {
        gsap.killTweensOf(header);
        gsap.set(header, { clearProps: "all" });
      }
      if (chatbotBtn) {
        gsap.killTweensOf(chatbotBtn);
      }
    };
  }, []);
};

import React, { useRef, useEffect, useState } from 'react';

interface AnimatedElementProps<T extends keyof React.JSX.IntrinsicElements> {
  children: React.ReactNode;
  className?: string;
  // FIX: Made the component generic to correctly handle dynamic tags and their corresponding refs.
  // This resolves both the "union type too complex" error and the ref incompatibility by inferring the correct element type from the tag.
  tag?: T;
  delay?: number;
}

const AnimatedElement = <T extends keyof React.JSX.IntrinsicElements = 'div'>({
  children,
  className = '',
  tag,
  delay = 0,
}: AnimatedElementProps<T>) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<React.ElementRef<T>>(null);

  useEffect(() => {
    const element = ref.current;

    // FIX: Use an `instanceof Element` check as a type guard. This assures TypeScript that `ref.current`
    // is a DOM Element, which is required by the IntersectionObserver API, resolving the compile-time error.
    if (element instanceof Element) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(element);
          }
        },
        {
          threshold: 0.1,
        }
      );

      observer.observe(element);

      return () => {
        observer.unobserve(element);
      };
    }
  }, []);

  const Tag = tag || 'div';

  return React.createElement(
    Tag,
    {
      ref: ref,
      className: `scroll-animate ${className} ${isVisible ? 'is-visible' : ''}`,
      style: { transitionDelay: `${delay}ms` },
    },
    children
  );
};

export default AnimatedElement;
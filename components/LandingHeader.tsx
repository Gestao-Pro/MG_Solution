import React, { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export const LandingHeader: React.FC<{ onLoginClick?: () => void }> = ({ onLoginClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Início', href: '#home' },
    { name: 'Recursos', href: '#features' },
    { name: 'Como Funciona', href: '#how-it-works' },
    { name: 'Agentes', href: '#agents' },
    { name: 'Planos', href: '#plans' },
    { name: 'FAQ', href: '#faq' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false); // Close mobile menu after clicking a link
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-slate-900/80 backdrop-blur-md z-50 shadow-lg">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <a href="#home" className="text-2xl font-bold text-white">
          GestãoPro
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="text-gray-300 hover:text-indigo-400 transition-colors duration-300 font-medium"
            >
              {item.name}
            </a>
          ))}
          <button
            type="button"
            onClick={() => onLoginClick?.()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-full transition-all duration-300 transform hover:scale-105 shadow-md"
          >
            Comece Agora
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-gray-300 hover:text-white focus:outline-none">
            {isOpen ? (
              <XMarkIcon className="h-8 w-8" />
            ) : (
              <Bars3Icon className="h-8 w-8" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className={`md:hidden bg-slate-800/90 backdrop-blur-md absolute top-full left-0 w-full transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex flex-col items-center py-6 space-y-4">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="text-gray-300 hover:text-indigo-400 transition-colors duration-300 font-medium text-lg"
            >
              {item.name}
            </a>
          ))}
          <button
            type="button"
            onClick={() => { onLoginClick?.(); setIsOpen(false); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-full transition-all duration-300 transform hover:scale-105 shadow-md mt-4"
          >
            Comece Agora
          </button>
        </div>
      </nav>
    </header>
  );
};
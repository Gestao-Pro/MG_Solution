import React from 'react';
import { FaLinkedin, FaInstagram, FaFacebook } from 'react-icons/fa';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-gray-400 py-10">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Coluna 1: Logo e Descrição */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-white">GestãoPro</h3>
          <p className="text-sm leading-relaxed">
            Sua plataforma de gestão inteligente com IA, otimizando processos e impulsionando o crescimento do seu negócio.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
              <FaLinkedin size={24} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
              <FaInstagram size={24} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
              <FaFacebook size={24} />
            </a>
          </div>
        </div>

        {/* Coluna 2: Links Rápidos */}
        <div>
          <h4 className="text-xl font-semibold text-white mb-4">Links Rápidos</h4>
          <ul className="space-y-2">
            <li><a href="#home" className="hover:text-white transition-colors duration-300">Início</a></li>
            <li><a href="#features" className="hover:text-white transition-colors duration-300">Recursos</a></li>
            <li><a href="#how-it-works" className="hover:text-white transition-colors duration-300">Como Funciona</a></li>
            <li><a href="#agents" className="hover:text-white transition-colors duration-300">Agentes</a></li>
            <li><a href="#faq" className="hover:text-white transition-colors duration-300">FAQ</a></li>
          </ul>
        </div>

        {/* Coluna 3: Contato */}
        <div>
          <h4 className="text-xl font-semibold text-white mb-4">Contato</h4>
          <p className="text-sm">
            Email: <a href="mailto:contato@gestaopro.com" className="hover:text-white transition-colors duration-300">contato@gestaopro.com</a>
          </p>
          <p className="text-sm">
            Telefone: <a href="tel:+5511999999999" className="hover:text-white transition-colors duration-300">+55 11 99999-9999</a>
          </p>
          <p className="text-sm mt-4">
            Endereço: Rua Exemplo, 123 - São Paulo, SP
          </p>
        </div>
      </div>
      <div className="border-t border-slate-700 mt-10 pt-8 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} GestãoPro. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};
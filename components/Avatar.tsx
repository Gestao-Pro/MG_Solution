import React from 'react';
import { Agent } from '../types';

interface AvatarProps {
    agent: Agent;
}

const Avatar: React.FC<AvatarProps> = ({ agent }) => {
    const colors = {
        'Estratégia': 'bg-purple-600',
        'Vendas': 'bg-green-600',
        'Marketing': 'bg-pink-600',
        'Pessoas': 'bg-yellow-600',
        'Processos': 'bg-indigo-600',
        'Finanças': 'bg-teal-600',
        'Criativo': 'bg-orange-600',
        'BI': 'bg-sky-600'
    };

    const bgColor = colors[agent.area] || 'bg-gray-600';
    const FALLBACK_SVG =
        'data:image/svg+xml;utf8,' +
        encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#6366f1"/>
                  <stop offset="100%" stop-color="#0ea5e9"/>
                </linearGradient>
              </defs>
              <rect width="64" height="64" rx="32" fill="url(#g)"/>
              <text x="50%" y="54%" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#ffffff" text-anchor="middle">AI</text>
            </svg>`
        );
    
    return (
        <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden ${bgColor}`}>
            <img 
                src={agent.avatarUrl} 
                alt="" 
                aria-label={`Avatar de ${agent.name}`}
                className="w-full h-full object-cover"
                // Fallback simples em caso de erro no carregamento da imagem
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== FALLBACK_SVG) {
                        target.src = FALLBACK_SVG;
                    }
                }}
            />
        </div>
    );
};

export default Avatar;
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
    
    return (
        <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden ${bgColor}`}>
            <img 
                src={agent.avatar} 
                alt={`Avatar de ${agent.name}`} 
                className="w-full h-full object-cover"
                // Adiciona um fallback simples em caso de erro no carregamento da imagem
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none'; // Esconde a imagem quebrada
                    // O fundo colorido continuará visível
                }}
            />
        </div>
    );
};

export default Avatar;
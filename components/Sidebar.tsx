
import React from 'react';
import { AGENT_AREAS, SUPER_BOSS } from '../constants';
import { AgentArea, AgentId } from '../types';
import Avatar from './Avatar';
import { Lightbulb, DollarSign, Mic, Users, Settings, LineChart, PenTool, Search, History } from 'lucide-react'; // Import History icon

interface SidebarProps {
    onSelectArea: (area: AgentArea) => void;
    onSelectSuperBoss: () => void;
    activeArea: AgentArea | null;
    activeAgentId: AgentId | null;
    onOpenHistory: () => void; // Add onOpenHistory prop
}

const areaIcons: Record<AgentArea, React.ComponentType<{ className?: string }>> = {
    'Estratégia': Lightbulb,
    'Vendas': DollarSign,
    'Marketing': Mic,
    'Pessoas': Users,
    'Processos': Settings,
    'Finanças': LineChart,
    'Criativo': PenTool,
    'BI': Search,
};

const Sidebar: React.FC<SidebarProps> = ({ onSelectArea, onSelectSuperBoss, activeArea, activeAgentId, onOpenHistory }) => {
    return (
        <aside className="w-full h-full bg-white dark:bg-gray-900 p-4 flex flex-col border-r border-gray-200 dark:border-gray-700">
            <div className="mb-8 px-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">GestãoPro</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sua Equipe de IA</p>
            </div>
            
            <div className="mb-6">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-3 px-2">Orquestrador</p>
                <button
                    onClick={onSelectSuperBoss}
                    className={`w-full flex items-center p-2 rounded-lg text-left transform transition-all duration-300 ease-in-out ${
                        activeAgentId === SUPER_BOSS.id 
                        ? 'bg-blue-600 text-white scale-95 shadow-inner' 
                        : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 hover:-translate-y-1 hover:scale-105 hover:shadow-lg'
                    }`}
                >
                    <div className="w-10 h-10 mr-3">
                        <Avatar agent={SUPER_BOSS} />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm">{SUPER_BOSS.name}</p>
                    </div>
                </button>
            </div>

            <div className="flex-1">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-3 px-2">Setores</p>
                {AGENT_AREAS.map((area, index) => {
                    const Icon = areaIcons[area];
                    const isActive = activeArea === area && !activeAgentId;
                    const isLast = index === AGENT_AREAS.length - 1;
                    return (
                        <button
                            key={area}
                            onClick={() => onSelectArea(area)}
                            className={`w-full flex items-center p-2 rounded-lg text-left transform transition-all duration-300 ease-in-out ${ isLast ? '' : 'border-b border-gray-400 dark:border-gray-500'} ${
                                isActive 
                                ? 'bg-blue-600 text-white scale-95 shadow-inner' 
                                : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 hover:-translate-y-1 hover:scale-105 hover:shadow-lg'
                            }`}
                        >
                            <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                            <span className="font-semibold text-sm">{area}</span>
                        </button>
                    );
                })}
            </div>
            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={onOpenHistory} // Button to open history
                    className="w-full flex items-center p-2 rounded-lg text-left transform transition-all duration-300 ease-in-out text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 hover:-translate-y-1 hover:scale-105 hover:shadow-lg"
                >
                    <History className="w-5 h-5 mr-3 text-gray-500" />
                    <span className="font-semibold text-sm">Histórico</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

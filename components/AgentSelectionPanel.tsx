
import React, { useEffect, useMemo, useState } from 'react';
import { Agent, AgentArea, AgentId } from '../types';
import Avatar from './Avatar';
import { useLocation, useNavigate } from 'react-router-dom';

interface AgentSelectionPanelProps {
    area: AgentArea;
    agents: Agent[];
    onSelectAgent: (agentId: AgentId) => void;
}

const AgentCard: React.FC<{ agent: Agent, onSelect: () => void }> = ({ agent, onSelect }) => (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 flex flex-col items-center text-center border border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]">
        <div className="w-20 h-20 mb-4">
            <Avatar agent={agent} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{agent.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-4 flex-grow min-h-[40px]">{agent.specialty}</p>
        <button onClick={onSelect} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200">
            Conversar
        </button>
    </div>
);


const AgentSelectionPanel: React.FC<AgentSelectionPanelProps> = ({ area, agents, onSelectAgent }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV;

    const currentDebug = useMemo(() => {
        const qs = new URLSearchParams(location.search);
        return qs.get('debug') === 'all-agents' || localStorage.getItem('debugAllAgents') === 'true';
    }, [location.search]);

    const [debugAllAgents, setDebugAllAgents] = useState<boolean>(currentDebug);

    useEffect(() => {
        setDebugAllAgents(currentDebug);
    }, [currentDebug]);

    const toggleDebug = () => {
        const qs = new URLSearchParams(location.search);
        if (!debugAllAgents) {
            // Enable: persist and add query param
            localStorage.setItem('debugAllAgents', 'true');
            qs.set('debug', 'all-agents');
        } else {
            // Disable: persist off and remove query param
            localStorage.setItem('debugAllAgents', 'false');
            qs.delete('debug');
        }
        const search = qs.toString();
        navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true });
        setDebugAllAgents(!debugAllAgents);
    };

    return (
        <div className="p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Setor: {area}</h2>
                {isDev && (
                    <button
                        type="button"
                        onClick={toggleDebug}
                        className={`text-xs px-3 py-2 rounded border transition-colors ${debugAllAgents ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' : 'bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300'}`}
                        aria-pressed={debugAllAgents}
                    >
                        {debugAllAgents ? 'Mostrar gating de plano/ciclo' : 'Mostrar todos os agentes'}
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {agents.map(agent => (
                    <AgentCard key={agent.id} agent={agent} onSelect={() => onSelectAgent(agent.id)} />
                ))}
            </div>
        </div>
    );
};

export default AgentSelectionPanel;


import React from 'react';
import { Agent, AgentArea, AgentId } from '../types';
import Avatar from './Avatar';

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
    return (
        <div className="p-6 h-full">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Setor: {area}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {agents.map(agent => (
                    <AgentCard key={agent.id} agent={agent} onSelect={() => onSelectAgent(agent.id)} />
                ))}
            </div>
        </div>
    );
};

export default AgentSelectionPanel;

import React from 'react';
import { History, AnalysisSession } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, FolderOpen } from 'lucide-react';

interface HistoryPanelProps {
    history: History;
    onLoadSession: (sessionId: string) => void;
    onDeleteSession: (sessionId: string) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onLoadSession, onDeleteSession }) => {
    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 shadow-lg rounded-lg p-6 overflow-hidden">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b pb-4 border-gray-200 dark:border-gray-700">Histórico de Análises</h2>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {history.sessions.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center mt-10">Nenhuma sessão salva ainda.</p>
                ) : (
                    <ul className="space-y-4">
                        {history.sessions.map((session) => (
                            <li key={session.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center transition-all duration-200 hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                <div className="flex-1 mb-3 sm:mb-0">
                                    <p className="text-lg font-semibold text-blue-700 dark:text-blue-400 break-words">{session.userProblem || 'Sessão sem título'}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {format(new Date(session.timestamp), 'dd MMMM yyyy, HH:mm', { locale: ptBR })}
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => onLoadSession(session.id)}
                                        className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
                                        title="Carregar Sessão"
                                    >
                                        <FolderOpen size={20} />
                                    </button>
                                    <button
                                        onClick={() => onDeleteSession(session.id)}
                                        className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-200"
                                        title="Excluir Sessão"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default HistoryPanel;
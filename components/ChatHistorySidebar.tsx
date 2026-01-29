
import React from 'react';
import { AnalysisSession } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, FolderOpen, X, History as HistoryIcon } from 'lucide-react';

interface ChatHistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    history: AnalysisSession[];
    onLoadSession: (sessionId: string) => void;
    onDeleteSession: (sessionId: string) => void;
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({ isOpen, onClose, history, onLoadSession, onDeleteSession }) => {
    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ease-in-out"
                    onClick={onClose}
                />
            )}
            
            {/* Sidebar */}
            <div className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-2">
                            <HistoryIcon className="text-blue-600 dark:text-blue-400" size={20} />
                            <h3 className="font-bold text-gray-900 dark:text-white">Histórico do Chat</h3>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-500 dark:text-gray-400">
                                <HistoryIcon size={32} className="mb-2 opacity-20" />
                                <p className="text-sm">Nenhuma sessão salva.</p>
                            </div>
                        ) : (
                            history.map((session) => (
                                <div 
                                    key={session.id} 
                                    className="group bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-transparent hover:border-blue-500/30 dark:hover:border-blue-400/30 transition-all cursor-pointer shadow-sm hover:shadow-md"
                                    onClick={() => onLoadSession(session.id)}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 line-clamp-2 flex-1">
                                            {session.userProblem || 'Sessão sem título'}
                                        </p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteSession(session.id);
                                            }}
                                            className="ml-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Excluir"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                            {format(new Date(session.timestamp), 'dd/MM/yy HH:mm', { locale: ptBR })}
                                        </span>
                                        <FolderOpen size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ChatHistorySidebar;

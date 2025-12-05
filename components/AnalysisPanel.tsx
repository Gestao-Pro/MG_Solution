
import React, { useState } from 'react';
import { Analysis, Agent, UserProfile } from '../types';
import Avatar from './Avatar';
import { Download, ArrowLeft, ChevronDown, Volume2 } from 'lucide-react';
import IconButton from './IconButton';
import ReportModal from './ReportModal';
import { generateSpeech } from '../services/geminiService';
import { getPreferredVoice, getFallbackVoice } from '../utils/voiceConfig';
import AudioPlayer from './AudioPlayer';


interface AnalysisPanelProps {
    analysis: Analysis;
    onBack: () => void;
    userProfile: UserProfile;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, onBack, userProfile }) => {
    const [expandedSolutions, setExpandedSolutions] = useState<Record<number, boolean>>({ 0: true });
    const [solutionAudios, setSolutionAudios] = useState<Record<number, string>>({});
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const toggleSolution = (index: number) => {
        setExpandedSolutions(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handlePlaySolutionAudio = async (index: number, solutionText: string, agent: Agent) => {
        if (solutionAudios[index]) return;
        
        try {
            const preferred = getPreferredVoice(agent);
            const fallback = getFallbackVoice(agent);
            const audioUrl = await generateSpeech(solutionText, preferred, fallback);
            setSolutionAudios(prev => ({ ...prev, [index]: audioUrl }));
        } catch (error) {
            console.error("Failed to generate speech for solution", error);
        }
    };


    return (
        <>
            <div className="flex-1 flex flex-col h-full bg-gray-100 dark:bg-gray-800 p-6 overflow-y-auto">
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Painel de Análise</h2>
                    <div className="flex space-x-2">
                        <IconButton icon={Download} onClick={() => setIsReportModalOpen(true)} tooltip="Gerar Relatório Completo" className="bg-green-600 hover:bg-green-700" />
                        <IconButton icon={ArrowLeft} onClick={onBack} tooltip="Voltar" className="bg-blue-600 hover:bg-blue-700" />
                    </div>
                </header>

                <div className="bg-white dark:bg-gray-900 rounded-lg p-6 text-gray-900 dark:text-white">
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                        <h3 className="text-xl font-semibold text-blue-500 dark:text-blue-400 mb-2">Problema Analisado</h3>
                        <p className="text-gray-600 dark:text-gray-300">{analysis.problem}</p>
                    </div>
                    
                    <div>
                        <h3 className="text-xl font-semibold text-blue-500 dark:text-blue-400 mb-4">Soluções dos Especialistas</h3>
                        <div className="space-y-4">
                            {analysis.solutions.map(({ agent, solution }, index) => {
                                const isExpanded = !!expandedSolutions[index];
                                return (
                                    <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
                                        <div className="w-full flex items-center p-4 text-left">
                                            <button
                                                onClick={() => toggleSolution(index)}
                                                className="flex-1 flex items-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                                                aria-expanded={isExpanded}
                                                aria-controls={`solution-${index}`}
                                            >
                                                <div className="w-10 h-10 mr-4 flex-shrink-0">
                                                    <Avatar agent={agent} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold">{agent.name}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{agent.specialty}</p>
                                                </div>
                                            </button>
                                            <div className="flex items-center space-x-2">
                                                {solutionAudios[index] ? (
                                                    <div className="w-48" onClick={(e) => e.stopPropagation()}>
                                                        <AudioPlayer src={solutionAudios[index]} />
                                                    </div>
                                                ) : (
                                                    <IconButton
                                                        icon={Volume2}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePlaySolutionAudio(index, solution, agent);
                                                        }}
                                                        tooltip="Ouvir Análise"
                                                        size="sm"
                                                        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-200"
                                                    />
                                                )}
                                                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>
                                        <div
                                            id={`solution-${index}`}
                                            className={`transition-all duration-500 ease-in-out grid ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                                        >
                                            <div className="overflow-hidden">
                                                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:text-gray-600 dark:prose-p:text-gray-300 p-4 pt-0">
                                                    {(typeof solution === 'string' ? solution : '').split('\n').filter(p => p.trim()).map((paragraph, i) => <p key={i}>{paragraph}</p>)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            {isReportModalOpen && (
                <ReportModal analysis={analysis} onClose={() => setIsReportModalOpen(false)} userProfile={userProfile} />
            )}
        </>
    );
};

export default AnalysisPanel;
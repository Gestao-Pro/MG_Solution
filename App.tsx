
import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import AnalysisPanel from './components/AnalysisPanel';
import ReportModal from './components/ReportModal';
import OnboardingModal from './components/OnboardingModal';
import HistoryPanel from './components/HistoryPanel';
import AgentSelectionPanel from './components/AgentSelectionPanel';
import { Message, UserProfile, Agent, Analysis, ReportData, AnalysisSession, History, AgentId, AgentArea } from './types';
import { ALL_AGENTS_MAP, AGENTS, SUPER_BOSS, ALL_AGENTS_LIST } from './constants';
import { generateSuperBossAnalysis, generateChatResponse } from './services/geminiService';
import { fileToBase64 } from './utils/audioUtils';

const App: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // 768px is the default 'md' breakpoint in Tailwind CSS
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    });
    const [userProfile, setUserProfile] = useState<UserProfile>(() => {
        const savedProfile = localStorage.getItem('userProfile');
        return savedProfile ? JSON.parse(savedProfile) : { userName: 'Usuário', userRole: 'Analista' };
    });
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentAgent, setCurrentAgent] = useState<Agent>(ALL_AGENTS_LIST[0]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [userProblem, setUserProblem] = useState<string>('');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => {
        return localStorage.getItem('hasOnboarded') === 'true';
    });
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
    const [history, setHistory] = useState<History>(() => {
        const savedHistory = localStorage.getItem('analysisHistory');
        return savedHistory ? JSON.parse(savedHistory) : { sessions: [] };
    });
    const [activeAgentId, setActiveAgentId] = useState<AgentId | null>(null);
    const [activeArea, setActiveArea] = useState<AgentArea>('Estratégia');
    const [loading, setLoading] = useState(false);
    const [chats, setChats] = useState<{ [key: AgentId]: Message[] }>({});
    const [view, setView] = useState<'agent-selection' | 'chat' | 'analysis' | 'history'>('agent-selection');
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(!hasOnboarded);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
    }, [theme]);

    useEffect(() => {
        if (hasOnboarded && !activeAgentId && view !== 'agent-selection') {
            setView('agent-selection');
        }
    }, [hasOnboarded, activeAgentId, view]);

    useEffect(() => {
        if (userProfile.userName && userProfile.companyName && userProfile.companyField && userProfile.userRole && userProfile.companySize && userProfile.companyStage && userProfile.mainProduct && userProfile.targetAudience && userProfile.mainChallenge) {
            setIsOnboardingOpen(false);
        }
    }, [userProfile]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const handleSaveProfile = (profile: UserProfile) => {
        setUserProfile(profile);
        localStorage.setItem('userProfile', JSON.stringify(profile));
        setIsProfileModalOpen(false);
        if (!hasOnboarded) {
            setHasOnboarded(true);
            localStorage.setItem('hasOnboarded', 'true');
        }
    };

    const handleEditProfile = () => {
        setIsProfileModalOpen(true);
    };

    const handleFinishOnboarding = () => {
        setHasOnboarded(true);
        localStorage.setItem('hasOnboarded', 'true');
    };

    const handleOpenHistory = () => {
        setIsHistoryPanelOpen(true);
        setView('history');
    };

    const handleCloseHistory = () => {
        setIsHistoryPanelOpen(false);
        setView(activeAgentId ? 'chat' : 'agent-selection');
    };

    const saveCurrentSession = useCallback((problemSummary: string) => {
        const newSession: AnalysisSession = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            userProblem: problemSummary,
            messages: messages,
            currentAnalysis: currentAnalysis,
            reportData: reportData,
        };

        setHistory(prevHistory => {
            const updatedHistory = { ...prevHistory, sessions: [newSession, ...prevHistory.sessions] };
            localStorage.setItem('analysisHistory', JSON.stringify(updatedHistory));
            return updatedHistory;
        });
    }, [messages, currentAnalysis, reportData]);

    const loadSession = useCallback((sessionId: string) => {
        const sessionToLoad = history.sessions.find(session => session.id === sessionId);
        if (sessionToLoad) {
            setMessages(sessionToLoad.messages);
            setCurrentAnalysis(sessionToLoad.currentAnalysis);
            setReportData(sessionToLoad.reportData);
            setUserProblem(sessionToLoad.userProblem);
            setChats(prev => ({ ...prev, [SUPER_BOSS.id]: sessionToLoad.messages })); // Assuming messages are for SUPER_BOSS
            setActiveAgentId(SUPER_BOSS.id);
            setView('chat');
            setIsHistoryPanelOpen(false); // Close history panel after loading
        }
    }, [history.sessions, setMessages, setCurrentAnalysis, setReportData, setUserProblem, setChats]);

    const deleteSession = useCallback((sessionId: string) => {
        setHistory(prevHistory => {
            const updatedHistory = { ...prevHistory, sessions: prevHistory.sessions.filter(session => session.id !== sessionId) };
            localStorage.setItem('analysisHistory', JSON.stringify(updatedHistory));
            return updatedHistory;
        });
    }, []);

    const handleSelectArea = (area: AgentArea) => {
        setActiveArea(area);
        setActiveAgentId(null);
        setView('agent-selection');
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    };

    const handleSelectAgent = (agentId: AgentId) => {
        const agent = ALL_AGENTS_MAP.get(agentId);
        if (agent) {
            setActiveAgentId(agentId);
            if (!chats[agentId]) {
                setChats(prev => ({
                    ...prev,
                    [agentId]: [{
                        id: `${agent.id}-initial`,
                        text: `Olá! Eu sou ${agent.name}, ${agent.specialty}. Como posso te ajudar hoje?`,
                        sender: 'agent',
                        agent: agent,
                    }]
                }));
            }
            setView('chat');
        }
    };

    const handleSelectSuperBoss = () => {
        setActiveAgentId(SUPER_BOSS.id);
        if (!chats[SUPER_BOSS.id]) {
            setChats(prev => ({
                ...prev,
                [SUPER_BOSS.id]: [{
                    id: `${SUPER_BOSS.id}-initial`,
                    text: `Olá! Eu sou ${SUPER_BOSS.name}, ${SUPER_BOSS.specialty}. Como posso te ajudar hoje?`,
                    sender: 'agent',
                    agent: SUPER_BOSS,
                }]
            }));
        }
        setView('chat');
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    };

    const handleBackToSelection = () => {
        setActiveAgentId(null);
        setView('agent-selection');
    };

    const typeMessage = (agentId: AgentId, message: Message, onComplete?: () => void) => {
        // If there's no text, just add the message (for image-only responses) and finish.
        if (!message.text) {
            if (message.imageUrl) {
                setChats(prev => ({ ...prev, [agentId]: [...prev[agentId], message] }));
            }
            onComplete?.();
            return;
        }

        // Otherwise, proceed with the typing effect for the text.
        setChats(prev => ({ ...prev, [agentId]: [...prev[agentId], { ...message, text: '' }] }));

        let index = 0;
        const typingSpeed = 30; // ms
        const intervalId = setInterval(() => {
            setChats(prev => {
                const currentChat = prev[agentId];
                const lastMessage = currentChat[currentChat.length - 1];
                
                // message.text is guaranteed to be a non-empty string here.
                if (lastMessage && lastMessage.id === message.id && index < message.text.length) {
                    lastMessage.text = message.text.substring(0, index + 1);
                    index++;
                    return { ...prev, [agentId]: [...currentChat.slice(0, -1), lastMessage] };
                }
                
                clearInterval(intervalId);
                if (index >= message.text.length) {
                    onComplete?.();
                }
                return prev;
            });
        }, typingSpeed);
    };

    const handleClearConversation = (agentId: AgentId) => {
        const agent = ALL_AGENTS_MAP.get(agentId);
        if (!agent) return;
        setChats(prev => ({
            ...prev,
            [agentId]: [{
                id: `${agent.id}-initial`,
                text: `Olá! Eu sou ${agent.name}, ${agent.specialty}. Como posso te ajudar hoje?`,
                sender: 'agent',
                agent: agent,
            }]
        }));
    };

    const handleSendMessage = useCallback(async (messageText: string, imageFile?: File) => {
        if (!userProfile || !activeAgentId) return;

        const currentAgentId = activeAgentId;
        const agent = ALL_AGENTS_MAP.get(currentAgentId);
        if (!agent) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: messageText,
            sender: 'user',
            imageUrl: imageFile ? URL.createObjectURL(imageFile) : undefined,
        };

        setChats(prev => ({ ...prev, [currentAgentId]: [...prev[currentAgentId], userMessage] }));
        setLoading(true);

        try {
            if (currentAgentId === 'super_boss') {
                const { summary, involvedAgentIds, textResponse } = await generateSuperBossAnalysis(userProfile, chats[currentAgentId], messageText);
                setLoading(false);

                if (textResponse) {
                    // It's a simple text response (e.g., a greeting)
                    const bossMessage: Message = {
                        id: `${Date.now()}-boss-greeting`,
                        text: textResponse,
                        sender: 'agent',
                        agent: SUPER_BOSS
                    };
                    typeMessage(currentAgentId, bossMessage);
                } else if (summary) {
                    // It's an analysis response
                    const bossResponseText = `Entendido. Analisando seu problema: "${summary}". Vou consultar os especialistas necessários e compilar uma análise completa para você.`;
                    const bossMessage: Message = {
                        id: `${Date.now()}-boss-analysis`,
                        text: bossResponseText,
                        sender: 'agent',
                        agent: SUPER_BOSS
                    };

                    typeMessage(currentAgentId, bossMessage, async () => {
                        const involvedAgents = involvedAgentIds.map(id => ALL_AGENTS_MAP.get(id)).filter((a): a is Agent => !!a);
                        if (involvedAgents.length === 0) {
                             setCurrentAnalysis({
                                problem: summary,
                                solutions: [{
                                    agent: SUPER_BOSS,
                                    solution: "Não identifiquei agentes específicos para este problema. Poderia fornecer mais detalhes?"
                                }]
                            });
                            setTimeout(() => setView('analysis'), 500);
                            return;
                        }

                        const results = await Promise.allSettled(involvedAgents.map(async agent => {
                            const specialistPrompt = `O SuperBoss já centralizou a análise do problema do usuário, que é: "${summary}". Sua tarefa é focar EXCLUSIVAMENTE em sua especialidade para fornecer uma solução direta e concisa. NÃO REPITA a análise do problema. Vá direto ao ponto com sua solução.`;
                            try {
                                const solution = await generateChatResponse(agent, userProfile, [], specialistPrompt, undefined, true);
                                return { agent, solution: solution.text };
                            } catch (err) {
                                console.error(`Falha ao obter solução de ${agent.name}:`, err);
                                // Fallback textual solution to avoid blocking the entire analysis
                                return { agent, solution: `Tive um problema ao gerar um visual ou resposta completa. Como especialista em ${agent.specialty}, recomendo focar em um plano de ação direto: 1) diagnóstico breve; 2) medidas principais; 3) KPI de acompanhamento.` };
                            }
                        }));

                        const agentSolutions = results
                            .filter(r => r.status === 'fulfilled')
                            .map(r => (r as PromiseFulfilledResult<{ agent: Agent; solution: string }>).value);

                        setCurrentAnalysis({
                            problem: summary,
                            solutions: agentSolutions
                        });
                        setTimeout(() => setView('analysis'), 500);
                    });
                }
            } else {
                let imagePayload;
                if (imageFile && agent.canHandleImages) {
                    const base64Data = await fileToBase64(imageFile);
                    imagePayload = {
                        data: base64Data.split(',')[1],
                        mimeType: imageFile.type,
                    };
                }

                const { text, imageUrl } = await generateChatResponse(agent, userProfile, chats[currentAgentId], messageText, imagePayload);
                setLoading(false);

                const agentMessage: Message = {
                    id: `${Date.now()}-agent`,
                    text: text || '', // Ensure text is always a string, even if empty.
                    imageUrl: imageUrl,
                    sender: 'agent',
                    agent: agent
                };
                typeMessage(currentAgentId, agentMessage);
            }
        } catch (error) {
            setLoading(false);
            console.error("Error communicating with Gemini API:", error);
            const errorMessage: Message = {
                id: `${Date.now()}-error`,
                text: "Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.",
                sender: 'agent',
                agent: agent,
            };
            setChats(prev => ({ ...prev, [currentAgentId]: [...prev[currentAgentId], errorMessage] }));
        }
    }, [userProfile, activeAgentId, chats, setCurrentAnalysis, setView]);
    
    if (isOnboardingOpen || isProfileModalOpen) {
        return <OnboardingModal onSave={handleSaveProfile} initialProfile={userProfile ?? undefined} onClose={() => setIsProfileModalOpen(false)} />;
    }

    if (!userProfile) {
        return <div className="flex items-center justify-center h-screen">Carregando perfil...</div>;
    }
    
    const activeAgent = activeAgentId ? ALL_AGENTS_MAP.get(activeAgentId) : null;
    
    return (
        <div className="h-screen w-screen flex font-sans">
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex-shrink-0`}>
                {isSidebarOpen && 
                    <Sidebar 
                        onSelectArea={handleSelectArea} 
                        onSelectSuperBoss={handleSelectSuperBoss} 
                        activeArea={activeArea}
                        activeAgentId={activeAgentId}
                        onOpenHistory={handleOpenHistory} // Pass onOpenHistory to Sidebar
                    />
                }
            </div>
            <div className={`flex-1 flex flex-col h-full overflow-hidden`}>
                <Header 
                    toggleSidebar={toggleSidebar}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    userProfile={userProfile}
                    onEditProfile={handleEditProfile}
                    onSaveSession={saveCurrentSession} // Pass saveCurrentSession to Header
                />
                <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-800">
                    {view === 'agent-selection' && (
                        <AgentSelectionPanel 
                            area={activeArea}
                            agents={AGENTS[activeArea]}
                            onSelectAgent={handleSelectAgent}
                        />
                    )}
                    {view === 'chat' && activeAgent && (
                         <ChatView
                            agent={activeAgent}
                            messages={chats[activeAgent.id]}
                            onSendMessage={handleSendMessage}
                            loading={loading}
                            onBack={handleBackToSelection}
                            onClearConversation={() => handleClearConversation(activeAgent.id)}
                         />
                    )}
                    {view === 'analysis' && currentAnalysis && userProfile && (
                        <AnalysisPanel 
                            analysis={currentAnalysis} 
                            onBack={handleBackToSelection} 
                            userProfile={userProfile} 
                        />
                    )}
                    {view === 'history' && (
                        <HistoryPanel 
                            onClose={handleCloseHistory} 
                            history={history.sessions} 
                            onLoadSession={loadSession} 
                            onDeleteSession={deleteSession} 
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;
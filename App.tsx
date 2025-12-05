
import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChatView from '@/components/ChatView';
import AnalysisPanel from '@/components/AnalysisPanel';
import ReportModal from '@/components/ReportModal';
import OnboardingModal from '@/components/OnboardingModal';
import HistoryPanel from '@/components/HistoryPanel';

import AgentSelectionPanel from '@/components/AgentSelectionPanel';
import { Message, UserProfile, Agent, Analysis, ReportData, AnalysisSession, History, AgentId, AgentArea } from '@/types';
import { ALL_AGENTS_MAP, AGENTS, SUPER_BOSS, ALL_AGENTS_LIST } from '@/constants';
import { usePlan } from '@/contexts/PlanContext';
import { getEnabledAgentIdsForAreaAndPlanAndCycle } from '@/services/planLimits';
import { getEnv } from '@/services/billingService';
import { getGeminiResponse, generateSuperBossAnalysis, generateChatResponse } from '@/services/geminiService';
import { canUseSuperBoss, getMonthlySuperBossLimit, getMonthlySuperBossCount, incrementMonthlySuperBossCount } from '@/services/usageService';
import { fileToBase64, fileToText } from '@/utils/fileUtils';
import { parseDataFile } from '@/utils/dataParsing';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import OnboardingPage from '@/pages/OnboardingPage';
import StripeSuccessPage from '@/pages/StripeSuccessPage';
import BillingPage from '@/pages/BillingPage';
import { getAgentGreeting, getSuperBossGreeting } from '@/utils/greetingConfig';
import { useToast } from '@/components/ToastProvider';

const App: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();
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
    const { plan, cycle } = usePlan();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [userProblem, setUserProblem] = useState<string>('');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => {
        return localStorage.getItem('hasOnboarded') === 'true';
    });
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
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);

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

    // Sync userProfile and hasOnboarded from localStorage whenever the route changes
    useEffect(() => {
        try {
            const savedProfile = localStorage.getItem('userProfile');
            if (savedProfile) {
                const parsed = JSON.parse(savedProfile);
                if (parsed && typeof parsed === 'object') {
                    setUserProfile(parsed);
                }
            }
            const onboarded = localStorage.getItem('hasOnboarded') === 'true';
            setHasOnboarded(onboarded);
        } catch {}
    }, [location.pathname]);

    useEffect(() => {
        if (hasOnboarded && !activeAgentId && view !== 'agent-selection') {
            setView('agent-selection');
        }
    }, [hasOnboarded, activeAgentId, view]);

    useEffect(() => {
        // Load active agent from local storage on mount
        const savedActiveAgentId = localStorage.getItem('activeAgentId');
        if (savedActiveAgentId) {
            setActiveAgentId(savedActiveAgentId as AgentId);
            setView('chat');
        }
    }, []);

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

    const handleLogout = () => {
        try {
            localStorage.removeItem('userProfile');
            localStorage.removeItem('hasOnboarded');
            localStorage.removeItem('analysisHistory');
            localStorage.removeItem('activeAgentId');
            localStorage.removeItem('imagenQuotaExhaustedUntil');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
        } catch {}

        setUserProfile({ userName: 'Usuário', userRole: 'Analista' });
        setHasOnboarded(false);
        setHistory({ sessions: [] });
        setActiveAgentId(null);
        setChats({});
        setMessages([]);
        setCurrentAnalysis(null);
        setReportData(null);
        setUserProblem('');
        setIsProfileModalOpen(false);
        setIsHistoryPanelOpen(false);
        setView('agent-selection');
        navigate('/login');
        addToast('Você saiu com sucesso.', 'success');
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
            const sessions = [newSession, ...prevHistory.sessions];
            const prunedSessions = sessions.slice(0, 50);
            const updatedHistory = { ...prevHistory, sessions: prunedSessions };
            localStorage.setItem('analysisHistory', JSON.stringify(updatedHistory));
            addToast('Sessão salva.', 'success');
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
        const agent = ALL_AGENTS_MAP[agentId];
        if (agent) {
            setActiveAgentId(agentId);
            if (!chats[agentId]) {
                setChats(prev => ({
                    ...prev,
                    [agentId]: [{
                        id: `${agent.id}-initial`,
                        text: getAgentGreeting(agent),
                        sender: 'agent',
                        agent: agent,
                    }]
                }));
            }
            setView('chat');
            navigate('/chat');
            if (isMobile) {
                setIsSidebarOpen(false);
            }
        }
    };

    const handleSelectSuperBoss = () => {
        const allowed = canUseSuperBoss(plan, cycle);
        if (!allowed) {
            const limit = getMonthlySuperBossLimit(plan, cycle);
            const used = getMonthlySuperBossCount();
            if (limit === 0) {
                addToast('Seu plano não possui acesso ao SuperBoss. Assine Pro anual ou Premium.', 'warning');
            } else {
                addToast(`Limite mensal do SuperBoss atingido (${used}/${limit}). Considere o Premium para acesso ilimitado.`, 'warning');
            }
            return;
        }
        setActiveAgentId(SUPER_BOSS.id);
        if (!chats[SUPER_BOSS.id]) {
            setChats(prev => ({
                ...prev,
                [SUPER_BOSS.id]: [{
                    id: `${SUPER_BOSS.id}-initial`,
                    text: getSuperBossGreeting(SUPER_BOSS),
                    sender: 'agent',
                    agent: SUPER_BOSS,
                }]
            }));
        }
        setView('chat');
        navigate('/chat');
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
        const agent = ALL_AGENTS_MAP[agentId];
        if (!agent) return;
        setChats(prev => ({
            ...prev,
            [agentId]: [{
                id: `${agent.id}-initial`,
                text: getAgentGreeting(agent),
                sender: 'agent',
                agent: agent,
            }]
        }));
    };

    const handleSendMessage = useCallback(async (
        messageText: string,
        imageFile?: File,
        dataFile?: File,
        documentFile?: File,
        options?: { chartType?: 'bar' | 'line' | 'pie'; labelColumnIndex?: number; valueColumnIndex?: number }
    ) => {
        if (!userProfile || !activeAgentId) return;

        // Basic client-side file validation to prevent large uploads
        const MB = 1024 * 1024;
        const MAX_IMAGE_SIZE = 4 * MB;
        const MAX_DATA_SIZE = 1 * MB;
        const MAX_DOC_SIZE = 10 * MB;
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const allowedDocTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        const allowedDataTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/json',
            'text/tab-separated-values'
        ];
        if (imageFile) {
            if (imageFile.size > MAX_IMAGE_SIZE) {
                addToast('Imagem muito grande (máx. 4MB).', 'error');
                return;
            }
            if (!allowedImageTypes.includes(imageFile.type)) {
                addToast('Formato de imagem não suportado.', 'error');
                return;
            }
        }
        if (dataFile) {
            if (dataFile.size > MAX_DATA_SIZE) {
                addToast('Arquivo de dados muito grande (máx. 1MB).', 'error');
                return;
            }
            if (!allowedDataTypes.includes(dataFile.type)) {
                addToast('Formato de dados não suportado.', 'error');
                return;
            }
        }
        if (documentFile) {
            if (documentFile.size > MAX_DOC_SIZE) {
                addToast('Documento muito grande (máx. 10MB).', 'error');
                return;
            }
            if (!allowedDocTypes.includes(documentFile.type)) {
                addToast('Formato de documento não suportado.', 'error');
                return;
            }
        }

        const currentAgentId = activeAgentId;
        const agent = ALL_AGENTS_MAP[currentAgentId];
        if (!agent) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: messageText,
            sender: 'user',
            imageUrl: imageFile ? URL.createObjectURL(imageFile) : undefined,
            dataFileName: dataFile ? dataFile.name : undefined,
            dataUrl: dataFile ? URL.createObjectURL(dataFile) : undefined,
            documentFileName: documentFile ? documentFile.name : undefined,
            documentUrl: documentFile ? URL.createObjectURL(documentFile) : undefined,
        };

        setChats(prev => ({ ...prev, [currentAgentId]: [...prev[currentAgentId], userMessage] }));
        setLoading(true);

        try {
            if (currentAgentId === 'super_boss') {
                // Gate usage before making the request
                if (!canUseSuperBoss(plan, cycle)) {
                    const limit = getMonthlySuperBossLimit(plan, cycle);
                    const used = getMonthlySuperBossCount();
                    setLoading(false);
                    const bossMessage: Message = {
                        id: `${Date.now()}-boss-limit`,
                        text: limit === 0
                            ? 'Seu plano não possui acesso ao SuperBoss. Assine Pro anual (modo leve) ou Premium para liberar.'
                            : `Você atingiu o limite mensal de interações com o SuperBoss (${used}/${limit}). Considere o Premium para acesso ilimitado.`,
                        sender: 'agent',
                        agent: SUPER_BOSS
                    };
                    typeMessage(currentAgentId, bossMessage);
                    addToast('Limite do SuperBoss atingido.', 'warning');
                    return;
                }
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
                    incrementMonthlySuperBossCount();
                } else if (summary) {
                    // It's an analysis requiring multiple agents
                    setCurrentAnalysis({ problemSummary: summary, involvedAgentIds });
                    setView('analysis');
                    incrementMonthlySuperBossCount();
                }
            } else {
                let imagePayload = undefined;
                if (imageFile && agent.canHandleImages) {
                    const base64Data = await fileToBase64(imageFile);
                    imagePayload = {
                        data: base64Data.split(',')[1],
                        mimeType: imageFile.type,
                    };
                }

                let chartData = null;
                if (dataFile && agent.canHandleDataFiles) {
                    try {
                        chartData = await parseDataFile(
                            dataFile as File,
                            options?.labelColumnIndex,
                            options?.valueColumnIndex,
                            options?.chartType
                        );
                    } catch (e) {
                        console.warn('Falha ao processar arquivo de dados:', e);
                    }
                }

                let documentContent = null;
                if (documentFile && agent.canHandleDocuments) {
                    try {
                        documentContent = await fileToText(documentFile as File);
                    } catch (e) {
                        console.warn('Falha ao processar arquivo de documento:', e);
                    }
                }

                const { text, imageUrl } = await generateChatResponse(agent, userProfile, chats[currentAgentId], messageText, imagePayload, false, chartData ?? undefined, documentContent ?? undefined);
                setLoading(false);

                const agentMessage: Message = {
                    id: `${Date.now()}-agent`,
                    text: text || '',
                    imageUrl: imageUrl,
                    sender: 'agent',
                    agent: agent
                };
                typeMessage(currentAgentId, agentMessage);
            }
        } catch (error) {
            setLoading(false);
            console.error("Error communicating with Gemini API:", error);
            const code = (error as any)?.code ?? (error as any)?.error?.code;
            const status = (error as any)?.status ?? (error as any)?.error?.status;
            const rawMsg = String((error as any)?.message ?? (error as any)?.error?.message ?? '').toLowerCase();

            let userText = `Desculpe, ${agent.name} encontrou um erro ao processar sua solicitação.`;
            if (code === 429 || status === 'RESOURCE_EXHAUSTED' || rawMsg.includes('quota') || rawMsg.includes('429') || rawMsg.includes('resource exhausted')) {
                userText = `O agente ${agent.name} atingiu o limite de uso da API no momento. Aguarde alguns segundos e tente novamente.`;
            } else if (rawMsg.includes('network') || rawMsg.includes('fetch') || rawMsg.includes('timeout')) {
                userText = `Parece ter ocorrido um problema de conexão. Verifique sua rede e tente novamente.`;
            } else if (rawMsg.includes('api_key') || rawMsg.includes('api key')) {
                userText = `Chave da API ausente ou inválida. Configure sua chave e tente novamente.`;
            } else {
                const brief = rawMsg.replace(/\s+/g, ' ').slice(0, 120);
                if (brief) userText += ` Detalhe: ${brief}.`;
                else userText += ` Por favor, tente novamente.`;
            }

            const errorMessage: Message = {
                id: `${Date.now()}-error`,
                text: userText,
                sender: 'agent',
                agent: agent
            };
            typeMessage(currentAgentId, errorMessage);
            addToast('Erro ao processar solicitação.', 'error');
        }
    }, [activeAgentId, chats, userProfile, typeMessage]);

    // Removido retorno antecipado do OnboardingModal para não bloquear a Landing Page

    const activeAgent = activeAgentId ? ALL_AGENTS_MAP[activeAgentId] : null;
    
    const isProfileComplete = !!(userProfile.userName && userProfile.companyName && userProfile.companyField && userProfile.userRole && userProfile.companySize && userProfile.companyStage && userProfile.mainProduct && userProfile.targetAudience && userProfile.mainChallenge);

    return (
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/stripe-success" element={<StripeSuccessPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/chat" element={(
                    !isProfileComplete ? <Navigate to="/onboarding" /> :
                    <div className="h-screen w-screen flex font-sans">
                        {/**
                         * Mobile: Sidebar é fixa e desliza com translate-x.
                         * Desktop: Sidebar é relativa e colapsa largura (w-64 -> w-0) para permitir expansão do painel.
                         */}
                        <div
                            className={
                                `${isMobile ? 'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out w-64' : 'relative transition-all duration-300 ease-in-out'} ` +
                                `${isMobile ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') : (isSidebarOpen ? 'w-64' : 'w-0')}` +
                                ` bg-white dark:bg-gray-900`
                            }
                        >
                            {/** Render sempre; no desktop com w-0 fica invisível e não ocupa espaço. */}
                            {isSidebarOpen && (
                                <Sidebar 
                                    onSelectArea={handleSelectArea} 
                                    onSelectSuperBoss={handleSelectSuperBoss} 
                                    activeArea={activeArea}
                                    activeAgentId={activeAgentId}
                                    onOpenHistory={handleOpenHistory}
                                />
                            )}
                        </div>
                        <div className={`flex-1 flex flex-col h-full overflow-hidden`}>
                            <Header 
                                toggleSidebar={toggleSidebar}
                                theme={theme}
                                toggleTheme={toggleTheme}
                                userProfile={userProfile}
                                onEditProfile={handleEditProfile}
                                onSaveSession={saveCurrentSession}
                                onLogout={handleLogout}
                                onUpgrade={() => addToast('Planos e preços em breve.', 'info')}
                            />
                            <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-800">
                                <>
                                    {isProfileModalOpen && (
                                        <OnboardingModal
                                            onSave={handleSaveProfile}
                                            initialProfile={userProfile}
                                        />
                                    )}
            {view === 'agent-selection' && (
                (() => {
                    const gatingEnv = (getEnv('VITE_AGENT_GATING_ENABLED', 'true') || 'true').toLowerCase();
                    const isEnvEnabled = gatingEnv === 'true' || gatingEnv === '1' || gatingEnv === 'yes';
                    const qs = new URLSearchParams(location.search);
                    const debugAllAgents = qs.get('debug') === 'all-agents' || localStorage.getItem('debugAllAgents') === 'true';
                    const gatingEnabled = isEnvEnabled && !debugAllAgents;
                    const allowedIds = gatingEnabled ? new Set(getEnabledAgentIdsForAreaAndPlanAndCycle(activeArea, plan, cycle)) : null;
                    const visibleAgents = gatingEnabled
                        ? AGENTS.filter(a => a.area === activeArea && allowedIds!.has(a.id))
                        : AGENTS.filter(a => a.area === activeArea);
                    return (
                        <AgentSelectionPanel
                            area={activeArea}
                            agents={visibleAgents}
                            onSelectAgent={handleSelectAgent}
                        />
                    );
                })()
            )}
                                    {view === 'chat' && activeAgent && (
                                        <ChatView
                                            agent={activeAgent}
                                            messages={chats[activeAgent.id] || []}
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
                                </>
                            </main>
                        </div>
                    </div>
                )} />
            </Routes>
    );
};

export default App;
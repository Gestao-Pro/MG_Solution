
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, Agent, Message, Analysis, AgentId, AgentArea } from './types';
import OnboardingModal from './components/OnboardingModal';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import AnalysisPanel from './components/AnalysisPanel';
import Header from './components/Header';
import AgentSelectionPanel from './components/AgentSelectionPanel';
import { AGENTS, SUPER_BOSS, ALL_AGENTS_MAP } from './constants';
import { generateChatResponse, generateSuperBossAnalysis } from './services/geminiService';

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });


const App: React.FC = () => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('gestaoProTheme') as 'light' | 'dark') || 'dark';
    });
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    
    const [activeArea, setActiveArea] = useState<AgentArea>('Estratégia');
    const [activeAgentId, setActiveAgentId] = useState<AgentId | null>(null);
    const [view, setView] = useState<'agent-selection' | 'chat' | 'analysis'>('agent-selection');
    
    const [chats, setChats] = useState<Record<AgentId, Message[]>>(() => {
        const initialChats: Record<AgentId, Message[]> = {};
        ALL_AGENTS_MAP.forEach(agent => {
            initialChats[agent.id] = [{
                id: `${agent.id}-initial`,
                text: `Olá! Eu sou ${agent.name}, ${agent.specialty}. Como posso te ajudar hoje?`,
                sender: 'agent',
                agent: agent,
            }];
        });
        return initialChats;
    });
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<Analysis | null>(null);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('gestaoProTheme', theme);
    }, [theme]);

    useEffect(() => {
        try {
            const savedProfile = localStorage.getItem('gestaoProUserProfile');
            if (savedProfile) {
                setUserProfile(JSON.parse(savedProfile));
            } else {
                setIsOnboardingOpen(true);
            }
        } catch (error) {
            console.error("Failed to parse user profile from localStorage", error);
            setIsOnboardingOpen(true);
        }
    }, []);

    const handleSaveProfile = (profile: UserProfile) => {
        setUserProfile(profile);
        localStorage.setItem('gestaoProUserProfile', JSON.stringify(profile));
        setIsOnboardingOpen(false);
    };

    const handleSelectAgent = (agentId: AgentId) => {
        setActiveAgentId(agentId);
        setView('chat');
    };
    
    const handleSelectArea = (area: AgentArea) => {
        setActiveArea(area);
        setActiveAgentId(null);
        setView('agent-selection');
    };

    const handleSelectSuperBoss = () => {
        setActiveAgentId(SUPER_BOSS.id);
        setView('chat');
    };

    const handleBackToSelection = () => {
        setView('agent-selection');
        setAnalysis(null);
        setActiveAgentId(null);
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
                             setAnalysis({
                                problem: summary,
                                solutions: [{
                                    agent: SUPER_BOSS,
                                    solution: "Não identifiquei agentes específicos para este problema. Poderia fornecer mais detalhes?"
                                }]
                            });
                            setTimeout(() => setView('analysis'), 500);
                            return;
                        }

                        const agentSolutions = await Promise.all(involvedAgents.map(async agent => {
                            const specialistPrompt = `O SuperBoss já centralizou a análise do problema do usuário, que é: "${summary}". Sua tarefa é focar EXCLUSIVAMENTE em sua especialidade para fornecer uma solução direta e concisa. NÃO REPITA a análise do problema. Vá direto ao ponto com sua solução.`;
                            const solution = await generateChatResponse(agent, userProfile, [], specialistPrompt, undefined, true);
                            return { agent, solution: solution.text };
                        }));
    
                        setAnalysis({
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
    }, [userProfile, activeAgentId, chats]);
    
    if (isOnboardingOpen) {
        return <OnboardingModal onSave={handleSaveProfile} />;
    }

    if (!userProfile) {
        return <div className="flex items-center justify-center h-screen">Carregando perfil...</div>;
    }
    
    const activeAgent = activeAgentId ? ALL_AGENTS_MAP.get(activeAgentId) : null;
    
    return (
        <div className="h-screen w-screen flex font-sans">
            <div className={`${isSidebarVisible ? 'w-full md:w-64' : 'w-0'} transition-all duration-300`}>
                {isSidebarVisible && 
                    <Sidebar 
                        onSelectArea={handleSelectArea} 
                        onSelectSuperBoss={handleSelectSuperBoss} 
                        activeArea={activeArea}
                        activeAgentId={activeAgentId}
                    />
                }
            </div>
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <Header 
                    toggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
                    theme={theme}
                    toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
                    userProfile={userProfile}
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
                        />
                    )}
                    {view === 'analysis' && analysis && userProfile && (
                        <AnalysisPanel 
                            analysis={analysis} 
                            onBack={handleBackToSelection} 
                            userProfile={userProfile} 
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;
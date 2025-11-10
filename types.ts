

export type AgentArea = 'Estratégia' | 'Vendas' | 'Marketing' | 'Pessoas' | 'Processos' | 'Finanças' | 'Criativo' | 'BI';
export type AgentId = string;

export interface Agent {
    id: AgentId;
    name: string;
    specialty: string;
    area: AgentArea;
    avatar: string; // Changed from ComponentType to string
    voice: string;
    gender: 'male' | 'female';
    systemInstruction: string;
    canHandleImages?: boolean;
}

export interface UserProfile {
    userName: string;
    companyName: string;
    companyField: string;
    userRole: string;
    companySize: string;
    companyStage: string;
    mainProduct: string;
    targetAudience: string;
    mainChallenge: string;
}

export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'agent';
    agent?: Agent;
    audioUrl?: string;
    imageUrl?: string;
}

export interface Analysis {
    problem: string;
    solutions: { agent: Agent; solution: string }[];
}

export interface ReportData {
    rewrittenProblem: string;
    rewrittenSolutions: RewrittenSolution[];
}

// --- Tipos para o Histórico de Análises ---

export interface AnalysisSession {
    id: string;
    timestamp: string;
    userProblem: string;
    messages: Message[];
    currentAnalysis: Analysis | null;
    reportData: ReportData | null;
}

export interface History {
    sessions: AnalysisSession[];
}

export type AgentId = string;
export type AgentArea = 'Estratégia' | 'Marketing' | 'Vendas' | 'Produto' | 'Financeiro' | 'Operações' | 'RH' | 'Tecnologia' | 'Jurídico' | 'Superboss';

export interface RewrittenSolution {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
}

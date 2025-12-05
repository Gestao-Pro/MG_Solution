// Áreas suportadas na aplicação principal
export type AgentArea =
  | 'Estratégia'
  | 'Vendas'
  | 'Marketing'
  | 'Pessoas'
  | 'Processos'
  | 'Finanças';

export type AgentId = string;

export interface Message {
  id: string;
  text?: string;
  sender: 'user' | 'agent';
  agent?: Agent;
  imageUrl?: string;
  dataFileName?: string;
  dataUrl?: string;
  documentFileName?: string;
  documentUrl?: string;
}

export interface Agent {
  id: AgentId;
  name: string;
  specialty: string;
  avatarUrl: string;
  area?: AgentArea;
  systemInstruction?: string;
  // Voz preferida do agente (nome da voz do TTS)
  voice?: string;
  // Gênero do agente (usado para escolher voz adequada)
  gender?: 'male' | 'female' | 'neutral';
  canHandleImages?: boolean;
  canHandleDataFiles?: boolean;
  canHandleDocuments?: boolean;
  // Capacidade de sugerir gráficos (para BI/relatórios)
  canSuggestCharts?: boolean;
}

export interface Analysis {
  problemSummary: string;
  involvedAgentIds: AgentId[];
}

export interface ReportData {
  title?: string;
  content?: string;
  visuals?: string[];
}

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

export interface UserProfile {
  userName: string;
  userRole: string;
  companyName: string;
  companyField: string;
  companySize: string;
  companyStage: string;
  mainProduct: string;
  targetAudience: string;
  mainChallenge: string;
}

// Tipo para itens de FAQ usados na landing page
export interface FaqItem {
  question: string;
  answer: string;
}
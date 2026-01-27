// geminiService.ts
// Este arquivo é um placeholder para o serviço Gemini.
// A implementação real dependeria da integração com a API do Google Gemini.
import { getNextAgentQuestion } from '../utils/questionEngine';
import { trackEvent, getOrCreateAnonId } from './analyticsService';
import { apiFetch } from './api';
import { SUPER_BOSS, AGENTS } from '@/constants';

export const getGeminiResponse = async (prompt: string): Promise<string> => {
  console.log(`Gemini prompt: ${prompt}`);
  // Mantém função genérica para compatibilidade; delega ao backend em rota de chat
  try {
    const token = localStorage.getItem('authToken');
    const resp = await apiFetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ message: prompt, agent: { name: 'Genérico', area: 'Estratégia', specialty: 'Assistente' } })
    });
    if (!resp.ok) throw new Error('Falha ao gerar resposta (genérico)');
    const data = await resp.json();
    return String(data?.text || '');
  } catch (e) {
    console.warn('Fallback getGeminiResponse:', e);
    return `Resposta indisponível agora. Tente novamente em instantes.`;
  }
};

// Substituindo a função generateSpeech para chamar o backend
export const generateSpeech = async (
  text: string,
  preferredVoice?: string,
  fallbackVoice?: string
): Promise<string> => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await apiFetch('/api/generate-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        text,
        voice: preferredVoice || fallbackVoice || "Kore",
        languageCode: "pt-BR", // Hardcoded for now, can be dynamic if needed
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Falha ao gerar áudio no backend.');
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    return audioUrl;
  } catch (error) {
    console.error("Failed to generate speech:", error);
    throw error;
  }
};

import { Analysis, UserProfile } from '@/types';

export type PdfReportSolutionFromApi = {
  agentId: string;
  rewrittenSolution: string;
  visualPrompt?: string;
  visualTitle?: string;
};

export type PdfReportResponse = {
  rewrittenProblem: string;
  rewrittenSolutions: PdfReportSolutionFromApi[];
};

export const generatePdfReportContent = async (
  input: { analysis: Analysis; userProfile: UserProfile }
): Promise<PdfReportResponse> => {
  const { analysis, userProfile } = input;
  console.log(`Gerando conteúdo de relatório PDF para análise: ${JSON.stringify(analysis)} e perfil: ${JSON.stringify(userProfile)}`);

  // Geração simples e determinística baseada nos dados já disponíveis
  const companyBits = [
    userProfile.companyName,
    userProfile.companyField,
    userProfile.companyStage,
  ].filter(Boolean).join(' · ');

  const rewrittenProblem = `Resumo executivo: ${analysis.problemSummary}. Contexto: ${companyBits || '—'}.`;

  const rewrittenSolutions: PdfReportSolutionFromApi[] = (analysis.involvedAgentIds || []).map((agentId: string) => ({
    agentId,
    rewrittenSolution: `Recomendação inicial para ${agentId}: **Direção:** Foque nas ações com maior impacto e menor complexidade. *Passo 1:* Defina 1 objetivo claro; *Passo 2:* Liste 2 iniciativas; *Passo 3:* Estabeleça um KPI para acompanhamento.`,
    visualPrompt: `Visual simples para agente ${agentId}: gráfico ou diagrama de etapas.`,
    visualTitle: `Visual de apoio – ${agentId}`,
  }));

  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ rewrittenProblem, rewrittenSolutions });
    }, 800);
  });
};

export const generateVisualForReport = async (prompt: string | Record<string, unknown>): Promise<string> => {
  const desc = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
  console.log(`Gerando visual para o relatório a partir do prompt: ${desc}`);
  // Simulação de geração de visual (retorna URL dummy de imagem SVG)
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgc3Ryb2tlPSJibHVlIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9ImxpZ2h0Ymx1ZSIgLz48L3N2Zz4=');
    }, 700);
  });
};

// Placeholders compatíveis com o uso no App.tsx
// Compatível com chamadas atuais do App.tsx
export const generateSuperBossAnalysis = async (
  userProfile: any,
  chatHistory: any,
  messageText: string,
  ...rest: any[]
): Promise<{ summary: string; involvedAgentIds: string[]; textResponse?: string }> => {
  try {
    const token = localStorage.getItem('authToken');
    const resp = await apiFetch('/api/ai/superboss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        message: messageText,
        userProfile,
        chatHistory,
        systemInstruction: SUPER_BOSS.systemInstruction
      })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error || 'Falha ao gerar análise do SuperBoss.');
    }
    const data = await resp.json();
    const fullText = String(data?.text || '');
    const extractJson = (): any | null => {
      try {
        const match = fullText.match(/\{[\s\S]*\}$/m);
        if (!match) return null;
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    };
    const json = extractJson();
    if (json && (json.summary || json.areas)) {
      const summary: string = String(json.summary || '').trim();
      const areas: string[] = Array.isArray(json.areas) ? json.areas : [];
      const normalizedAreas = areas.map(a => String(a || '').toLowerCase());
      const involvedAgentIds: string[] = AGENTS
        .filter(a => normalizedAreas.includes(String(a.area || '').toLowerCase()))
        .slice(0, 4)
        .map(a => a.id);
      return { summary, involvedAgentIds };
    }
    return { summary: '', involvedAgentIds: [], textResponse: fullText };
  } catch (e) {
    console.warn('Falha generateSuperBossAnalysis, fallback local.', e);
    const firstName = String(userProfile?.userName || '').split(' ')[0];
    const hi = `Olá${firstName ? `, ${firstName}` : ''}! Qual desafio quer trabalhar primeiro hoje?`;
    return { summary: '', involvedAgentIds: [], textResponse: hi };
  }
};

export const generateChatResponse = async (
  agent: any,
  userProfile: any,
  chatHistory: any,
  message: string,
  imagePayloads?: { data: string; mimeType: string }[] | undefined,
  useStreaming?: boolean,
  chartData?: any,
  documentContent?: any
): Promise<{ text: string; imageUrl?: string; promptText?: string }> => {
  console.log('generateChatResponse input:', { agent, userProfile, chatHistory, message, imagePayloads, useStreaming, chartData, documentContent });
  try {
    const { question, stage, greetingPrefix } = getNextAgentQuestion(agent, userProfile, Array.isArray(chatHistory) ? chatHistory : [], message);
    try {
      const userId = getOrCreateAnonId();
      await trackEvent('question_asked', { agentId: agent?.id, area: agent?.area, stage, userId });
    } catch {}

    const guidance = (() => {
      const prefix = greetingPrefix ? `${greetingPrefix} ` : '';
      const specialty = String(agent?.specialty || '').trim();
      const base = stage === 'diagnostico' && specialty ? `Sou especialista em ${specialty}. ` : '';
      return `${prefix}${base}${question}`.trim();
    })();

    const token = localStorage.getItem('authToken');
    const resp = await apiFetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ message, agent, userProfile, chatHistory, guidance, stage, chartData, documentContent, imagePayloads })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error || 'Falha ao gerar resposta do agente.');
    }
    const data = await resp.json();
    return { text: String(data?.text || '').trim(), imageUrl: data?.imageUrl, promptText: data?.promptText };
  } catch (e: any) {
    console.warn('Falha generateChatResponse; usando fallback simples.', e);
    const errorMsg = String(e?.message || e);
    if (errorMsg.includes('GEMINI_API_KEY')) {
       return { text: '⚠️ **Erro Crítico de Configuração**\n\nNão consigo processar sua solicitação porque a chave de API do Gemini (`GEMINI_API_KEY`) não está configurada no servidor backend.\n\nPara corrigir:\n1. Abra o arquivo `.env` na raiz do projeto.\n2. Adicione sua chave em `VITE_GEMINI_API_KEY=sua_chave_aqui`.\n3. Reinicie o servidor.\n\nSem isso, não posso "ver" sua imagem nem gerar o prompt que você pediu.', imageUrl: undefined };
    }
    if (errorMsg.includes('503') || errorMsg.includes('overloaded')) {
       return { text: '⚠️ **Serviço Sobrecarregado**\n\nO modelo de IA do Google (Gemini) está temporariamente indisponível ou sobrecarregado (Erro 503). Isso não é um erro do seu código, mas uma instabilidade momentânea da API do Google.\n\nTente novamente em alguns segundos.', imageUrl: undefined };
    }
    return { text: 'Vamos começar pelo essencial: qual prioridade quer trabalhar agora?', imageUrl: undefined };
  }
};


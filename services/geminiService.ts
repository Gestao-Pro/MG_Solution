// geminiService.ts
// Este arquivo é um placeholder para o serviço Gemini.
// A implementação real dependeria da integração com a API do Google Gemini.
import { getNextAgentQuestion, detectEntities } from '../utils/questionEngine';
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

import { Analysis, UserProfile, Message } from '@/types';

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
  input: { analysis: Analysis; userProfile: UserProfile; chatHistory?: Message[]; agentName?: string; agentSpecialty?: string }
): Promise<PdfReportResponse> => {
  const { analysis, userProfile, chatHistory, agentName, agentSpecialty } = input;
  console.log(`[PDF] Gerando conteúdo para agente: ${agentName}, mensagens no histórico: ${chatHistory?.length ?? 0}`);

  // ── Caminho principal: agente individual com histórico de conversa ──
  if (chatHistory && chatHistory.length > 0 && analysis.involvedAgentIds.length === 1) {
    const agentId = analysis.involvedAgentIds[0];
    const foundAgent = AGENTS.find(a => a.id === agentId);
    const resolvedAgentName = agentName || foundAgent?.name || agentId;
    const resolvedAgentSpecialty = agentSpecialty || foundAgent?.specialty || analysis.problemSummary;

    try {
      const token = localStorage.getItem('authToken');
      const resp = await apiFetch('/api/ai/report-synthesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          agentName: resolvedAgentName,
          agentSpecialty: resolvedAgentSpecialty,
          chatHistory,
          userProfile,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData?.error || `HTTP ${resp.status}`);
      }

      const data = await resp.json();

      return {
        rewrittenProblem: data.rewrittenProblem || `Sessão de consultoria com ${agentName || agentId}.`,
        rewrittenSolutions: [{
          agentId,
          rewrittenSolution: data.rewrittenSolution || `Recomendações geradas na conversa.`,
          visualPrompt: data.visualPrompt || `Professional business consulting diagram, clean minimalist design.`,
          visualTitle: data.visualTitle || `Diagrama de Apoio`,
        }],
      };
    } catch (err) {
      console.error('[PDF] Falha no endpoint report-synthesis, usando fallback:', err);
      // Fallback: usar a última mensagem do agente
      const agentMsgs = chatHistory.filter(m => m.sender === 'agent' && m.text);
      const lastAgentText = agentMsgs[agentMsgs.length - 1]?.text || 'Sem recomendações disponíveis.';
      return {
        rewrittenProblem: analysis.problemSummary,
        rewrittenSolutions: [{
          agentId,
          rewrittenSolution: lastAgentText,
          visualPrompt: `Professional business consulting diagram, clean minimalist design.`,
          visualTitle: `Diagrama de Apoio`,
        }],
      };
    }
  }

  // ── Fallback para múltiplos agentes ou sem histórico ──
  const companyBits = [
    userProfile.companyName,
    userProfile.companyField,
    userProfile.companyStage,
  ].filter(Boolean).join(' · ');

  const rewrittenProblem = `Resumo executivo: ${analysis.problemSummary}. Contexto: ${companyBits || '—'}.`;

  const rewrittenSolutions: PdfReportSolutionFromApi[] = (analysis.involvedAgentIds || []).map((agentId: string) => ({
    agentId,
    rewrittenSolution: `**Direção Estratégica:** Foque nas ações com maior impacto e menor complexidade.\n\n*Passo 1:* Defina 1 objetivo claro;\n*Passo 2:* Liste 2 iniciativas prioritárias;\n*Passo 3:* Estabeleça um KPI para acompanhamento.`,
    visualPrompt: `Professional business strategy roadmap diagram for ${agentId}, clean minimalist design.`,
    visualTitle: `Mapa Estratégico – ${agentId}`,
  }));

  return { rewrittenProblem, rewrittenSolutions };
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
    
    // Adiciona instrução negativa para o SuperBoss também
    const entities = detectEntities(Array.isArray(chatHistory) ? chatHistory : []);
    const infoAvoid = [
      entities.hasObjective ? 'objetivo' : '',
      entities.hasTone ? 'tom de voz' : '',
      entities.hasFrequency ? 'frequência' : '',
      entities.hasAudience ? 'público' : '',
      entities.hasMetric ? 'métricas' : ''
    ].filter(Boolean).join(', ');

    const systemInstruction = SUPER_BOSS.systemInstruction + 
      (infoAvoid ? `\n\nIMPORTANTE: O usuário já informou sobre ${infoAvoid}. Não pergunte novamente sobre isso e use essas informações para sua análise.` : '');

    const resp = await apiFetch('/api/ai/superboss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        message: messageText,
        userProfile,
        chatHistory,
        systemInstruction: systemInstruction
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
): Promise<{ text: string; imageUrl?: string; imageUrls?: string[]; promptText?: string }> => {
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

    const agentWithGlobalInstruction = {
      ...agent,
      systemInstruction: `${agent?.systemInstruction || ''}\n\nIMPORTANTE: Quando você concluir sua análise, responder todas as dúvidas e considerar que o seu trabalho final está pronto para este atendimento, adicione OBRIGATORIAMENTE a tag [ANALISE_CONCLUIDA] no final da sua mensagem. Essa tag não aparecerá para o usuário, ela serve para o sistema saber que pode liberar o botão de relatório.`
    };

    const token = localStorage.getItem('authToken');
    const resp = await apiFetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ message, agent: agentWithGlobalInstruction, userProfile, chatHistory, guidance, stage, chartData, documentContent, imagePayloads })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error || 'Falha ao gerar resposta do agente.');
    }
    const data = await resp.json();
    return {
      text: String(data?.text || '').trim(),
      imageUrl: data?.imageUrl,
      imageUrls: Array.isArray(data?.imageUrls) ? data.imageUrls : undefined,
      promptText: data?.promptText
    };
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


// geminiService.ts
// Este arquivo é um placeholder para o serviço Gemini.
// A implementação real dependeria da integração com a API do Google Gemini.
import { getNextAgentQuestion } from '../utils/questionEngine';
import { trackEvent, getOrCreateAnonId } from './analyticsService';
import { apiFetch } from './api';

export const getGeminiResponse = async (prompt: string): Promise<string> => {
  console.log(`Gemini prompt: ${prompt}`);
  // Simulação de uma resposta do Gemini
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(`Resposta simulada do Gemini para: "${prompt}"`);
    }, 1500);
  });
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

export const generatePdfReportContent = async (reportData: Record<string, unknown>): Promise<string> => {
  console.log(`Gerando conteúdo de relatório PDF para os dados: ${JSON.stringify(reportData)}`);
  // Simulação de geração de conteúdo de PDF (retorna string dummy)
  return new Promise(resolve => {
    setTimeout(() => {
      resolve("%PDF-1.4\nDummy PDF content simulado para o relatório");
    }, 1200);
  });
};

export const generateVisualForReport = async (reportData: Record<string, unknown>): Promise<string> => {
  console.log(`Gerando visual para o relatório com dados: ${JSON.stringify(reportData)}`);
  // Simulação de geração de visual (retorna URL dummy de imagem SVG)
  return new Promise(resolve => {
    setTimeout(() => {
      resolve("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgc3Ryb2tlPSJibHVlIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9ImxpZ2h0Ymx1ZSIgLz48L3N2Zz4=");
    }, 1500);
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
  console.log('generateSuperBossAnalysis input:', { userProfile, chatHistory, messageText, rest });
  const normalize = (s?: any) => String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const isGreeting = (s: string): boolean => {
    const n = normalize(s);
    return ['oi','ola','olá','bom dia','boa tarde','boa noite','hey','hello'].some(t => n.includes(normalize(t)));
  };
  const firstName = String(userProfile?.userName || '').split(' ')[0];

  return new Promise(resolve => {
    setTimeout(() => {
      if (isGreeting(messageText) || (!messageText || messageText.trim().length < 3)) {
        const hi = `Boa ${normalize(messageText).includes('noite') ? 'noite' : normalize(messageText).includes('tarde') ? 'tarde' : 'dia'}${firstName ? `, ${firstName}` : ''}!`;
        const q = userProfile?.mainChallenge
          ? ' Qual desafio você quer trabalhar primeiro hoje?'
          : ' Qual desafio do seu negócio você quer trabalhar primeiro hoje?';
        resolve({ summary: '', involvedAgentIds: [], textResponse: `${hi}${q}` });
        return;
      }
      resolve({
        summary: `Resumo inicial: ${messageText}`,
        involvedAgentIds: ['marketing_agent', 'sales_agent'],
      });
    }, 800);
  });
};

export const generateChatResponse = async (
  agent: any,
  userProfile: any,
  chatHistory: any,
  message: string,
  imagePayload?: { data: string; mimeType: string } | undefined,
  useStreaming?: boolean,
  chartData?: any,
  documentContent?: any
): Promise<{ text: string; imageUrl?: string }> => {
  console.log('generateChatResponse input:', { agent, userProfile, chatHistory, message, imagePayload, useStreaming, chartData, documentContent });

  const normalize = (s?: any) => String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const findIndexByTokens = (labels: any[], tokens: string[]): number => {
    for (let i = 0; i < labels.length; i++) {
      const labNorm = normalize(labels[i]);
      for (const t of tokens) {
        const tn = normalize(t);
        if (labNorm.includes(tn)) return i;
      }
    }
    return -1;
  };

  const formatPercent = (n: number) => `${(n).toFixed(2)}%`;
  const formatNumber = (n: number) => {
    const v = Number(n);
    if (!isFinite(v)) return String(n);
    return v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  };

  // If we have data file parsed content, try to produce an analysis
  if (chartData && Array.isArray(chartData.labels) && Array.isArray(chartData.values)) {
    try {
      const labels = chartData.labels;
      const values = chartData.values.map((v: any) => typeof v === 'number' ? v : Number(String(v).replace(',', '.')));

      const msgNorm = normalize(message);
      const asksJulNov = msgNorm.includes('julho') || msgNorm.includes('jul') || msgNorm.includes('novembro') || msgNorm.includes('nov');

      const idxJulho = findIndexByTokens(labels, ['julho','jul']);
      const idxNovembro = findIndexByTokens(labels, ['novembro','nov']);

      if (asksJulNov && idxJulho !== -1 && idxNovembro !== -1) {
        const valJulho = values[idxJulho];
        const valNovembro = values[idxNovembro];
        if (isFinite(valJulho) && isFinite(valNovembro) && valJulho !== 0) {
          const delta = valNovembro - valJulho;
          const percentChange = (delta / valJulho) * 100; // negative means queda
          const isDrop = percentChange < 0;
          const pctAbs = Math.abs(percentChange);
          const directionWord = isDrop ? 'queda' : 'alta';
          const text = `Entre Julho (${formatNumber(valJulho)}) e Novembro (${formatNumber(valNovembro)}), o percentual de ${directionWord} do total de peso é ${formatPercent(pctAbs)}.`;
          return { text };
        }
      }

      // Fallback summary if specific months not found
      const total = values.reduce((acc: number, v: number) => acc + (isFinite(v) ? v : 0), 0);
      const avg = values.length ? total / values.length : 0;
      const min = Math.min(...values.filter((v: number) => isFinite(v)));
      const max = Math.max(...values.filter((v: number) => isFinite(v)));
      const text = `Resumo dos dados:
• Registros: ${values.length}
• Soma total: ${formatNumber(total)}
• Média: ${formatNumber(avg)}
• Mínimo: ${isFinite(min) ? formatNumber(min) : '—'}
• Máximo: ${isFinite(max) ? formatNumber(max) : '—'}

Se precisar, informe exatamente quais colunas representam mês e total para análise específica (ex.: Julho vs Novembro).`;
      return { text };
    } catch (e) {
      console.warn('Falha ao gerar análise a partir de chartData:', e);
      return { text: `Não consegui processar o arquivo de dados. Verifique o formato (CSV/XLSX/TSV/JSON) e tente novamente.` };
    }
  }

  // If we have document content and the agent supports documents, provide a basic summary
  if (documentContent && agent?.canHandleDocuments) {
    try {
      const textStr = String(documentContent ?? '');
      const length = textStr.length;
      const wordCount = (textStr.trim().match(/\S+/g) || []).length;
      const text = `Documento recebido com ~${wordCount} palavras. Me diga quais pontos deseja analisar que eu aprofundo, ou pergunte por um resumo executivo.`;
      return { text };
    } catch (e) {
      console.warn('Falha ao sumarizar documento:', e);
      return { text: 'Recebi o documento, mas não consegui processá-lo. Tente um PDF/DOCX mais simples ou forneça instruções específicas.' };
    }
  }

  // If we have an image payload, return a placeholder acknowledgement
  if (imagePayload && agent?.canHandleImages) {
    return {
      text: 'Imagem recebida. Descreva a análise desejada e eu sigo com a interpretação.',
      imageUrl: 'https://via.placeholder.com/256x256.png?text=Imagem'
    };
  }

  // Default path (no attachments or unsupported): usar motor de perguntas por agente
  try {
    const { question, stage, greetingPrefix } = getNextAgentQuestion(agent, userProfile, Array.isArray(chatHistory) ? chatHistory : [], message);
    // Telemetria de pergunta feita
    try {
      const userId = getOrCreateAnonId();
      await trackEvent('question_asked', { agentId: agent?.id, area: agent?.area, stage, userId });
    } catch {}

    const prefix = greetingPrefix ? `${greetingPrefix} ` : '';
    const specialty = String(agent?.specialty || '').trim();
    // Evitar repetir a apresentação: só incluir na primeira pergunta (diagnóstico)
    const base = stage === 'diagnostico' && specialty ? `Sou especialista em ${specialty}. ` : '';

    // Orientação prática simples quando o usuário demonstra dúvida, aplicada a todas as áreas
    const nMsg = normalize(message);
    const isUnsure = [
      'nao sei','não sei','me ajuda','me ajudar','pode ajudar','nao entendo','não entendo',
      'duvida','dúvida','tô perdido','to perdido','perdido','confuso','não entendi','nao entendi','help'
    ].some(t => nMsg.includes(t));

    const getAreaKey = (area: string): string | null => {
      const a = normalize(area);
      if (!a) return null;
      if (a.includes('financ')) return 'financas';
      if (a.includes('venda')) return 'vendas';
      if (a.includes('market')) return 'marketing';
      if (a.includes('pessoa')) return 'pessoas';
      if (a.includes('process')) return 'processos';
      if (a.includes('estrateg')) return 'estrategia';
      if (a.includes('criativ')) return 'criativo';
      if (a.includes('bi')) return 'bi';
      return null;
    };

    const guidanceByArea: Record<string, (st: string) => string> = {
      financas: () => (
        `Vamos fazer juntos, sem complicação:
- Liste 3 contas fixas do mês (ex.: aluguel, internet).
- Liste 3 custos que variam com as vendas (ex.: taxas, insumos).
- Teste 3 preços (baixo, médio, alto) e eu te digo qual tende a funcionar melhor.`
      ),
      vendas: () => (
        `Vamos deixar claro e prático:
- Descreva seu cliente ideal em 1 linha (cargo, setor).
- Escolha um canal para começar (email, WhatsApp ou LinkedIn).
- Monte 1 roteiro curto com dor + proposta + convite e eu te ajudo a ajustar.`
      ),
      marketing: () => (
        `Para começar simples:
- Defina público e mensagem principal em 1 frase.
- Escolha 1 canal e um orçamento inicial pequeno (ex.: R$50/dia).
- Rode 2 variações e me conte o resultado (cliques, custo por venda) que eu otimizo.`
      ),
      pessoas: () => (
        `Vamos dar o primeiro passo:
- Liste 3 responsabilidades principais da função ou do time.
- Defina uma rotina semanal de alinhamento simples (30 min).
- Escolha 1 melhoria pequena para testar nesta semana; eu te ajudo a formular.`
      ),
      processos: () => (
        `Vamos mapear rápido:
- Escreva 5 passos do processo atual.
- Marque onde ocorrem esperas ou retrabalho.
- Escolha 1 melhoria simples e defina como medir o ganho.`
      ),
      estrategia: () => (
        `Vamos tirar do papel:
- Escolha 1 objetivo claro para este trimestre.
- Defina como saber que deu certo (1 métrica).
- Liste 2 iniciativas iniciais com prazo; eu te ajudo a detalhar.`
      ),
      bi: () => (
        `Vamos enxergar o essencial:
- Defina 1 indicador que precisa acompanhar.
- Escolha a fonte de dados e a frequência de atualização.
- Monte um visual simples (tabela ou gráfico) e eu ajudo a ajustar.`
      ),
      criativo: () => (
        `Vamos colocar no ar:
- Escolha 1 tema e 2 formatos (ex.: reel e carrossel).
- Escreva 3 pontos chave e uma chamada para ação.
- Publique e me conte alcance/engajamento; eu te digo próximo ajuste.`
      ),
    };

    let guidance = '';
    const areaKey = getAreaKey(String(agent?.area || ''));
    if (areaKey && (isUnsure || stage === 'execucao')) {
      const body = guidanceByArea[areaKey]?.(stage) || '';
      if (body) guidance = `\n\n${body}`;
    }

    // Sugerir preços competitivos com base nas informações do usuário (Finanças)
    const wantsPricing = ['preco','preço','precific','quanto cobrar','valor cobrar','quanto custa','quanto devo cobrar']
      .some(t => nMsg.includes(normalize(t)));
    const formatBRL = (v: number) => {
      try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); } catch { return `R$ ${v.toFixed(2)}`; }
    };
    const parseNumbers = (txt: string): number[] => {
      const nums: number[] = [];
      const re = /(\d+[\.,]?\d{0,2})/g;
      const m = txt.match(re) || [];
      for (const raw of m) {
        const clean = raw.replace('.', '').replace(',', '.');
        const v = Number(clean);
        if (isFinite(v) && v > 0) nums.push(v);
      }
      return nums;
    };
    const hasFlag = (txt: string, flags: string[]) => flags.some(f => normalize(txt).includes(normalize(f)));
    if (areaKey === 'financas' && (wantsPricing || isUnsure)) {
      // Restringir detecção de concorrente para evitar falsos positivos
      const competitorFlags = ['concorrente','cobra','benchmark'];
      const costFlags = ['custo','taxa','insumo','aluguel','internet','energia','matéria-prima','materia-prima','frete','plataforma','comissão','comissao','imposto'];
      const testPriceFlags = ['baixo','médio','medio','alto','faixa','valores','preços','preco','teste','testar'];
      const userMsgs: string[] = [String(message || '')].concat(
        Array.isArray(chatHistory) ? chatHistory.filter(m => m.sender === 'user').map(m => String(m.text || '')) : []
      );
      const competitorValues: number[] = [];
      const costValues: number[] = [];
      let testPricesCandidate: number[] = [];
      for (const msgText of userMsgs.slice(-6)) {
        const nums = parseNumbers(msgText);
        if (!nums.length) continue;
        const isCompetitor = hasFlag(msgText, competitorFlags);
        const isCost = hasFlag(msgText, costFlags);
        const isTestPrices = hasFlag(msgText, testPriceFlags);
        if (isCompetitor) competitorValues.push(...nums);
        if (isCost) costValues.push(...nums);
        if (!isCompetitor && !isCost && isTestPrices && nums.length >= 2) {
          testPricesCandidate = nums.slice();
        }
      }
      const avg = (arr: number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
      const competitorAvg = avg(competitorValues);
      const unitCost = avg(costValues);
      const round2 = (v: number) => Math.round(v * 100) / 100;
      // Se o usuário trouxe 3 preços para testar e não forneceu custo/concorrente, use-os como base sem inventar novos números
      if (!competitorAvg && !unitCost && testPricesCandidate.length >= 2) {
        const uniqueSorted = Array.from(new Set(testPricesCandidate)).sort((a,b)=>a-b);
        const [p1, p2, p3] = [uniqueSorted[0], uniqueSorted[1], uniqueSorted[2] ?? uniqueSorted[uniqueSorted.length-1]];
        const text = `${prefix}${base}Ótimo — vamos usar seus 3 valores de teste: ${formatBRL(round2(p1))}, ${formatBRL(round2(p2))}${p3 ? ` e ${formatBRL(round2(p3))}` : ''}.
Para fundamentar e validar:
- Informe custos fixos mensais totais (R$).
- Informe o custo variável por usuário/mês (R$).
- Se souber, informe um preço típico de um concorrente (marca e valor).
Depois disso, eu calculo margem, ponto de equilíbrio e recomendo a melhor faixa, sem inventar novos números.`.trim();
        return { text };
      }
      if (competitorAvg || unitCost) {
        let low = 0, mid = 0, high = 0;
        if (competitorAvg) {
          low = competitorAvg * 0.95;
          mid = competitorAvg;
          high = competitorAvg * 1.15;
        } else {
          // Sem concorrência: usar marcação simples baseada em custo
          low = unitCost * 1.5;
          mid = unitCost * 1.7;
          high = unitCost * 2.0;
        }
        // Garantir que não fique abaixo do custo, se informado, e manter espaçamento saudável
        if (unitCost) {
          const minSafe = unitCost * 1.2; // margem mínima de segurança
          if (low < minSafe) low = minSafe;
          if (mid < minSafe * 1.1) mid = minSafe * 1.1;
          if (high < minSafe * 1.25) high = minSafe * 1.25;
        }
        // Garantir que premium tenha diferenciação (>= 30% acima do padrão)
        if (high < mid * 1.3) high = mid * 1.3;
        low = round2(low); mid = round2(mid); high = round2(high);
        const text = `${prefix}${base}Sugestão de preços competitivos${competitorAvg ? '' : ' baseada nos seus custos'}:
- Entrada: ${formatBRL(low)}
- Padrão: ${formatBRL(mid)}
- Premium: ${formatBRL(high)}

Critérios usados:
- ${competitorAvg ? 'Faixa alinhada ao preço típico informado do concorrente' : 'Markup sobre custo para garantir margem'}.
- Espaçamento saudável entre planos para evitar canibalização.

Próximo passo: confirme posicionamento (entrada/padrão/premium) e me diga o canal principal de venda (loja, online, marketplace) para refinarmos e validar por 7 dias.`.trim();
        return { text };
      } else {
        const profileCategory = String(userProfile?.companyField || '').trim();
        const profileProduct = String(userProfile?.mainProduct || '').trim();
        const profileAudience = String(userProfile?.targetAudience || '').trim();
        const knownBits = [
          profileProduct ? `produto principal: ${profileProduct}` : '',
          profileCategory ? `ramo: ${profileCategory}` : '',
          profileAudience ? `público-alvo: ${profileAudience}` : '',
        ].filter(Boolean).join(' · ');
        const header = knownBits
          ? `${prefix}${base}Com base no seu perfil (${knownBits}), vamos chegar a um preço competitivo.`
          : `${prefix}${base}Vamos chegar a um preço competitivo.`;
        const bullets = [
          '- Qual posicionamento você pretende: entrada, padrão ou premium?',
          '- Uma referência de concorrente (se souber) e o preço típico.',
          '- Seu custo unitário aproximado (R$/usuário/mês).',
          '- Se já tiver, três preços de teste (baixo, médio, alto).'
        ].filter(Boolean).join('\n');
        const text = `${header} Me diga:\n${bullets}\nCom isso, eu te indico uma faixa realista e competitiva, pronta para validar sem redundâncias.`.trim();
        return { text };
      }
    }

    // Respostas específicas para avançar execução e evitar repetição no follow-up
    const affirmativeTokens = ['sim','ok','vamos','bora','topa','fechado','combinado'];
    const isAffirmative = affirmativeTokens.some(t => nMsg.includes(t));

    const decisionMap: Record<string, 'manter' | 'subir' | 'descer'> = {
      manter: 'manter', 'manter o preco': 'manter', 'manter o preço': 'manter', conservar: 'manter',
      subir: 'subir', aumentar: 'subir', 'subir o preco': 'subir', 'subir o preço': 'subir',
      descer: 'descer', reduzir: 'descer', baixar: 'descer', 'descer o preco': 'descer', 'descer o preço': 'descer'
    } as any;
    let decision: 'manter' | 'subir' | 'descer' | null = null;
    for (const key of Object.keys(decisionMap)) {
      if (nMsg.includes(normalize(key))) { decision = decisionMap[key]; break; }
    }

    // Se estiver na execução e o usuário disse "sim", peça os 3 preços explicitamente
    if (stage === 'execucao' && isAffirmative && areaKey === 'financas') {
      const text = `${prefix}${base}Perfeito! Me diga três valores para testar (baixo, médio, alto). Ex.: 49, 59 e 69. Em seguida, vamos acompanhar margem e conversão por 7 dias e escolher o melhor.`.trim();
      return { text };
    }

    // No follow-up de Finanças, se o usuário escolheu manter/subir/descer, entregue plano de ação em vez de repetir pergunta
    if (stage === 'followup' && areaKey === 'financas' && decision) {
      const actionLabel = decision === 'manter' ? 'manter o preço atual' : decision === 'subir' ? 'subir o preço' : 'reduzir o preço';
      const text = `${prefix}${base}Fechado: vamos ${actionLabel}.

Próximos passos práticos:
- Atualize a tabela de preços e comunique clientes com uma justificativa simples de valor.
- Acompanhe por 7 dias dois sinais: margem e conversão (taxa de vendas).
- Critérios de ajuste: se a conversão cair muito, reavalie; se a margem ficar abaixo da meta, ajuste novamente.

Se quiser, me diga os três preços testados e seus resultados que eu recomendo o preço final.`.trim();
      return { text };
    }

    // Reconhecer custos informados e pedir completar lista (Finanças)
    if (areaKey === 'financas') {
      const currencyRegex = /r\$\s*\d|\d+[\.,]\d{2}/i;
      const mentionsCurrency = currencyRegex.test(String(message));
      const userCostMentions = Array.isArray(chatHistory)
        ? chatHistory.filter(m => m.sender === 'user' && currencyRegex.test(String(m.text || ''))).length
        : 0;
      // Se usuário forneceu algum custo e ainda não temos 3, peça para completar
      if (mentionsCurrency && userCostMentions < 3 && (stage === 'diagnostico' || stage === 'priorizacao' || stage === 'execucao')) {
        const remaining = Math.max(0, 3 - userCostMentions);
        const text = `${prefix}${base}Anotado! Para fechar o básico, faltam mais ${remaining} itens.\n- Complete 3 contas fixas (ex.: aluguel, internet, energia).\n- Complete 3 custos que variam com as vendas (ex.: taxas de plataforma, insumos).\nQuando concluir, me diga três preços para testarmos (baixo, médio, alto).`.trim();
        return { text };
      }
      // No follow-up, se a resposta foi afirmativa mas sem decisão nem preços, retomar pedido dos 3 preços
      if (stage === 'followup' && isAffirmative && !decision) {
        const text = `${prefix}${base}Vamos seguir: me passe três valores para testar (baixo, médio, alto). Depois acompanhamos margem e conversão por 7 dias e escolhemos o melhor.`.trim();
        return { text };
      }
    }

    // Preserve formatting in guidance (line breaks and bullets)
    const text = `${prefix}${base}${question}${guidance}`.trim();

    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ text, imageUrl: undefined });
      }, 350);
    });
  } catch (e) {
    console.warn('Falha no motor de perguntas. Usando fallback.', e);
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ text: 'Vamos começar pelo essencial: qual prioridade quer trabalhar agora?', imageUrl: undefined });
      }, 300);
    });
  }
};


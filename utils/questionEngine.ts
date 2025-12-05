import { Agent, Message, UserProfile } from '../types';

export type QuestionStage = 'diagnostico' | 'priorizacao' | 'execucao' | 'followup';

const normalize = (s?: any) => String(s ?? '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const isGreeting = (s: string): boolean => {
  const n = normalize(s);
  return ['oi','ola','olá','bom dia','boa tarde','boa noite','hey','hello'].some(t => n.includes(normalize(t)));
};

export function computeStage(chatHistory: Message[], agentId?: string): QuestionStage {
  try {
    const relevant = chatHistory.filter((m) => m.sender === 'agent' && (!agentId || m.agent?.id === agentId));
    const questionsCount = relevant.reduce((acc, m) => acc + ((m.text || '').includes('?') ? 1 : 0), 0);
    if (questionsCount <= 0) return 'diagnostico';
    if (questionsCount === 1) return 'priorizacao';
    if (questionsCount === 2) return 'execucao';
    return 'followup';
  } catch {
    return 'diagnostico';
  }
}

function byAreaQuestion(agent: Agent, stage: QuestionStage, profile?: UserProfile): string {
  const area = String(agent.area || '').toLowerCase();
  const challenge = String(profile?.mainChallenge || '').trim();

  // Preferir override específico por agente
  const override = AGENT_QUESTION_OVERRIDES[agent.id]?.[stage];
  if (override) return override;

  switch (area) {
    case 'estratégia':
    case 'estrategia':
      if (stage === 'diagnostico') return challenge ? `Qual meta relacionada a "${challenge}" quer destravar primeiro?` : 'Qual meta quer destravar primeiro?';
      if (stage === 'priorizacao') return 'Qual prazo e indicador de sucesso você pretende usar?';
      if (stage === 'execucao') return 'Quais recursos você tem disponíveis hoje para começar?';
      return 'Qual aprendizado desta etapa devemos registrar para o próximo ciclo?';
    case 'vendas':
      if (stage === 'diagnostico') return 'Quem é seu cliente ideal hoje?';
      if (stage === 'priorizacao') return 'Qual objeção mais frequente trava suas conversas?';
      if (stage === 'execucao') return 'Em qual etapa você mais perde vendas?';
      return 'Qual rotina de acompanhamento vamos manter?';
    case 'marketing':
      if (stage === 'diagnostico') return 'Qual público-alvo e mensagem principal você quer testar?';
      if (stage === 'priorizacao') return 'Qual canal e orçamento inicial vamos usar?';
      if (stage === 'execucao') return 'Qual resultado vamos usar para decidir, como cliques ou custo por venda?';
      return 'Qual resultado desta campanha vamos documentar?';
    case 'pessoas':
      if (stage === 'diagnostico') return 'Qual competência no time precisa evoluir agora?';
      if (stage === 'priorizacao') return 'Qual perfil de vaga ou trilha devemos priorizar?';
      if (stage === 'execucao') return 'Qual rotina iniciamos nesta semana (feedback, conversa 1:1 ou treino)?';
      return 'Qual evidência de evolução vamos acompanhar?';
    case 'processos':
      if (stage === 'diagnostico') return 'Qual fluxo está gerando retrabalho?';
      if (stage === 'priorizacao') return 'Qual ponto do processo é o maior gargalo?';
      if (stage === 'execucao') return 'Qual experimento simples testamos em 1 semana?';
      return 'Qual padrão/procedimento novo vamos manter?';
    case 'finanças':
      if (stage === 'diagnostico') return 'Vamos começar por fluxo de caixa ou custos?';
      if (stage === 'priorizacao') return 'Qual período e metas financeiras vamos usar?';
      if (stage === 'execucao') return 'Quais entradas e contas/custos começamos mapeando?';
      return 'Qual indicador vamos acompanhar diariamente?';
    default:
      if (stage === 'diagnostico') return challenge ? `Qual prioridade ligada a "${challenge}" começamos?` : 'Qual prioridade começamos?';
      if (stage === 'priorizacao') return 'Qual critério de sucesso vamos usar?';
      if (stage === 'execucao') return 'Qual primeiro passo concreto executamos hoje?';
      return 'Qual aprendizado registrar para o próximo passo?';
  }
}

export function getNextAgentQuestion(
  agent: Agent,
  profile: UserProfile | undefined,
  chatHistory: Message[],
  userMessage: string
): { question: string; stage: QuestionStage; greetingPrefix?: string } {
  const stage = computeStage(chatHistory, agent.id);
  const q = byAreaQuestion(agent, stage, profile);
  let prefix: string | undefined = undefined;
  if (isGreeting(userMessage)) {
    const firstName = String(profile?.userName || '').split(' ')[0];
    const isNight = normalize(userMessage).includes('noite');
    const isAfternoon = normalize(userMessage).includes('tarde');
    const hiBase = isNight ? 'Boa noite' : (isAfternoon ? 'Boa tarde' : 'Bom dia');
    const hi = `${hiBase}${firstName ? `, ${firstName}` : ''}!`;
    prefix = hi;
  }
  return { question: q.endsWith('?') ? q : `${q}?`, stage, greetingPrefix: prefix };
}
// Perguntas específicas por agente (override por estágio)
const AGENT_QUESTION_OVERRIDES: Record<string, Partial<Record<QuestionStage, string>>> = {
  // Estratégia
  artur: {
    diagnostico: 'Qual meta quer tornar realidade primeiro?',
    priorizacao: 'Qual prazo e como vamos saber que deu certo?',
    execucao: 'O que você já tem hoje para começar (tempo, pessoas, ferramentas)?',
    followup: 'Que aprendizado desta etapa anotamos para o próximo ciclo?'
  },

  // Vendas
  diana: {
    diagnostico: 'Quem é seu cliente ideal hoje?',
    priorizacao: 'Qual objeção mais comum trava suas conversas?',
    execucao: 'Em qual etapa você mais perde vendas?',
    followup: 'Qual rotina de acompanhamento vamos manter?'
  },
  carlos: {
    diagnostico: 'Quer começar pelo cliente ideal ou pelo roteiro de abordagem?',
    priorizacao: 'Qual canal traz leads mais qualificados?',
    execucao: 'Qual ritmo de contatos por 2 semanas faz sentido para você?',
    followup: 'Qual taxa de resposta tivemos e como vamos ajustar?'
  },

  // Marketing
  fernanda: {
    diagnostico: 'Qual público e mensagem você quer testar?',
    priorizacao: 'Qual canal e orçamento inicial vamos usar?',
    execucao: 'Qual resultado vamos usar para decidir (cliques, custo por venda, retorno)?',
    followup: 'Que aprendizado desta campanha vamos registrar?'
  },

  // BI
  sofia: {
    diagnostico: 'Qual indicador você precisa enxergar com mais clareza?',
    priorizacao: 'Qual fonte de dados e com que frequência vamos atualizar?',
    execucao: 'Qual visual simples comunica melhor (tabela ou gráfico)?',
    followup: 'Qual rotina de atualização do painel vamos adotar?'
  },

  // Finanças
  mariana: {
    diagnostico: 'Qual período quer projetar (semana ou mês)?',
    priorizacao: 'Quais são suas entradas principais neste período?',
    execucao: 'Vamos listar contas do mês e custos que variam com as vendas?',
    followup: 'Qual indicador financeiro simples vamos acompanhar todo dia?'
  },
  rafael: {
    diagnostico: 'Para começar, liste 3 contas fixas do mês (R$) e 3 custos que variam com as vendas (R$).',
    priorizacao: 'Você quer um preço mais seguro (margem) ou mais competitivo (vender mais)?',
    execucao: 'Você já tem três preços de teste (baixo/médio/alto)? Se sim, diga. Se não, informe custos fixos (R$), custo variável por usuário/mês (R$) e, se souber, um preço típico de concorrente.',
    followup: 'Com o teste, vemos a margem e decidimos: subir, descer ou manter o preço.'
  },

  // Estratégia — Mercado e Concorrência
  beatriz: {
    diagnostico: 'Quem é seu cliente ideal e quais concorrentes diretos você enfrenta?',
    priorizacao: 'Qual diferencial quer reforçar frente aos concorrentes?',
    execucao: 'Quer mapear posicionamento e preço de 3 concorrentes principais?',
    followup: 'Que insight competitivo registramos para o próximo ciclo?'
  },

  // Estratégia — OKRs
  elias: {
    diagnostico: 'Qual objetivo trimestral você quer alcançar primeiro?',
    priorizacao: 'Qual métrica e responsável vamos atribuir ao resultado-chave?',
    execucao: 'Qual iniciativa começamos nesta semana?',
    followup: 'Qual cadência de revisão das metas vamos adotar?'
  },

  // Marketing — Funil Digital
  eduardo: {
    diagnostico: 'Qual oferta e objetivo principal (leads ou vendas) você quer validar?',
    priorizacao: 'Qual canal inicial e resultado vamos usar (ex.: cliques, custo por venda)?',
    execucao: 'Quer desenhar topo, meio e fundo do funil com 1 ação por etapa?',
    followup: 'Qual resultado do funil vamos documentar para ajustar?'
  },

  // Marketing — Redes Sociais
  heitor: {
    diagnostico: 'Qual objetivo e voz da marca nas redes sociais?',
    priorizacao: 'Quais formatos priorizamos (reels, carrossel, live) e calendário?',
    execucao: 'Quer montar 1 semana de pautas com chamadas para ação claras?',
    followup: 'Quais métricas de engajamento simples vamos acompanhar?'
  },

  // Vendas — Negociação e Fechamento
  gabriela: {
    diagnostico: 'Qual proposta atual e margem alvo você trabalha?',
    priorizacao: 'Qual objeção mais recorrente deseja tratar agora?',
    execucao: 'Quer melhorar a proposta e combinar o que pode ceder neste caso?',
    followup: 'Qual próximo passo de fechamento vamos executar?'
  },

  // Finanças — Controle Orçamentário
  renata: {
    diagnostico: 'Começamos por gasto real vs planejado ou por centros de custo?',
    priorizacao: 'Qual período e categoria mais crítica vamos revisar?',
    execucao: 'Quer montar um quadro simples de desvios e ações?',
    followup: 'Qual rotina de acompanhamento do orçamento vamos adotar?'
  },

  // Estratégia — Inovação e Transformação Digital
  claudio: {
    diagnostico: 'Quais processos críticos e ferramentas atuais geram mais atrito?',
    priorizacao: 'Qual objetivo (eficiência/experiência/escala) priorizamos?',
    execucao: 'Quer iniciar com 1 piloto de baixa complexidade?',
    followup: 'Qual viabilidade percebida e próximo ajuste na adoção?'
  },

  // Estratégia — Governança Corporativa
  debora: {
    diagnostico: 'Como é seu modelo decisório e controles mínimos hoje?',
    priorizacao: 'Qual política ou rito precisa ser instituído primeiro?',
    execucao: 'Quer montar um checklist simples de papéis e reuniões?',
    followup: 'Qual risco/ganho vamos monitorar neste ciclo?'
  },

  // Vendas — CRM e Follow-up
  fabio: {
    diagnostico: 'Quais etapas do funil e prazos você usa hoje?',
    priorizacao: 'Qual automação traz maior impacto imediato?',
    execucao: 'Quer desenhar uma régua de relacionamento simples?',
    followup: 'Qual indicador de conversão vamos acompanhar por etapa?'
  },

  // Marketing — Email Marketing
  isabela: {
    diagnostico: 'Qual objetivo (abertura, clique ou venda) e base atual?',
    priorizacao: 'Qual segmentação e automação inicial vamos usar?',
    execucao: 'Quer montar uma sequência com 3 emails e testes com duas versões?',
    followup: 'Qual resultado vamos documentar para iterar?'
  },

  // Marketing — Conteúdos Visuais (sem imagem anexada)
  vitor: {
    diagnostico: 'Qual peça visual precisa (post, banner, gráfico) e objetivo?',
    priorizacao: 'Qual formato, tamanho e paleta de cor priorizamos?',
    execucao: 'Quer esboçar um layout com texto e CTA?',
    followup: 'Qual ajuste de legibilidade ou estética vamos aplicar?'
  },

  // Pessoas — Formação
  gabriel: {
    diagnostico: 'Quais competências-alvo e público da trilha?',
    priorizacao: 'Qual formato (assíncrono/síncrono) e carga inicial?',
    execucao: 'Quer montar uma trilha base com avaliação simples?',
    followup: 'Qual métrica de evolução vamos acompanhar?'
  },

  // Pessoas — Recrutamento (sem documento anexado)
  heloisa: {
    diagnostico: 'Quer começar analisando um currículo ou definindo perfil da vaga?',
    priorizacao: 'Quais requisitos obrigatórios e desejáveis priorizamos?',
    execucao: 'Quer criar um roteiro de entrevista com 5 perguntas-chave?',
    followup: 'Qual evidência vamos registrar por candidato?'
  },

  // Pessoas — Anúncio de Vaga (sem documento anexado)
  joao: {
    diagnostico: 'Qual vaga e público-alvo para o anúncio?',
    priorizacao: 'Quais benefícios e missão queremos destacar?',
    execucao: 'Quer estruturar título, missão, atividades e requisitos?',
    followup: 'Qual CTA e canal de anúncio vamos usar?'
  },

  // Pessoas — Descrição de Cargos (sem documento anexado)
  larissa: {
    diagnostico: 'Qual cargo e nível de senioridade precisamos descrever?',
    priorizacao: 'Quais responsabilidades e competências priorizamos?',
    execucao: 'Quer organizar KPIs e objetivos do cargo?',
    followup: 'Qual ajuste do escopo vamos validar com o time?'
  },

  // Pessoas — Feedbacks
  marcos: {
    diagnostico: 'Qual situação e objetivo do feedback?',
    priorizacao: 'Quais evidências e riscos devemos abordar?',
    execucao: 'Quer montar o roteiro: descrição, impacto, acordo?',
    followup: 'Qual acompanhamento e combinados vamos agendar?'
  },

  // Processos — Mapeamento de Processos
  icaro: {
    diagnostico: 'Qual fluxo atual gera mais retrabalho?',
    priorizacao: 'Qual gargalo principal e métrica relacionada?',
    execucao: 'Quer montar um resumo simples com entradas e saídas?',
    followup: 'Qual ganho esperado e próximo passo de melhoria?'
  },

  // Processos — Melhoria Contínua
  julia: {
    diagnostico: 'Qual problema e causa provável estamos tratando?',
    priorizacao: 'Qual meta e restrições definimos para o experimento?',
    execucao: 'Quer desenhar uma melhoria de 1 semana?',
    followup: 'Qual padrão novo e indicador vamos adotar?'
  },

  // Processos — Automação
  nicolas: {
    diagnostico: 'Qual processo, ferramentas e gatilhos atuais?',
    priorizacao: 'Qual automação simples traz retorno mais rápido?',
    execucao: 'Quer detalhar integrações e SLAs mínimos?',
    followup: 'Qual validação técnica e métricas de sucesso acompanhar?'
  },

  // Processos — Qualidade ISO
  olivia: {
    diagnostico: 'Qual escopo e documentos existentes de qualidade?',
    priorizacao: 'Quais indicadores e auditorias priorizamos?',
    execucao: 'Quer montar checklist e fluxos mínimos?',
    followup: 'Qual plano de auditoria e responsáveis vamos definir?'
  },

  // Processos — Métodos Ágeis
  pedro: {
    diagnostico: 'Qual equipe, backlog e cadência atual?',
    priorizacao: 'Quais cerimônias e limites e critérios de pronto priorizamos?',
    execucao: 'Quer configurar quadro e rotina mínima?',
    followup: 'Qual métrica e cadência de avaliação manter?'
  },

  // Finanças — Planejamento Financeiro (sem dados anexados)
  lucas: {
    diagnostico: 'Quer começar por resultado, balanço ou fluxo de caixa?',
    priorizacao: 'Qual período, metas e categorias financeiras revisamos?',
    execucao: 'Quer montar um painel simples de tendências e riscos?',
    followup: 'Qual rotina de revisão financeira vamos adotar?'
  }
};
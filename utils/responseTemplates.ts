import { Agent, AgentArea } from '../types';

export interface ResponseTemplate {
  name: string;
  keywords: string[];
  template: string;
}

export const RESPONSE_TEMPLATES: Record<AgentArea, ResponseTemplate[]> = {
  [AgentArea.Estrategia]: [
    {
      name: 'Mapa de Concorrência (3×3)',
      keywords: ['concorrência', 'competidor', 'posicionamento', 'benchmark'],
      template: `- Objetivo: [ex]
- Critérios (linhas): Preço | Qualidade | Agilidade
- Players (colunas): Nós | A | B | C
- Observações-chave: [bullets]
- Decisões: [3 ações com prazo]
- Métricas: [2 KPIs]`,
    },
    {
      name: 'OKRs Trimestrais (empresa)',
      keywords: ['okr', 'metas', 'objetivos', 'resultados-chave'],
      template: `- Objetivo 1: [claro e inspirador]
- KR1: [mensurável] | KR2: [mensurável]
- Iniciativas: [3-5]
- Ritmo: checkpoints semanais + retro mensal`,
    },
    {
      name: 'Plano de Inovação Enxuto',
      keywords: ['inovação', 'transformação', 'digital', 'mvp'],
      template: `- Tese: [hipótese]
- MVP: [escopo mínimo]
- Validação: [como medir]
- Riscos: [principais]
- Próximos passos: [3 etapas, datas]`,
    },
  ],
  [AgentArea.Vendas]: [
    {
      name: 'Cadência de Prospecção B2B (14 dias)',
      keywords: ['prospecção', 'cadência', 'outbound', 'cold'],
      template: `- Dia 1: Email 1 (dor + valor)
- Dia 3: LinkedIn invite + nota
- Dia 5: Email 2 (prova social)
- Dia 8: Ligação breve (2 min)
- Dia 11: Email 3 (call to action)
- Dia 14: Último toque (valor + saída)`,
    },
    {
      name: 'Roteiro de Venda Consultiva (SPIN enxuto)',
      keywords: ['roteiro', 'script', 'consultiva', 'reunião'],
      template: `- Situação: [contexto]
- Problema: [2-3 dores]
- Implicação: [impacto]
- Necessidade: [resultado desejado]
- Proposta: [solução + próximos passos]`,
    },
    {
      name: 'Pipeline e Follow-up no CRM',
      keywords: ['crm', 'pipeline', 'follow-up'],
      template: `- Etapas: Lead | Qualificação | Proposta | Negociação | Fechamento
- SLAs: [tempos por etapa]
- Tarefas automáticas: [3]
- Rotina diária: [checklist]`,
    },
  ],
  [AgentArea.Marketing]: [
    {
      name: 'Funil TOFU/MOFU/BOFU',
      keywords: ['funil', 'leads', 'tofu', 'mofu', 'bofu'],
      template: `- TOFU: [iscas]
- MOFU: [educação]
- BOFU: [oferta]
- KPI por etapa: [indicadores]
- Testes: [hipóteses e métricas]`,
    },
    {
      name: 'Estrutura de Campanhas Pagas',
      keywords: ['ads', 'anúncios', 'google', 'meta'],
      template: `- Público: [segmentos]
- Criativos: [mensagens]
- Orçamento: [distribuição]
- Rastreamento: [UTMs e eventos]
- Rotina de otimização: [cadência]`,
    },
    {
      name: 'Calendário Social (4 semanas)',
      keywords: ['redes sociais', 'instagram', 'conteúdo', 'calendário'],
      template: `- Linha editorial: [temas]
- Semana 1-4: [postagens]
- Engajamento: [roteiro]
- Métricas: [KPIs]`,
    },
  ],
  [AgentArea.Pessoas]: [
    {
      name: 'Trilha de Formação (90 dias)',
      keywords: ['formação', 'treinamento', 'onboarding'],
      template: `- Objetivos de competência: [3-5]
- Conteúdos e práticas: [blocos]
- Avaliações: [formas e datas]
- Mentoria: [ritmo]
- Encerramento: [critérios]`,
    },
    {
      name: 'Roteiro de Feedback (SBI)',
      keywords: ['feedback', 'desempenho', 'conversa'],
      template: `- Situação: [contexto]
- Comportamento: [observável]
- Impacto: [efeito]
- Próximo passo: [acordo]
- Follow-up: [data]`,
    },
    {
      name: 'Anúncio de Vaga + Pontos de Avaliação',
      keywords: ['vaga', 'recrutamento', 'descrição'],
      template: `- Perfil: [must-have]
- Responsabilidades: [5-7]
- Avaliação: [pontos e testes]
- Oferta: [faixa e benefícios]`,
    },
  ],
  [AgentArea.Processos]: [
    {
      name: 'SIPOC Enxuto',
      keywords: ['processo', 'mapeamento', 'sipoc'],
      template: `- Suppliers: [fornecedores]
- Inputs: [insumos]
- Process: [etapas]
- Outputs: [entregáveis]
- Customers: [beneficiários]`,
    },
    {
      name: 'Kaizen de 1 Semana',
      keywords: ['kaizen', 'melhoria contínua', 'gargalo'],
      template: `- Gargalo: [ponto]
- Hipóteses: [2-3]
- Teste rápido: [ação]
- Resultado: [métrica]
- Padronização: [procedimento]`,
    },
    {
      name: 'Automação com ROI',
      keywords: ['automação', 'integração', 'zapier', 'integromat'],
      template: `- Processo alvo: [descrição]
- Passos automáveis: [lista]
- Ferramentas: [opções]
- ROI estimado: [cálculo simples]
- Implementação: [etapas]`,
    },
  ],
  [AgentArea.Financas]: [
    {
      name: 'Precificação com Markup',
      keywords: ['preço', 'precificação', 'margem', 'markup'],
      template: `- Custos: [fixos] + [variáveis]
- Markup alvo: [ex: 30%]
- Preço sugerido: [fórmula]
- Sensibilidade: [±10%]
- Próximos passos: [validação e ajuste]`,
    },
    {
      name: 'Fluxo de Caixa Semanal',
      keywords: ['fluxo de caixa', 'capital de giro', 'projeção'],
      template: `- Entradas: [semanas]
- Saídas: [semanas]
- Saldo: [gráfico simples]
- Alertas: [pontos críticos]
- Ações: [3 medidas]`,
    },
    {
      name: 'Indicadores Financeiros (painel enxuto)',
      keywords: ['indicadores', 'relatório', 'dashboard'],
      template: `- Receita | Margem | CAC | LTV | Estoque
- Meta por indicador: [valores]
- Rotina: [cadência de atualização]`,
    },
  ],
};

export function getTemplatesFor(agent: Agent, message: string): ResponseTemplate[] {
  try {
    const area = agent.area as AgentArea;
    const candidates = RESPONSE_TEMPLATES[area] || [];
    const msg = (message || '').toLowerCase();
    return candidates.filter((t) => t.keywords.some((k) => msg.includes(k))).slice(0, 2);
  } catch {
    return [];
  }
}
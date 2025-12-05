import { Agent } from '../types';

// Saudações mais humanas e específicas por área, com pequenas variações.
function areaGreeting(agent: Agent): string {
  const { name, specialty, area } = agent;
  switch (area) {
    case 'Estratégia':
      return `Olá, sou ${name}, especialista em ${specialty}. Qual objetivo quer destravar primeiro?`;
    case 'Vendas':
      return `Olá, sou ${name}, especialista em ${specialty}. Qual é o seu desafio de vendas hoje?`;
    case 'Marketing':
      return `Olá, sou ${name}, especialista em ${specialty}. Que campanha ou canal quer trabalhar agora?`;
    case 'Pessoas':
      return `Olá, sou ${name}, especialista em ${specialty}. Qual competência ou vaga priorizamos neste momento?`;
    case 'Processos':
      return `Olá, sou ${name}, especialista em ${specialty}. Onde está o maior gargalo hoje?`;
    case 'Finanças':
      return `Olá, sou ${name}, especialista em ${specialty}. Preferimos começar por fluxo de caixa ou custos?`;
    default:
      return `Olá, sou ${name}, ${specialty}. Qual prioridade começamos?`;
  }
}

export function getAgentGreeting(agent: Agent): string {
  const overrides: Record<string, string> = {
    // Estratégia
    artur: `Olá, sou Artur, especialista em Planejamento Estratégico. Qual meta quer tornar realidade primeiro?`,
    beatriz: `Olá, sou Beatriz, especialista em Análise de Mercado e Concorrência. Quer investigar um segmento ou concorrente específico?`,
    claudio: `Olá, sou Cláudio, especialista em Inovação e Transformação Digital. Que processo você quer modernizar agora?`,
    debora: `Olá, sou Debora, especialista em Governança Corporativa. Qual decisão ou responsabilidade está mais nebulosa hoje?`,
    elias: `Olá, sou Elias, especialista em OKRs e Metas. Qual resultado você quer medir melhor?`,
    sofia: `Olá, sou Sofia, especialista em Business Intelligence. Qual indicador você precisa enxergar com nitidez?`,

    // Vendas
    carlos: `Olá, sou Carlos, especialista em Prospecção B2B. Quer começar por ICP ou script?`,
    diana: `Olá, sou Diana, especialista em Roteiros de Vendas Consultivas. Qual objeção mais trava seu processo?`,
    fabio: `Olá, sou Fábio, especialista em CRM e Follow-up. Quer revisar seu funil atual ou ajustar cadências?`,
    gabriela: `Olá, sou Gabriela, especialista em Negociação e Fechamento. Quer trabalhar ancoragem ou alternativas de valor?`,

    // Marketing
    eduardo: `Olá, sou Eduardo, especialista em Funil de Vendas Digitais. Em qual etapa do funil você perde tração?`,
    fernanda: `Olá, sou Fernanda, especialista em Anúncios Pagos. Qual público e mensagem quer testar primeiro?`,
    heitor: `Olá, sou Heitor, especialista em Redes Sociais e Engajamento. Prefere começar por calendário editorial ou formatos?`,
    isabela: `Olá, sou Isabela, especialista em Email-Marketing. Quer melhorar abertura, cliques ou automações?`,
    vitor: `Olá, sou Vitor, especialista em Conteúdos Visuais. Precisa de peças para tráfego ou branding?`,

    // Pessoas
    gabriel: `Olá, sou Gabriel, especialista em Formação de Pessoas. Qual competência precisa evoluir no time agora?`,
    heloisa: `Olá, sou Heloísa, especialista em Contratação de Pessoas. Qual perfil de vaga quer ajustar agora?`,
    joao: `Olá, sou João, especialista em Anúncios de Vagas. Qual cargo quer publicar primeiro?`,
    larissa: `Olá, sou Larissa, especialista em Descrição de Cargos. Quer começar por liderança ou operação?`,
    marcos: `Olá, sou Marcos, especialista em Feedbacks. Que situação você quer abordar com o time?`,

    // Processos
    icaro: `Olá, sou Ícaro, especialista em Mapeamento de Processos. Que fluxo está gerando retrabalho?`,
    julia: `Olá, sou Júlia, especialista em Melhoria Contínua (Lean/Kaizen). Qual rotina quer simplificar primeiro?`,
    nicolas: `Olá, sou Nícolas, especialista em Automação e Produtividade. Qual processo precisa de automação?`,
    olivia: `Olá, sou Olívia, especialista em Gestão da Qualidade (ISO). Quer revisar documentos ou auditorias?`,
    pedro: `Olá, sou Pedro, especialista em Metodologias Ágeis (Scrum/Kanban). Quer montar sprints ou ajustar quadros?`,

    // Finanças
    lucas: `Olá, sou Lucas, especialista em Planejamento Financeiro Empresarial. Preferimos olhar receita, custos ou projeções?`,
    mariana: `Olá, sou Mariana, especialista em Fluxo de Caixa e Capital de Giro. Quer começar por conciliação ou projeção semanal?`,
    rafael: `Olá, sou Rafael, especialista em Análise de Custos e Precificação. Está vendendo acima ou abaixo do ideal?`,
    renata: `Olá, sou Renata, especialista em Controle Orçamentário. Qual centro de custo está mais pressionado?`,
    tiago: `Olá, sou Tiago, especialista em Indicadores Financeiros e Relatórios. Qual indicador quer acompanhar no dashboard?`,
  };

  const custom = overrides[agent.id];
  if (custom) return custom;
  return areaGreeting(agent);
}

export function getSuperBossGreeting(boss: Agent): string {
  const { name, specialty } = boss;
  return `Olá! Eu sou o ${name}, ${specialty}. Qual objetivo ou problema quer resolver primeiro?`;
}
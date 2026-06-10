#!/usr/bin/env node
/**
 * Populates 4 portfolio projects with content via the local API.
 * Usage: TOKEN=<jwt> node scripts/seed-projects.js
 *
 * The token can be copied from localStorage key "ms_token" in the browser.
 */

const BASE = process.env.API || 'http://localhost:4016/api'
const TOKEN = process.env.TOKEN

if (!TOKEN) {
  console.error('Missing TOKEN. Usage: TOKEN=<jwt> node scripts/seed-projects.js')
  process.exit(1)
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json)}`)
  return json
}

// ─── project data ─────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    slug: 'admin-mayra-balboni',
    patch: {
      emoji: '📋',
      description: 'Sistema operacional para estúdio fotográfico — do primeiro contato ao contrato assinado.',
      whatItIs: 'Um CRM completo para fotógrafos independentes. Gerencia leads, cria orçamentos personalizados, gera contratos em PDF e centraliza toda a operação do estúdio em um só lugar.',
      whatItSolves: 'Fotógrafos profissionais perdem horas gerenciando clientes em planilhas, WhatsApp e documentos avulsos. O Admin resolve isso com um fluxo centralizado: captação → proposta → contrato → arquivamento.',
      features: [
        'Cadastro e acompanhamento de leads',
        'Geração automática de orçamentos personalizados',
        'Contratos em PDF com campos preenchíveis',
        'Agenda integrada de sessões fotográficas',
        'Dashboard financeiro com histórico de clientes',
        'Sugestões com IA para mensagens recorrentes',
      ],
      tags: ['React', 'Node.js', 'PostgreSQL', 'PDF', 'JWT'],
      status: 'construindo',
    },
    milestones: [
      { title: 'Ideia e escopo', reachedAt: '2024-01-15', description: 'Definição do problema real: como digitalizar a operação do estúdio sem perder a personalidade do atendimento.' },
      { title: 'Formulário e orçamento', reachedAt: '2024-03-10', description: 'Primeira versão do fluxo de captação: cliente preenche formulário, fotógrafo recebe proposta gerada automaticamente.' },
      { title: 'MVP', reachedAt: '2024-06-20', description: 'Sistema funcional com leads, contratos, geração de PDF e login seguro.' },
      { title: 'Integrações', reachedAt: '2024-09-05', description: 'Agenda integrada, primeiras sugestões com IA para automação de mensagens recorrentes.' },
      { title: 'Em produção', reachedAt: '2024-12-01', description: 'Usado em operação real. Feedback da prática alimenta o próximo ciclo de melhorias.' },
    ],
    learnings: [
      'Produto não é código — é decisão. A parte mais difícil foi entender o que NÃO construir: cada feature desnecessária é dívida de manutenção.',
      'Backend precisa de contratos claros. Aprendi a projetar APIs antes de escrever qualquer linha de lógica.',
      'Geração de documentos é um domínio próprio. PDFs bem formatados exigem atenção a detalhes que não aparecem em tutoriais.',
      'IA para tarefas repetitivas muda o jogo. Usar IA para sugerir textos de acompanhamento economizou horas reais de digitação.',
      'Segurança não é uma feature. JWT, validação de input e controle de permissões precisam ser a base, não a cereja do bolo.',
    ],
  },
  {
    slug: 'the-archive-by-balboni',
    patch: {
      emoji: '📖',
      description: 'O arquivo vem primeiro. O compartilhamento é um ato de amor, não de performance.',
      whatItIs: 'Um diário digital com camada social íntima. Registro de vida, pensamentos, fotos, projetos, artigos e cápsulas do tempo — tudo reunido em um lugar que é só seu, com a opção de compartilhar pedaços com pessoas que você ama.',
      whatItSolves: 'Redes sociais recompensam performance e quantidade. Este arquivo recompensa presença e autenticidade. Não é sobre curtidas — é sobre construir um registro honesto da própria vida.',
      features: [
        'Feed pessoal com fotos, textos e artigos longos',
        'Arquivo com busca por tag, data e coleção',
        'Cápsulas do tempo com abertura agendada',
        'Projetos com marcos, aprendizados e entradas vinculadas',
        'Compartilhamento íntimo com círculo de confiança',
        'Notificações push via PWA (VAPID)',
        'Otimização de imagens com Sharp',
        'Mensagens privadas entre pessoas do círculo',
      ],
      tags: ['React', 'PWA', 'Node.js', 'PostgreSQL', 'Sharp', 'VAPID'],
      status: 'ativo',
      websiteUrl: 'https://meu-cantinho.vercel.app',
    },
    milestones: [
      { title: 'Ideia', reachedAt: '2024-06-01', description: 'A pergunta: e se eu construísse uma rede social que eu realmente quisesse usar?' },
      { title: 'Feed e autenticação', reachedAt: '2024-07-15', description: 'Primeiro post, primeiro login, primeiro deploy. A base existia.' },
      { title: 'O arquivo', reachedAt: '2024-09-20', description: 'Busca, filtros, coleções, fotos, artigos. O coração do produto.' },
      { title: 'Cápsulas do tempo', reachedAt: '2024-11-10', description: 'Escrever para o futuro. Uma das funcionalidades mais emocionais do projeto.' },
      { title: 'Camada social', reachedAt: '2025-01-08', description: 'Seguir pessoas, mensagens, notificações. O compartilhamento como ato de amor.' },
      { title: 'Maturidade', reachedAt: '2025-06-01', description: 'PWA, notificações push, otimização de imagens, simplificação de rotas. O produto se tornando o que deveria ser.' },
    ],
    learnings: [
      'Produto é identidade. Quando você constrói algo para si, cada decisão técnica é também uma decisão sobre quem você é.',
      'PWA exige paciência. Service workers, cache, notificações push — cada detalhe conta e debugar é uma arte própria.',
      'Auth bem feita é invisível. JWT, middleware, controle de sessão — quando funciona, você esquece que existe.',
      'Simplicidade é uma conquista, não um ponto de partida. Chegar num produto simples exige construir e desmontar várias vezes.',
      'O que você arquiva define o que você lembra. Construir isso me ensinou que registro é um ato de cuidado com o futuro.',
    ],
  },
  {
    slug: 'python-ai-agent',
    patch: {
      emoji: '🤖',
      description: 'Um assistente de estudos para Python construído com IA — aprendi Python construindo o que me ajudaria a aprender Python.',
      whatItIs: 'Um agente conversacional especializado em Python, capaz de explicar conceitos, revisar código, propor exercícios e acompanhar o progresso de estudos de forma personalizada.',
      whatItSolves: 'Aprender programação sozinha sem feedback é lento e frustrante. O agente simula o papel de um mentor: responde dúvidas no contexto certo, adapta a linguagem ao nível da pessoa e propõe o próximo passo.',
      features: [
        'Chat com LLM especializado em Python',
        'Revisão de código com explicações linha por linha',
        'Exercícios adaptados ao nível do estudante',
        'Histórico de sessões de estudo',
        'Modo socrático: responde perguntas com perguntas guiadas',
      ],
      tags: ['Python', 'LLM', 'AI Agent', 'FastAPI'],
      status: 'concluído',
    },
    milestones: [
      { title: 'Primeiro prompt funcional', reachedAt: '2024-02-10', description: 'O agente respondia. Não fazia tudo bem, mas respondia — e isso foi o suficiente para continuar.' },
      { title: 'Contexto persistente', reachedAt: '2024-03-05', description: 'Implementação de memória de sessão: o agente passou a lembrar o que foi discutido antes.' },
      { title: 'Revisão de código', reachedAt: '2024-04-12', description: 'Capacidade de analisar snippets Python e dar feedback linha por linha.' },
      { title: 'Exercícios adaptativos', reachedAt: '2024-05-20', description: 'Geração de exercícios baseados no nível e histórico do usuário.' },
      { title: 'Versão final', reachedAt: '2024-06-30', description: 'Refatoração, testes, documentação. Projeto concluído e funcionando.' },
    ],
    learnings: [
      'LLMs precisam de contexto bem estruturado. A qualidade do output depende diretamente de como você formata o prompt e o histórico da conversa.',
      'Aprender construindo acelera o aprendizado. Cada problema que encontrei no código me ensinou mais do que qualquer tutorial passivo.',
      'Agentes precisam de fallbacks. Quando o modelo erra, o sistema precisa lidar com graciosidade — não quebrar silenciosamente.',
      'Documentação é um produto. Um agente sem documentação clara é inacessível — aprendi a tratar docs como parte do entregável.',
    ],
  },
  {
    slug: 'balboni-creative-direction-lab',
    patch: {
      emoji: '🎨',
      description: 'Um laboratório de direção criativa com IA — do briefing ao conceito visual em uma sequência guiada.',
      whatItIs: 'Ferramenta para fotógrafos e criativos gerarem conceitos visuais completos a partir de um briefing. O fluxo percorre briefing → conceito → narrativa → moodboard de forma guiada e iterativa.',
      whatItSolves: 'Direção criativa é um processo difuso e difícil de comunicar para clientes. A ferramenta estrutura esse processo e gera um documento visual e narrativo que pode ser compartilhado e aprovado antes do dia da sessão.',
      features: [
        'Briefing estruturado com perguntas contextuais',
        'Geração de conceito visual com IA',
        'Narrativa criativa do ensaio',
        'Moodboard gerado automaticamente',
        'Exportação em PDF para aprovação do cliente',
      ],
      tags: ['IA', 'Fotografia', 'React', 'LLM', 'Criatividade'],
      status: 'construindo',
    },
    milestones: [
      { title: 'Conceito e briefing', reachedAt: '2025-03-01', description: 'Definição do fluxo: que perguntas o briefing precisa fazer para gerar conceitos ricos e únicos?' },
      { title: 'Geração de conceito', reachedAt: '2025-04-10', description: 'Primeira versão: briefing → conceito visual gerado com LLM.' },
      { title: 'Narrativa', reachedAt: '2025-05-08', description: 'Adição da camada de narrativa: o ensaio passou a ter uma história, não só uma estética.' },
      { title: 'Moodboard', reachedAt: '2025-06-02', description: 'Geração de referências visuais consistentes com o conceito aprovado.' },
      { title: 'Exportação PDF', description: 'Em desenvolvimento: documento de aprovação que o cliente assina antes da sessão.' },
    ],
    learnings: [
      'Criatividade não é aleatória — tem estrutura. Modelar o processo criativo em dados me ensinou a nomear o que estava fazendo intuitivamente.',
      'O briefing é o produto. A qualidade do output depende da qualidade das perguntas feitas no início do fluxo.',
      'IA criativa precisa de restrições. Quanto mais direcionado o prompt, mais útil o resultado — liberdade total gera ruído.',
      'UX para criativos é diferente. Interfaces precisam ser visuais, não apenas funcionais — aprendi a equilibrar os dois mundos.',
    ],
  },
]

// ─── runner ───────────────────────────────────────────────────────────────────

async function seedProject({ slug, patch, milestones, learnings }) {
  console.log(`\n── ${slug} ──`)

  // 1. Update project fields
  try {
    await req('PATCH', `/projects/${slug}`, patch)
    console.log('  ✓ campos atualizados')
  } catch (e) {
    console.error('  ✗ PATCH falhou:', e.message)
    return
  }

  // 2. Add milestones (skip if already have some)
  const existing = await req('GET', `/projects/${slug}/milestones`)
  if (existing.length === 0) {
    for (let i = 0; i < milestones.length; i++) {
      const m = milestones[i]
      try {
        await req('POST', `/projects/${slug}/milestones`, { ...m, sortOrder: i })
        console.log(`  ✓ marco: ${m.title}`)
      } catch (e) {
        console.error(`  ✗ marco "${m.title}" falhou:`, e.message)
      }
    }
  } else {
    console.log(`  · marcos já existem (${existing.length}), pulando`)
  }

  // 3. Add learnings (skip if already have some)
  const existingL = await req('GET', `/projects/${slug}/learnings`)
  if (existingL.length === 0) {
    for (const content of learnings) {
      try {
        await req('POST', `/projects/${slug}/learnings`, { content })
        console.log(`  ✓ aprendizado: ${content.slice(0, 50)}…`)
      } catch (e) {
        console.error(`  ✗ aprendizado falhou:`, e.message)
      }
    }
  } else {
    console.log(`  · aprendizados já existem (${existingL.length}), pulando`)
  }
}

async function main() {
  console.log('Populando projetos...')
  for (const p of PROJECTS) {
    await seedProject(p)
  }
  console.log('\nConcluído.')
}

main().catch(err => { console.error(err); process.exit(1) })

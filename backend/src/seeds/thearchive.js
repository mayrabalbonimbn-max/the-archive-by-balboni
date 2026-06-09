const bcrypt = require('bcryptjs')

const GUIDE_POSTS = [
  {
    content: `Bem-vinda ao Archive.

Aqui você guarda o que importa — pensamentos, projetos, fotos, ensaios, código. Tudo no mesmo lugar, organizado do jeito que funciona para você.

Explore à vontade.`,
    type: 'pensamento',
    categoria: 'reflexão',
  },
  {
    content: `Para escrever uma nota: toque em ⊕ ou pressione N.

Escolha o tipo — pensamento, ideia, diário — e escreva. A entrada fica privada por padrão. Você decide quem vê: só você, seus amigos ou o Archive todo.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
  {
    content: `Ensaios têm espaço próprio aqui.

Ative "Ensaio" no compose para escrever com título e corpo longo. Suporte a Markdown: **negrito**, *itálico*, # títulos, \`\`\`código\`\`\`.

Publique quando estiver pronto — ou deixe no arquivo para sempre.`,
    type: 'ensaio',
    categoria: 'aprendizado',
    is_article: true,
    article_title: 'Como escrever um ensaio',
  },
  {
    content: `Fotos ficam no seu arquivo visual.

Ao criar uma entrada, toque no ícone de clipe e escolha uma imagem. O Archive gera miniaturas automaticamente e organiza tudo em /fotos.

Adicione título e descrição se quiser contextualizar o momento.`,
    type: 'pensamento',
    categoria: 'observação',
  },
  {
    content: `PDFs, imagens, arquivos — tudo cabe em uma entrada.

Toque no ícone de clipe ao escrever e escolha o arquivo. Fica armazenado com segurança no seu archive. Você pode adicionar título e descrição a cada anexo para encontrar mais tarde.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
  {
    content: `O Archive tem um sandbox embutido.

Escreva código em Python, JavaScript ou HTML e rode direto no app — sem abrir terminal. Perfeito para testar snippets, scripts e experimentos rápidos.

Escolha o tipo "Código" ao criar uma entrada e ative o modo sandbox.`,
    type: 'código',
    categoria: 'aprendizado',
  },
  {
    content: `Categorias dão contexto ao que você escreve.

Além do tipo de entrada, marque com uma categoria: reflexão, aprendizado, decisão, memória, observação, meta.

O Archive usa isso para organizar e descobrir padrões no seu arquivo ao longo do tempo.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
  {
    content: `/projetos é o seu espaço de trabalho.

Crie um projeto, adicione descrição, status e tags. Vincule entradas diretamente a ele. O Archive mostra o progresso ao longo do tempo — tudo o que você escreveu, criou e aprendeu naquele contexto.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
  {
    content: `Em cada projeto você pode registrar marcos e aprendizados.

Marcos são conquistas com data — o dia que lançou, que terminou, que decidiu. Aprendizados são insights que você quer guardar separado do diário geral.

Acesse em /projetos → seu projeto → aba Marcos.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
  {
    content: `Cápsulas do tempo são entradas que só abrem no futuro.

Escreva para a versão de você daqui a 6 meses, 1 ano, 5 anos. Defina a data de abertura. O Archive bloqueia o conteúdo até lá.

Acesse em /cápsulas.`,
    type: 'pensamento',
    categoria: 'memória',
  },
  {
    content: `O Archive guarda tudo com carimbo de data.

Em /memórias você vê entradas antigas em modo "neste dia, há X anos". Em /hoje você tem a visão diária com contexto. Em /calendário, a navegação temporal completa.

A linha do tempo é sua.`,
    type: 'pensamento',
    categoria: 'memória',
  },
  {
    content: `Tags conectam ideias entre si.

Use #tag ao escrever para categorizar. Use [[título]] para linkar uma entrada a outra. O grafo em /trajetória → Conexões mostra como tudo se relaciona visualmente.

Backlinks funcionam como hiperlinks do seu pensamento.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
  {
    content: `O Graph é o mapa do que você pensou.

Em /trajetória → Conexões você vê um grafo interativo de entradas, projetos e tags. Cada nó é algo que você criou. As arestas são as conexões que você fez.

Zoom in e explore.`,
    type: 'pensamento',
    categoria: 'observação',
  },
  {
    content: `Busca global: ⌘K ou Ctrl+K.

Pesquise entradas, arquivos, pessoas, artigos — tudo de uma vez. A busca entende texto, título, tag e nome. É a forma mais rápida de navegar pelo seu arquivo.

Também disponível em /explorar.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
  {
    content: `Cada entrada tem sua própria audiência.

Privado: só você vê. Amigos: visível para quem você adicionou. Público: qualquer pessoa no Archive pode ver.

Você pode mudar a visibilidade a qualquer momento — antes ou depois de publicar.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
  {
    content: `Entradas públicas e de amigos aceitam comentários.

Toque em "Comentar" abaixo de uma entrada. Você pode responder comentários, editar e excluir os seus. O autor da entrada recebe uma notificação.

Conversas acontecem no contexto do que foi escrito.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
  {
    content: `Além de curtir, o Archive tem reações com intenção.

♥ Coração — gostei. ✦ Faísca — me inspirou. 💾 Salvar — quero reler. Também: Inspirador, Aprendizado, Código, Fotografia.

Cada reação é um sinal diferente. Use o que faz mais sentido para o que você está sentindo.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
  {
    content: `Mensagens diretas ficam em /mensagens.

Envie uma mensagem privada para qualquer pessoa. A conversa fica salva e é acessível só para vocês dois. Sem algoritmo, sem feed público — só conversa.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
  {
    content: `Stories duram 24 horas — mas ficam arquivados.

Crie um story de texto ou foto para compartilhar algo do momento. Depois das 24h ele some do feed de histórias, mas você acessa tudo em /arquivo → Stories.

Seu story é sua memória efêmera que não some de verdade.`,
    type: 'pensamento',
    categoria: 'memória',
  },
  {
    content: `Trajetória é o seu painel de progresso.

Em /trajetória você vê: Narrativa (como você escreve sobre si), Marcos (conquistas em linha do tempo), Números (posts, dias ativos, sequências), Conexões (grafo) e Retrospectiva (revisão por ano).

O Archive acompanha quem você está se tornando.`,
    type: 'pensamento',
    categoria: 'reflexão',
  },
]

async function seedTheArchive(pool) {
  try {
    // Check if @thearchive exists
    const { rows: [existing] } = await pool.query(
      'SELECT id FROM profiles WHERE handle = $1',
      ['thearchive']
    )

    let profileId
    if (existing) {
      profileId = existing.id
    } else {
      const hash = await bcrypt.hash('thearchive123', 12)
      const { rows: [created] } = await pool.query(
        `INSERT INTO profiles (name, handle, bio, is_system, onboarding_completed, password_hash)
         VALUES ($1, $2, $3, true, true, $4)
         RETURNING id`,
        ['The Archive', 'thearchive', 'Guia silencioso do Archive.', hash]
      )
      profileId = created.id
      console.log('✓ @thearchive profile created')
    }

    // Ensure is_system is set (idempotent)
    await pool.query(
      'UPDATE profiles SET is_system = true WHERE id = $1',
      [profileId]
    )

    // Create posts that don't exist yet — keyed by first 60 chars of content
    const { rows: existing_posts } = await pool.query(
      'SELECT LEFT(content, 60) AS key FROM posts WHERE profile_id = $1',
      [profileId]
    )
    const existingKeys = new Set(existing_posts.map(r => r.key.trim()))

    let created = 0
    for (const post of GUIDE_POSTS) {
      const key = post.content.trim().slice(0, 60)
      if (existingKeys.has(key)) continue

      await pool.query(
        `INSERT INTO posts
           (profile_id, content, type, is_private, visibility, categoria, is_article, article_title)
         VALUES ($1, $2, $3, false, 'public', $4, $5, $6)`,
        [
          profileId,
          post.content,
          post.type,
          post.categoria || null,
          post.is_article || false,
          post.article_title || null,
        ]
      )
      created++
    }

    if (created > 0) console.log(`✓ @thearchive: ${created} guide posts created`)
  } catch (err) {
    console.error('✗ @thearchive seed failed:', err.message)
  }
}

module.exports = seedTheArchive

const bcrypt = require('bcryptjs')

// Slug is the deduplication key — never change a slug once in production.
const OFFICIAL_POSTS = [
  // ── Editorial / philosophy ────────────────────────────────────────────────
  {
    slug: 'bem-vinda-ao-archive',
    content: `O Archive é um lugar para guardar o que importa sem transformar tudo em performance.\n\nNotas, fotos, projetos, arquivos, código e memórias podem viver no mesmo espaço — com calma.`,
    type: 'pensamento',
    categoria: 'reflexão',
  },
  {
    slug: 'nota-nao-precisa-estar-pronta',
    content: `Uma nota pode ser só uma frase que você ainda não entende completamente.\n\nNem todo pensamento precisa nascer finalizado. Alguns só precisam ser guardados antes de desaparecer.`,
    type: 'pensamento',
    categoria: 'reflexão',
  },
  {
    slug: 'projetos-tambem-tem-memoria',
    content: `Um projeto não é só o resultado final.\n\nEle também é feito de decisões, versões, pausas, dúvidas e pequenos avanços. Guardar esse caminho ajuda você a enxergar o que construiu.`,
    type: 'pensamento',
    categoria: 'observação',
  },
  {
    slug: 'capsulas-do-tempo',
    content: `Uma cápsula é uma mensagem que espera.\n\nVocê escolhe uma data, guarda algo e deixa o tempo fazer sua parte. Quando abrir, talvez você encontre uma versão antiga de si mesma.`,
    type: 'pensamento',
    categoria: 'memória',
  },
  {
    slug: 'privacidade-sem-pressao',
    content: `Nem tudo precisa ser público.\n\nCada entrada pode ser privada, visível para amigos ou aberta. O Archive deixa você decidir o tamanho da sala antes de escrever.`,
    type: 'pensamento',
    categoria: 'reflexão',
  },
  {
    slug: 'memorias-voltam-com-contexto',
    content: `O que você guarda hoje pode voltar em outro momento.\n\nMemórias e calendário existem para mostrar que a sua trajetória não é uma linha reta — é um arquivo vivo.`,
    type: 'pensamento',
    categoria: 'memória',
  },
  {
    slug: 'codigo-tambem-e-pensamento',
    content: `Um trecho de código pode guardar mais do que uma solução.\n\nPode guardar o momento em que algo finalmente fez sentido. Por isso o Archive também abre espaço para experimentar e registrar código.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
  {
    slug: 'tags-conectam-ideias',
    content: `Tags e links internos ajudam pensamentos distantes a se encontrarem.\n\nCom o tempo, o Graph mostra relações que talvez você não percebesse enquanto escrevia.`,
    type: 'pensamento',
    categoria: 'observação',
  },
  {
    slug: 'trajetoria',
    content: `A trajetória não é uma pontuação.\n\nÉ um modo de observar continuidade: o que você criou, revisitou, aprendeu e decidiu ao longo do tempo.`,
    type: 'pensamento',
    categoria: 'reflexão',
  },
  {
    slug: 'voltar-depois-tambem-faz-parte',
    content: `Você não precisa usar o Archive com urgência.\n\nEle foi feito para permanecer. Voltar depois, reler, reorganizar e entender melhor também é parte do processo.`,
    type: 'pensamento',
    categoria: 'reflexão',
  },

  // ── How-to / feature tips ─────────────────────────────────────────────────
  {
    slug: 'como-criar-uma-capsula',
    content: `Como criar uma cápsula do tempo\n\nAo criar uma entrada, ative a opção Cápsula e escolha uma data de abertura.\n\nA entrada fica bloqueada até lá. Você pode criar cápsulas para daqui a uma semana, um ano ou uma década.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
  {
    slug: 'como-o-graph-funciona',
    content: `Como o Graph funciona\n\nO Graph mapeia conexões entre suas entradas a partir das tags que você usa.\n\nQuanto mais você escreve, mais o mapa cresce. É possível identificar padrões e temas recorrentes que talvez você não perceba no dia a dia.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
  {
    slug: 'como-usar-colecoes',
    content: `Como usar coleções\n\nColeções são grupos manuais de entradas que pertencem ao mesmo tema — mesmo que não sejam um projeto formal.\n\nCrie uma coleção pelo Archive (aba Coleções) e associe entradas a ela no momento de escrever.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
  {
    slug: 'como-usar-stories',
    content: `Como usar Stories\n\nStories são registros rápidos, visuais e efêmeros — diferentes das entradas do arquivo.\n\nUse para capturar um momento, uma foto ou uma ideia que não precisa durar para sempre, mas merece existir agora.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
  {
    slug: 'tipos-de-entrada',
    content: `Tipos de entrada no Archive\n\nNota — um pensamento, observação ou fragmento.\nEnsaio — texto longo, estruturado, com título.\nFoto — imagem com contexto.\nCódigo — trecho com syntax highlighting.\nCápsula — entrada com data de abertura futura.\n\nCada tipo tem seu ritmo. Use o que fizer sentido para o momento.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
  {
    slug: 'como-funciona-privacidade',
    content: `Visibilidade de cada entrada\n\nPrivada — só você vê.\nAmigos — visível para quem você aceitou como amigo.\nSeguidores — visível para quem te segue.\nPública — qualquer pessoa autenticada pode ver.\n\nO padrão é privado. Você decide o que abre e para quem.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
  {
    slug: 'como-usar-memorias',
    content: `Como funciona a seção Memórias\n\nA seção Memórias no seu Arquivo mostra entradas que você criou neste mesmo dia em anos anteriores.\n\nÉ uma forma de o Archive trazer de volta o que você guardou — sem que você precise procurar.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
  {
    slug: 'como-criar-projeto',
    content: `Como criar um projeto\n\nProjetos organizam entradas em torno de um objetivo com início e fim.\n\nCrie um projeto, associe entradas a ele enquanto trabalha, e o Archive mantém o histórico de tudo que aconteceu dentro daquele contexto.`,
    type: 'pensamento',
    categoria: 'aprendizado',
  },
]

async function seedTheArchive(pool) {
  try {
    const { rows: [existing] } = await pool.query(
      "SELECT id FROM profiles WHERE TRIM(LEADING '@' FROM LOWER(handle)) = 'thearchive' AND is_system = true"
    )

    const hash = await bcrypt.hash('thearchive123', 12)

    let profileId
    if (existing) {
      profileId = existing.id
    } else {
      const { rows: [created] } = await pool.query(
        `INSERT INTO profiles (name, handle, bio, is_system, onboarding_completed, password_hash)
         VALUES ($1, $2, $3, true, true, $4)
         RETURNING id`,
        ['The Archive', '@thearchive', 'um lugar para guardar o que importa.', hash]
      )
      profileId = created.id
      console.log('✓ @thearchive profile created')
    }

    await pool.query(
      "UPDATE profiles SET is_system = true, password_hash = $2, handle = '@thearchive', bio = 'um lugar para guardar o que importa.' WHERE id = $1",
      [profileId, hash]
    )

    const { rows: existingPosts } = await pool.query(
      'SELECT TRIM(content) AS content FROM posts WHERE profile_id = $1',
      [profileId]
    )
    const existingContents = new Set(existingPosts.map(r => r.content.trim()))

    let created = 0
    for (const post of OFFICIAL_POSTS) {
      if (existingContents.has(post.content.trim())) continue

      await pool.query(
        `INSERT INTO posts (profile_id, content, type, is_private, visibility, categoria)
         VALUES ($1, $2, $3, false, 'public', $4)`,
        [profileId, post.content, post.type, post.categoria || null]
      )
      created++
    }

    if (created > 0) console.log(`✓ @thearchive: ${created} official posts created`)
    else console.log('✓ @thearchive: posts already up to date')
  } catch (err) {
    console.error('✗ @thearchive seed failed:', err.message)
  }
}

module.exports = seedTheArchive

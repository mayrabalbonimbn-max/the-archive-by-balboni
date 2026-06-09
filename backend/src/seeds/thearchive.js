const bcrypt = require('bcryptjs')

const SHOWCASE_POSTS = [
  // ── notas / pensamentos ──────────────────────────────────────────────────────

  {
    content: `primeiro registro.

não é pra ninguém ver — é pra mim daqui a um ano lembrar de quando isso era só uma ideia solta num caderno.`,
    type: 'pensamento',
    categoria: 'memória',
  },

  {
    content: `descobri que escrevo melhor quando não tô tentando impressionar ninguém.

talvez seja por isso que esse lugar funciona pra mim.`,
    type: 'pensamento',
    categoria: 'reflexão',
  },

  {
    content: `acordei às 6h sem motivo. fiquei olhando o teto uns vinte minutos e pensei em tudo que ainda não comecei.

escrevi aqui em vez de ficar rolando o feed. foi melhor.`,
    type: 'diário',
    categoria: 'observação',
    is_diary: true,
  },

  {
    content: `três projetos abertos ao mesmo tempo.

nenhum terminado. todos importantes. escolher qual continuar é a parte que ninguém ensina.`,
    type: 'pensamento',
    categoria: 'reflexão',
  },

  {
    content: `relí uma nota que escrevi há oito meses sobre um projeto que abandonei.

estranhei a versão de mim que acreditava tão certo naquilo. não de um jeito triste — de um jeito de: olha quanta coisa aconteceu desde então.`,
    type: 'pensamento',
    categoria: 'memória',
  },

  {
    content: `guardei um story hoje só porque o céu tava absurdo.

some do feed amanhã, mas fica comigo pra sempre — que é o ponto.`,
    type: 'pensamento',
    categoria: 'observação',
  },

  {
    content: `às vezes o ato de registrar muda o que aconteceu.

escrevo "foi um dia difícil" e percebo que não foi — foi um dia cheio. as palavras exatas importam.`,
    type: 'pensamento',
    categoria: 'reflexão',
  },

  {
    content: `escrevi uma cápsula hoje pra abrir daqui um ano.

não vou lembrar o que escrevi. é esse o ponto — deixar algo pra me surpreender quando eu for uma pessoa um pouco diferente.`,
    type: 'pensamento',
    categoria: 'memória',
  },

  {
    content: `em algum momento parei de curtir o twitter — não de uma vez, foi saindo aos poucos.

o problema não era o conteúdo. era eu verificando curtidas como se fossem algum tipo de prova de que eu existia.`,
    type: 'pensamento',
    categoria: 'reflexão',
  },

  {
    content: `li isso e fiquei pensando o dia inteiro: "os melhores produtos nascem de quem resolve a própria dor."

é o que eu quero lembrar quando perder a fé no que tô construindo.

https://paulgraham.com/startupideas.html`,
    type: 'pensamento',
    categoria: 'aprendizado',
    link_preview: {
      url: 'https://paulgraham.com/startupideas.html',
      title: 'How to Get Startup Ideas',
      description: 'The way to get startup ideas is not to try to think of startup ideas. It\'s to look for problems, preferably problems you have yourself.',
      image: null,
      siteName: 'paulgraham.com',
    },
  },

  // ── código ───────────────────────────────────────────────────────────────────

  {
    content: `travei meia hora num bug idiota de encoding. quando rodou, quis registrar — porque mês que vem vou esquecer que já foi difícil.`,
    type: 'código',
    categoria: 'aprendizado',
    code_language: 'python',
    code_content: `def limpar_texto(texto):
    return texto.encode('utf-8', errors='ignore').decode('utf-8').strip()

# simples. mas eu não sabia. agora sei.`,
  },

  {
    content: `sempre esqueço como escrever debounce. sempre pesquiso de novo. agora tá aqui.`,
    type: 'código',
    categoria: 'aprendizado',
    code_language: 'javascript',
    code_content: `const debounce = (fn, ms) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}`,
  },

  // ── ensaios ──────────────────────────────────────────────────────────────────

  {
    content: `guardo coisas que não tenho com quem dividir. não porque sejam secretas — às vezes só porque não quero diluir antes de entender.

há uma diferença entre processar sozinha e guardar. processar é transitório. guardar é dizer: isso importou.

esse lugar é pra o que importou.`,
    type: 'ensaio',
    categoria: 'reflexão',
    is_article: true,
    article_title: 'o que guardo',
  },

  {
    content: `não foi uma decisão dramática. foi acumulando: a sensação de que cada coisa que eu escrevia virava imediatamente uma questão de alcance.

um pensamento incompleto tem valor. mas o feed não deixa nada ser incompleto — ele transforma tudo em declaração pública, em performance de quem você quer parecer.

aqui escrevo antes de saber o que acho. isso muda tudo.`,
    type: 'ensaio',
    categoria: 'reflexão',
    is_article: true,
    article_title: 'por que saí do twitter',
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

    // Idempotent: key by first 60 chars of content
    const { rows: existing_posts } = await pool.query(
      'SELECT LEFT(content, 60) AS key FROM posts WHERE profile_id = $1',
      [profileId]
    )
    const existingKeys = new Set(existing_posts.map(r => r.key.trim()))

    let created = 0
    for (const post of SHOWCASE_POSTS) {
      const key = post.content.trim().slice(0, 60)
      if (existingKeys.has(key)) continue

      await pool.query(
        `INSERT INTO posts
           (profile_id, content, type, is_private, is_diary, visibility, categoria,
            is_article, article_title, code_language, code_content, link_preview)
         VALUES ($1, $2, $3, false, $4, 'public', $5, $6, $7, $8, $9, $10)`,
        [
          profileId,
          post.content,
          post.type,
          post.is_diary || false,
          post.categoria || null,
          post.is_article || false,
          post.article_title || null,
          post.code_language || null,
          post.code_content || null,
          post.link_preview ? JSON.stringify(post.link_preview) : null,
        ]
      )
      created++
    }

    if (created > 0) console.log(`✓ @thearchive: ${created} showcase posts created`)
  } catch (err) {
    console.error('✗ @thearchive seed failed:', err.message)
  }
}

module.exports = seedTheArchive

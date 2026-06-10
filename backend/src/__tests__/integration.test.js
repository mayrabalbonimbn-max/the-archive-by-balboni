'use strict'

// Load .env.test first (test DB), fall back to .env
const path = require('path')
const fs = require('fs')
const testEnvPath = path.join(__dirname, '../../.env.test')
if (fs.existsSync(testEnvPath)) {
  require('dotenv').config({ path: testEnvPath })
} else {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') })
}

// Silence push notification errors in tests
process.env.VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || ''
process.env.VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''

const { describe, it, before, after } = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')
const app = require('../app')
const pool = require('../db')

// ─── Guard: skip all tests if DB is not reachable ────────────────────────────
before(async () => {
  try {
    await pool.query('SELECT 1')
  } catch {
    console.error(
      '\n  ⚠  Banco de dados não disponível. Testes ignorados.' +
      '\n     Configure .env.test com DATABASE_URL apontando para um banco local.' +
      '\n     Exemplo:' +
      '\n       createdb archive_test' +
      '\n       cp .env.test.example .env.test  # e preencha DATABASE_URL\n'
    )
    process.exit(0)
  }
  await pool.initialize()
}, { timeout: 30000 })

// Unique run ID so parallel runs don't collide
const RUN_ID = Date.now().toString(36)
function testHandle(suffix) {
  return `@_test_${RUN_ID}_${suffix}`
}

// ─── Helper: register a test user and return { token, profile } ───────────────
async function registerUser(suffix) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: `Test ${suffix}`, handle: testHandle(suffix), password: 'senha123' })
  assert.equal(res.status, 201, `register ${suffix} failed: ${JSON.stringify(res.body)}`)
  return { token: res.body.token, profile: res.body.profile }
}

// ─── Helper: delete a test profile and all its data (CASCADE) ─────────────────
async function cleanupProfile(profileId) {
  await pool.query('DELETE FROM profiles WHERE id = $1', [profileId])
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTH / PERFIL
// ─────────────────────────────────────────────────────────────────────────────
describe('Auth & perfil', () => {
  let token, profile

  before(async () => {
    ;({ token, profile } = await registerUser('auth'))
  })

  after(async () => {
    await cleanupProfile(profile.id)
  })

  it('login com credenciais corretas retorna token e perfil', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ handle: testHandle('auth'), password: 'senha123' })
    assert.equal(res.status, 200)
    assert.ok(res.body.token, 'deve retornar token')
    assert.equal(res.body.profile.handle, testHandle('auth'))
  })

  it('login com senha errada retorna 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ handle: testHandle('auth'), password: 'errada' })
    assert.equal(res.status, 401)
  })

  it('GET /api/me retorna perfil autenticado', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${token}`)
    assert.equal(res.status, 200)
    assert.equal(res.body.id, profile.id)
    assert.equal(res.body.handle, testHandle('auth'))
  })

  it('GET /api/me sem token retorna 401', async () => {
    const res = await request(app).get('/api/me')
    assert.equal(res.status, 401)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. POSTS — CRUD básico
// ─────────────────────────────────────────────────────────────────────────────
describe('Posts — CRUD', () => {
  let token, profile, postId

  before(async () => {
    ;({ token, profile } = await registerUser('posts'))
  })

  after(async () => {
    await cleanupProfile(profile.id)
  })

  it('POST /api/posts cria post e retorna 201', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Entrada de teste de integração', type: 'pensamento', visibility: 'private' })
    assert.equal(res.status, 201)
    assert.ok(res.body.id)
    assert.equal(res.body.content, 'Entrada de teste de integração')
    postId = res.body.id
  })

  it('GET /api/posts lista posts do usuário', async () => {
    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${token}`)
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body))
    const found = res.body.find(p => p.id === postId)
    assert.ok(found, 'post criado deve aparecer no feed')
  })

  it('GET /api/posts/:id retorna post por ID', async () => {
    const res = await request(app)
      .get(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
    assert.equal(res.status, 200)
    assert.equal(res.body.id, postId)
    assert.equal(res.body.content, 'Entrada de teste de integração')
  })

  it('POST /api/posts sem conteúdo retorna 400', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '  ', type: 'pensamento' })
    assert.equal(res.status, 400)
  })

  it('DELETE /api/posts/:id deleta post próprio', async () => {
    const del = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
    assert.equal(del.status, 204)

    const check = await request(app)
      .get(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
    assert.equal(check.status, 404)
  })

  it('DELETE /api/posts/:id de outro usuário retorna 404', async () => {
    // Create a second user and try to delete the first user's post
    const other = await registerUser('posts_other')
    try {
      // Create a post as first user
      const create = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Post alheio', type: 'pensamento', visibility: 'private' })
      assert.equal(create.status, 201)

      const del = await request(app)
        .delete(`/api/posts/${create.body.id}`)
        .set('Authorization', `Bearer ${other.token}`)
      assert.equal(del.status, 404)

      // Cleanup that post
      await request(app)
        .delete(`/api/posts/${create.body.id}`)
        .set('Authorization', `Bearer ${token}`)
    } finally {
      await cleanupProfile(other.profile.id)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. PRIVACIDADE SOCIAL
// ─────────────────────────────────────────────────────────────────────────────
describe('Privacidade em rotas públicas e sociais', () => {
  let owner, viewer
  let privatePostId, publicPostId, followersPostId

  before(async () => {
    owner = await registerUser('privacy_owner')
    viewer = await registerUser('privacy_viewer')

    const privatePost = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ content: 'Registro privado não deve vazar.', type: 'pensamento', visibility: 'private' })
    assert.equal(privatePost.status, 201)
    privatePostId = privatePost.body.id

    const publicPost = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ content: 'Registro público pode aparecer.', type: 'pensamento', visibility: 'public' })
    assert.equal(publicPost.status, 201)
    publicPostId = publicPost.body.id

    const followersPost = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ content: 'Registro apenas para seguidores.', type: 'pensamento', visibility: 'followers' })
    assert.equal(followersPost.status, 201)
    followersPostId = followersPost.body.id
  })

  after(async () => {
    await cleanupProfile(owner.profile.id)
    await cleanupProfile(viewer.profile.id)
  })

  it('perfil público não expõe posts privados para outro usuário', async () => {
    const res = await request(app)
      .get(`/api/profiles/${owner.profile.id}/posts`)
      .set('Authorization', `Bearer ${viewer.token}`)
    assert.equal(res.status, 200)
    assert.ok(!res.body.some(p => p.id === privatePostId), 'post privado não deve aparecer')
    assert.ok(res.body.some(p => p.id === publicPostId), 'post público deve aparecer')
    assert.ok(!res.body.some(p => p.id === followersPostId), 'post followers não deve aparecer antes de seguir')
  })

  it('feed público não expõe posts privados ou de seguidores', async () => {
    const res = await request(app)
      .get('/api/posts/explore')
      .set('Authorization', `Bearer ${viewer.token}`)
    assert.equal(res.status, 200)
    assert.ok(!res.body.some(p => p.id === privatePostId), 'feed público não deve incluir privado')
    assert.ok(!res.body.some(p => p.id === followersPostId), 'feed público não deve incluir followers')
    assert.ok(res.body.some(p => p.id === publicPostId), 'feed público deve incluir público')
  })

  it('post followers aparece depois de seguir o perfil', async () => {
    const follow = await request(app)
      .post(`/api/follows/${owner.profile.id}`)
      .set('Authorization', `Bearer ${viewer.token}`)
      .send({})
    assert.equal(follow.status, 201)

    const res = await request(app)
      .get(`/api/profiles/${owner.profile.id}/posts`)
      .set('Authorization', `Bearer ${viewer.token}`)
    assert.equal(res.status, 200)
    assert.ok(res.body.some(p => p.id === followersPostId), 'post followers deve aparecer para seguidor')
    assert.ok(!res.body.some(p => p.id === privatePostId), 'post privado continua invisível')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. CATEGORIAS
// ─────────────────────────────────────────────────────────────────────────────
describe('Categorias', () => {
  let token, profile

  before(async () => {
    ;({ token, profile } = await registerUser('cat'))
  })

  after(async () => {
    await cleanupProfile(profile.id)
  })

  it('categoria persiste no GET /api/posts/:id após criação', async () => {
    const create = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Aprendi algo hoje sobre sistemas.', type: 'pensamento', categoria: 'aprendizado', visibility: 'private' })
    assert.equal(create.status, 201)
    assert.equal(create.body.categoria, 'aprendizado', 'categoria deve estar na resposta do POST')

    const get = await request(app)
      .get(`/api/posts/${create.body.id}`)
      .set('Authorization', `Bearer ${token}`)
    assert.equal(get.status, 200)
    assert.equal(get.body.categoria, 'aprendizado', 'categoria deve persistir no GET')
  })

  it('categoria inválida é ignorada (null)', async () => {
    const create = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Post sem categoria válida.', type: 'pensamento', categoria: 'inventada', visibility: 'private' })
    assert.equal(create.status, 201)

    const get = await request(app)
      .get(`/api/posts/${create.body.id}`)
      .set('Authorization', `Bearer ${token}`)
    assert.equal(get.body.categoria, null, 'categoria inválida deve ser null')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. REAÇÕES
// ─────────────────────────────────────────────────────────────────────────────
describe('Reações', () => {
  let token, profile, postId

  before(async () => {
    ;({ token, profile } = await registerUser('react'))
    const create = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Post para reagir.', type: 'pensamento', visibility: 'private' })
    assert.equal(create.status, 201)
    postId = create.body.id
  })

  after(async () => {
    await cleanupProfile(profile.id)
  })

  it('reagir com heart incrementa contador', async () => {
    const res = await request(app)
      .patch(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'react', reactionType: 'heart' })
    assert.equal(res.status, 200)
    assert.equal(res.body.reactionCounts.heart, 1)
    assert.ok(res.body.viewerReactions.includes('heart'))
  })

  it('reagir novamente com o mesmo tipo remove a reação (toggle)', async () => {
    const res = await request(app)
      .patch(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'react', reactionType: 'heart' })
    assert.equal(res.status, 200)
    assert.equal(res.body.reactionCounts.heart ?? 0, 0)
    assert.ok(!res.body.viewerReactions.includes('heart'))
  })

  it('trocar reação primária remove a anterior', async () => {
    // Add heart
    await request(app)
      .patch(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'react', reactionType: 'heart' })

    // Switch to inspirador (also primary)
    const res = await request(app)
      .patch(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'react', reactionType: 'inspirador' })
    assert.equal(res.status, 200)
    assert.equal(res.body.reactionCounts.heart ?? 0, 0, 'heart deve ter sido removido')
    assert.ok(res.body.viewerReactions.includes('inspirador'))
  })

  it('reação inválida retorna 400', async () => {
    const res = await request(app)
      .patch(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'react', reactionType: 'inexistente' })
    assert.equal(res.status, 400)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. COMENTÁRIOS
// ─────────────────────────────────────────────────────────────────────────────
describe('Comentários', () => {
  let token, profile, postId, commentId

  before(async () => {
    ;({ token, profile } = await registerUser('comment'))
    const create = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Post para comentar.', type: 'pensamento', visibility: 'private' })
    postId = create.body.id
  })

  after(async () => {
    await cleanupProfile(profile.id)
  })

  it('POST /api/posts/:id/comments cria comentário', async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Comentário de teste.' })
    assert.equal(res.status, 201)
    assert.ok(res.body.id)
    assert.equal(res.body.content, 'Comentário de teste.')
    commentId = res.body.id
  })

  it('GET /api/posts/:id/comments lista comentários', async () => {
    const res = await request(app)
      .get(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body))
    const found = res.body.find(c => c.id === commentId)
    assert.ok(found, 'comentário criado deve aparecer na lista')
    assert.equal(found.replies.length, 0)
  })

  it('POST /api/comments/:id/replies cria resposta ao comentário', async () => {
    const res = await request(app)
      .post(`/api/comments/${commentId}/replies`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Resposta ao comentário.' })
    assert.equal(res.status, 201)
    assert.ok(res.body.id)
    assert.equal(res.body.content, 'Resposta ao comentário.')
  })

  it('comentário em post inexistente retorna 404', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const res = await request(app)
      .post(`/api/posts/${fakeId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Comentário órfão.' })
    assert.equal(res.status, 404)
  })

  it('comentário vazio retorna 400', async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '   ' })
    assert.equal(res.status, 400)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. CÁPSULAS DO TEMPO
// ─────────────────────────────────────────────────────────────────────────────
describe('Cápsulas do tempo', () => {
  let token, profile, capsuleId

  before(async () => {
    ;({ token, profile } = await registerUser('capsule'))
  })

  after(async () => {
    await cleanupProfile(profile.id)
  })

  it('criar cápsula futura retorna 201 com is_time_capsule = true', async () => {
    const unlockAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Mensagem para o futuro.',
        type: 'pensamento',
        visibility: 'private',
        isTimeCapsule: true,
        unlockAt,
      })
    assert.equal(res.status, 201)
    assert.ok(res.body.isTimeCapsule, 'isTimeCapsule deve ser true')
    assert.ok(res.body.unlockAt, 'unlockAt deve estar presente')
    capsuleId = res.body.id
  })

  it('cápsula futura não aparece no feed principal (GET /api/posts)', async () => {
    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${token}`)
    assert.equal(res.status, 200)
    const found = res.body.find(p => p.id === capsuleId)
    assert.ok(!found, 'cápsula futura não deve aparecer no feed')
  })

  it('cápsula aparece em GET /api/capsules para o dono', async () => {
    const res = await request(app)
      .get('/api/capsules')
      .set('Authorization', `Bearer ${token}`)
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body))
    const found = res.body.find(c => c.id === capsuleId)
    assert.ok(found, 'cápsula deve aparecer na rota /capsules do dono')
  })

  it('cápsula com unlockAt no passado retorna 400', async () => {
    const pastDate = new Date(Date.now() - 1000).toISOString()
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Tentativa de cápsula no passado.',
        type: 'pensamento',
        visibility: 'private',
        isTimeCapsule: true,
        unlockAt: pastDate,
      })
    assert.equal(res.status, 400)
    assert.equal(res.body.error, 'A data de abertura da cápsula deve ser no futuro.')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. PROJETOS
// ─────────────────────────────────────────────────────────────────────────────
describe('Projetos', () => {
  let token, profile, projectSlug, postId

  before(async () => {
    ;({ token, profile } = await registerUser('proj'))
  })

  after(async () => {
    await cleanupProfile(profile.id)
  })

  it('POST /api/projects cria projeto', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Projeto Teste', description: 'Descrição de teste.', status: 'ativo' })
    assert.equal(res.status, 201)
    assert.ok(res.body.id)
    assert.equal(res.body.title, 'Projeto Teste')
    assert.ok(res.body.slug, 'slug deve estar presente')
    projectSlug = res.body.slug
  })

  it('PATCH /api/projects/:slug edita projeto', async () => {
    const res = await request(app)
      .patch(`/api/projects/${projectSlug}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Descrição atualizada.', status: 'construindo' })
    assert.equal(res.status, 200)
    assert.equal(res.body.description, 'Descrição atualizada.')
    assert.equal(res.body.status, 'construindo')
  })

  it('GET /api/projects lista projetos do usuário', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`)
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body))
    const found = res.body.find(p => p.slug === projectSlug)
    assert.ok(found, 'projeto criado deve aparecer na listagem')
  })

  it('vincular post ao projeto via projectId', async () => {
    // Get project ID from list
    const projects = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`)
    const proj = projects.body.find(p => p.slug === projectSlug)

    const create = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Post vinculado ao projeto.',
        type: 'pensamento',
        visibility: 'private',
        projectId: proj.id,
      })
    assert.equal(create.status, 201)
    assert.equal(create.body.projectId, proj.id, 'projectId deve constar no post criado')
    postId = create.body.id
  })

  it('GET /api/projects/:slug/posts retorna post vinculado', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectSlug}/posts`)
      .set('Authorization', `Bearer ${token}`)
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body))
    const found = res.body.find(p => p.id === postId)
    assert.ok(found, 'post vinculado deve aparecer em /projects/:slug/posts')
  })

  it('POST /api/projects sem título retorna 400', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Sem título.' })
    assert.equal(res.status, 400)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Teardown: close pool so the process exits cleanly
// ─────────────────────────────────────────────────────────────────────────────
after(async () => {
  await pool.end()
})

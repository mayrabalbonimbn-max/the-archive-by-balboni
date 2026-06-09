const express = require('express')
const pool = require('../db')
const requireAuth = require('../middleware/auth')
const { sendPushToUser } = require('../utils/push')

const router = express.Router()
router.use(requireAuth)

function toPerson(row) {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    avatar: row.avatar,
    isFollowing: row.is_following === true,
    followerCount: Number(row.follower_count || 0),
    followingCount: Number(row.following_count || 0),
  }
}

function normalizeHandle(handle = '') {
  const clean = handle.trim()
  return clean.startsWith('@') ? clean : `@${clean}`
}

async function notify(profileId, actorId, type, message) {
  if (!profileId || profileId === actorId) return
  await pool.query(
    `INSERT INTO notifications (profile_id, actor_id, type, message)
     VALUES ($1, $2, $3, $4)`,
    [profileId, actorId, type, message]
  )
}

router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim()
    if (q.length < 2) return res.json([])
    const handle = q.startsWith('@') ? normalizeHandle(q) : `%${q}%`
    const result = await pool.query(
      `SELECT p.id, p.name, p.handle, p.avatar,
        EXISTS (SELECT 1 FROM follows fl WHERE fl.follower_id = $1 AND fl.following_id = p.id) AS is_following,
        (SELECT COUNT(*)::int FROM follows fl WHERE fl.following_id = p.id) AS follower_count,
        (SELECT COUNT(*)::int FROM follows fl WHERE fl.follower_id = p.id) AS following_count
       FROM profiles p
       WHERE p.id != $1
         AND (lower(p.handle) LIKE lower($2) OR lower(p.name) LIKE lower($3))
       ORDER BY lower(p.handle)
       LIMIT 12`,
      [req.user.profileId, handle, `%${q}%`]
    )
    res.json(result.rows.map(toPerson))
  } catch (err) {
    console.error('GET /follows/search error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.get('/following', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.handle, p.avatar, true AS is_following,
        (SELECT COUNT(*)::int FROM follows fl WHERE fl.following_id = p.id) AS follower_count,
        (SELECT COUNT(*)::int FROM follows fl WHERE fl.follower_id = p.id) AS following_count
       FROM follows f
       JOIN profiles p ON p.id = f.following_id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.profileId]
    )
    res.json(result.rows.map(toPerson))
  } catch (err) {
    console.error('GET /follows/following error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.get('/followers', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.handle, p.avatar,
        EXISTS (SELECT 1 FROM follows mine WHERE mine.follower_id = $1 AND mine.following_id = p.id) AS is_following,
        (SELECT COUNT(*)::int FROM follows fl WHERE fl.following_id = p.id) AS follower_count,
        (SELECT COUNT(*)::int FROM follows fl WHERE fl.follower_id = p.id) AS following_count
       FROM follows f
       JOIN profiles p ON p.id = f.follower_id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.profileId]
    )
    res.json(result.rows.map(toPerson))
  } catch (err) {
    console.error('GET /follows/followers error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.post('/:profileId', async (req, res) => {
  try {
    const target = await pool.query('SELECT id, name FROM profiles WHERE id = $1 AND id != $2', [req.params.profileId, req.user.profileId])
    if (target.rowCount === 0) return res.status(404).json({ error: 'Perfil não encontrado.' })
    await pool.query(
      `INSERT INTO follows (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [req.user.profileId, req.params.profileId]
    )
    const actor = await pool.query('SELECT name FROM profiles WHERE id = $1', [req.user.profileId])
    const followMsg = `${actor.rows[0]?.name || 'Alguém'} começou a seguir você.`
    await notify(req.params.profileId, req.user.profileId, 'follow', followMsg)
    sendPushToUser(req.params.profileId, { title: 'The Archive', body: followMsg, url: '/notifications', tag: `follow-${req.user.profileId}` }).catch(() => {})
    res.status(201).json({ ok: true })
  } catch (err) {
    console.error('POST /follows/:profileId error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.delete('/:profileId', async (req, res) => {
  try {
    await pool.query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [req.user.profileId, req.params.profileId])
    res.status(204).send()
  } catch (err) {
    console.error('DELETE /follows/:profileId error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

module.exports = router

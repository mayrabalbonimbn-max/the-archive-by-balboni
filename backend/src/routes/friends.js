const express = require('express')
const pool = require('../db')
const requireAuth = require('../middleware/auth')
const { sendPushToUser } = require('../utils/push')

async function notify(profileId, actorId, type, message) {
  if (!profileId || profileId === actorId) return
  await pool.query(
    `INSERT INTO notifications (profile_id, actor_id, type, message) VALUES ($1, $2, $3, $4)`,
    [profileId, actorId, type, message]
  )
}

const router = express.Router()
router.use(requireAuth)

function toPerson(row) {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    avatar: row.avatar,
    friendshipId: row.friendship_id || null,
    status: row.status || null,
    direction: row.direction || null,
    createdAt: row.created_at || null,
  }
}

function normalizeHandle(handle = '') {
  const clean = handle.trim()
  return clean.startsWith('@') ? clean : `@${clean}`
}

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.handle, p.avatar, f.id AS friendship_id, f.status, f.created_at
       FROM friendships f
       JOIN profiles p ON p.id = CASE WHEN f.requester_id = $1 THEN f.receiver_id ELSE f.requester_id END
       WHERE (f.requester_id = $1 OR f.receiver_id = $1) AND f.status = 'accepted'
       ORDER BY lower(p.name), lower(p.handle)`,
      [req.user.profileId]
    )
    res.json(result.rows.map(toPerson))
  } catch (err) {
    console.error('GET /friends error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.get('/requests', async (req, res) => {
  try {
    const incoming = await pool.query(
      `SELECT p.id, p.name, p.handle, p.avatar, f.id AS friendship_id, f.status, f.created_at, 'incoming' AS direction
       FROM friendships f
       JOIN profiles p ON p.id = f.requester_id
       WHERE f.receiver_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [req.user.profileId]
    )
    const outgoing = await pool.query(
      `SELECT p.id, p.name, p.handle, p.avatar, f.id AS friendship_id, f.status, f.created_at, 'outgoing' AS direction
       FROM friendships f
       JOIN profiles p ON p.id = f.receiver_id
       WHERE f.requester_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [req.user.profileId]
    )
    res.json({
      incoming: incoming.rows.map(toPerson),
      outgoing: outgoing.rows.map(toPerson),
    })
  } catch (err) {
    console.error('GET /friends/requests error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim()
    if (q.length < 2) return res.json([])
    const handle = q.startsWith('@') ? q : `%${q}%`
    const result = await pool.query(
      `SELECT p.id, p.name, p.handle, p.avatar,
        f.id AS friendship_id, f.status,
        CASE
          WHEN f.requester_id = $1 THEN 'outgoing'
          WHEN f.receiver_id = $1 THEN 'incoming'
          ELSE NULL
        END AS direction
       FROM profiles p
       LEFT JOIN friendships f
         ON (f.requester_id = $1 AND f.receiver_id = p.id)
         OR (f.receiver_id = $1 AND f.requester_id = p.id)
       WHERE p.id != $1
         AND (lower(p.handle) LIKE lower($2) OR lower(p.name) LIKE lower($3))
       ORDER BY lower(p.handle)
       LIMIT 12`,
      [req.user.profileId, q.startsWith('@') ? normalizeHandle(q) : handle, `%${q}%`]
    )
    res.json(result.rows.map(toPerson))
  } catch (err) {
    console.error('GET /friends/search error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.post('/requests', async (req, res) => {
  try {
    const { receiverId, handle } = req.body
    let receiver
    if (receiverId) {
      receiver = await pool.query('SELECT id FROM profiles WHERE id = $1 AND id != $2', [receiverId, req.user.profileId])
    } else if (handle) {
      receiver = await pool.query('SELECT id FROM profiles WHERE lower(handle) = lower($1) AND id != $2', [normalizeHandle(handle), req.user.profileId])
    } else {
      return res.status(400).json({ error: 'Informe um perfil.' })
    }
    if (receiver.rowCount === 0) return res.status(404).json({ error: 'Perfil não encontrado.' })

    const targetId = receiver.rows[0].id
    const existing = await pool.query(
      `SELECT * FROM friendships
       WHERE (requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1)`,
      [req.user.profileId, targetId]
    )

    if (existing.rowCount > 0) {
      const row = existing.rows[0]
      if (row.status === 'accepted') return res.status(409).json({ error: 'Vocês já são amigos.' })
      if (row.status === 'pending') return res.status(409).json({ error: 'Convite já enviado.' })
      const updated = await pool.query(
        `UPDATE friendships
         SET requester_id = $1, receiver_id = $2, status = 'pending', updated_at = now()
         WHERE id = $3 RETURNING *`,
        [req.user.profileId, targetId, row.id]
      )
      return res.status(201).json(updated.rows[0])
    }

    const created = await pool.query(
      `INSERT INTO friendships (requester_id, receiver_id, status)
       VALUES ($1, $2, 'pending') RETURNING *`,
      [req.user.profileId, targetId]
    )
    const actor = await pool.query('SELECT name FROM profiles WHERE id = $1', [req.user.profileId])
    const reqMsg = `${actor.rows[0]?.name || 'Alguém'} quer ser seu amigo.`
    await notify(targetId, req.user.profileId, 'friend_request', reqMsg)
    sendPushToUser(targetId, { title: 'The Archive', body: reqMsg, url: '/notifications', tag: `friend-req-${req.user.profileId}` }).catch(() => {})
    res.status(201).json(created.rows[0])
  } catch (err) {
    console.error('POST /friends/requests error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.patch('/requests/:id', async (req, res) => {
  try {
    const { action } = req.body
    if (!['accept', 'reject'].includes(action)) return res.status(400).json({ error: 'Ação inválida.' })
    const status = action === 'accept' ? 'accepted' : 'rejected'
    const result = await pool.query(
      `UPDATE friendships SET status = $1, updated_at = now()
       WHERE id = $2 AND receiver_id = $3 AND status = 'pending'
       RETURNING *`,
      [status, req.params.id, req.user.profileId]
    )
    if (result.rowCount === 0) return res.status(404).json({ error: 'Convite não encontrado.' })
    if (action === 'accept') {
      const friendship = result.rows[0]
      const actor = await pool.query('SELECT name FROM profiles WHERE id = $1', [req.user.profileId])
      const acceptMsg = `${actor.rows[0]?.name || 'Alguém'} aceitou seu pedido de amizade.`
      await notify(friendship.requester_id, req.user.profileId, 'friend_accepted', acceptMsg)
      sendPushToUser(friendship.requester_id, { title: 'The Archive', body: acceptMsg, url: '/notifications', tag: `friend-acc-${req.user.profileId}` }).catch(() => {})
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error('PATCH /friends/requests/:id error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.delete('/:profileId', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM friendships
       WHERE status = 'accepted'
         AND ((requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1))`,
      [req.user.profileId, req.params.profileId]
    )
    if (result.rowCount === 0) return res.status(404).json({ error: 'Amizade não encontrada.' })
    res.status(204).send()
  } catch (err) {
    console.error('DELETE /friends/:profileId error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

module.exports = router

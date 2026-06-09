const express = require('express')
const router = express.Router()
const pool = require('../db')
const auth = require('../middleware/auth')

router.use(auth)

// GET / — list conversations for the authenticated user
router.get('/', async (req, res) => {
  const pid = req.user.profileId
  try {
    const { rows } = await pool.query(
      `SELECT
         c.id,
         cp_other.profile_id          AS other_id,
         p.name                       AS other_name,
         p.handle                     AS other_handle,
         p.avatar                     AS other_avatar,
         (SELECT dm.content
            FROM direct_messages dm
           WHERE dm.conversation_id = c.id
           ORDER BY dm.created_at DESC LIMIT 1) AS last_content,
         (SELECT dm.created_at
            FROM direct_messages dm
           WHERE dm.conversation_id = c.id
           ORDER BY dm.created_at DESC LIMIT 1) AS last_at
       FROM conversations c
       JOIN conversation_participants cp_me
         ON cp_me.conversation_id = c.id AND cp_me.profile_id = $1
       JOIN conversation_participants cp_other
         ON cp_other.conversation_id = c.id AND cp_other.profile_id != $1
       JOIN profiles p ON p.id = cp_other.profile_id
       ORDER BY COALESCE(last_at, c.created_at) DESC`,
      [pid]
    )
    res.json(rows.map(r => ({
      id: r.id,
      participant: { id: r.other_id, name: r.other_name, handle: r.other_handle, avatar: r.other_avatar },
      lastMessage: r.last_content ? { content: r.last_content, createdAt: r.last_at } : null,
      unread: 0,
    })))
  } catch (err) {
    console.error('[conversations GET /]', err)
    res.status(500).json({ error: 'Erro ao carregar conversas' })
  }
})

// POST / — find or create a direct conversation with another user
router.post('/', async (req, res) => {
  const pid = req.user.profileId
  const { recipientId } = req.body

  if (!recipientId) return res.status(400).json({ error: 'recipientId obrigatório' })
  if (recipientId === pid) return res.status(400).json({ error: 'Não é possível criar conversa consigo mesmo' })

  try {
    const { rows: [target] } = await pool.query('SELECT id FROM profiles WHERE id = $1', [recipientId])
    if (!target) return res.status(404).json({ error: 'Usuário não encontrado' })

    // Return existing conversation between these two users
    const { rows: [existing] } = await pool.query(
      `SELECT c.id
         FROM conversations c
         JOIN conversation_participants cp1
           ON cp1.conversation_id = c.id AND cp1.profile_id = $1
         JOIN conversation_participants cp2
           ON cp2.conversation_id = c.id AND cp2.profile_id = $2`,
      [pid, recipientId]
    )
    if (existing) return res.json({ id: existing.id })

    // Create new conversation + add both participants
    const { rows: [created] } = await pool.query(
      'INSERT INTO conversations DEFAULT VALUES RETURNING id'
    )
    await pool.query(
      `INSERT INTO conversation_participants (conversation_id, profile_id)
       VALUES ($1, $2), ($1, $3)`,
      [created.id, pid, recipientId]
    )
    res.json({ id: created.id })
  } catch (err) {
    console.error('[conversations POST /]', err)
    res.status(500).json({ error: 'Erro ao iniciar conversa' })
  }
})

// GET /:id/messages — get messages in a conversation
router.get('/:id/messages', async (req, res) => {
  const pid = req.user.profileId
  const { id } = req.params
  try {
    // Verify membership
    const { rows: [conv] } = await pool.query(
      `SELECT c.id FROM conversations c
         JOIN conversation_participants cp
           ON cp.conversation_id = c.id AND cp.profile_id = $1
        WHERE c.id = $2`,
      [pid, id]
    )
    if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' })

    const { rows } = await pool.query(
      `SELECT dm.id,
              dm.content,
              dm.created_at       AS "createdAt",
              (dm.sender_id = $2) AS mine,
              p.name,
              p.handle
         FROM direct_messages dm
         JOIN profiles p ON p.id = dm.sender_id
        WHERE dm.conversation_id = $1
        ORDER BY dm.created_at ASC`,
      [id, pid]
    )
    res.json(rows.map(r => ({
      id: r.id, content: r.content, createdAt: r.createdAt,
      mine: r.mine,
      sender: { name: r.name, handle: r.handle },
    })))
  } catch (err) {
    console.error('[conversations GET /:id/messages]', err)
    res.status(500).json({ error: 'Erro ao carregar mensagens' })
  }
})

// POST /:id/messages — send a message
router.post('/:id/messages', async (req, res) => {
  const pid = req.user.profileId
  const { id } = req.params
  const { content } = req.body

  if (!content?.trim()) return res.status(400).json({ error: 'Mensagem não pode estar vazia' })

  try {
    // Verify membership
    const { rows: [conv] } = await pool.query(
      `SELECT c.id FROM conversations c
         JOIN conversation_participants cp
           ON cp.conversation_id = c.id AND cp.profile_id = $1
        WHERE c.id = $2`,
      [pid, id]
    )
    if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' })

    const { rows: [msg] } = await pool.query(
      `INSERT INTO direct_messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, content, created_at AS "createdAt"`,
      [id, pid, content.trim()]
    )
    res.json({ ...msg, mine: true })
  } catch (err) {
    console.error('[conversations POST /:id/messages]', err)
    res.status(500).json({ error: 'Erro ao enviar mensagem' })
  }
})

module.exports = router

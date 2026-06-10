const pool = require('../db')
const { sendPushToUser } = require('./push')

// Extract @handles from text, resolve profiles, and create mention notifications
async function notifyMentions(content, authorId, postId) {
  const matches = (content || '').match(/@[\w]+/gi)
  if (!matches) return

  const unique = [...new Set(matches.map(h => h.toLowerCase()))]
  const actor = await pool.query('SELECT name FROM profiles WHERE id = $1', [authorId])
  const actorName = actor.rows[0]?.name || 'Alguém'

  for (const raw of unique) {
    const normalized = raw.startsWith('@') ? raw : `@${raw}`
    try {
      const profile = await pool.query(
        'SELECT id FROM profiles WHERE lower(handle) = lower($1) AND id != $2',
        [normalized, authorId]
      )
      if (profile.rowCount === 0) continue
      const targetId = profile.rows[0].id
      const msg = `${actorName} mencionou você em uma entrada.`
      await pool.query(
        `INSERT INTO notifications (profile_id, actor_id, post_id, type, message)
         VALUES ($1, $2, $3, 'mention', $4)`,
        [targetId, authorId, postId, msg]
      )
      sendPushToUser(targetId, {
        title: 'The Archive',
        body: msg,
        url: `/posts/${postId}`,
        tag: `mention-${postId}-${authorId}`,
      }).catch(() => {})
    } catch {}
  }
}

module.exports = { notifyMentions }

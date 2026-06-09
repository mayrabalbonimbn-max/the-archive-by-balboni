const express = require('express')
const path = require('path')
const pool = require('../db')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

function isStoredFile(value) {
  return typeof value === 'string' && path.basename(value) === value && /^[a-f0-9-]{36}\.(?:jpe?g|png|webp)$/i.test(value)
}

// GET /api/users/suggested — active public profiles for Explore
router.get('/suggested', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.handle, p.avatar, p.bio, p.is_system,
              COUNT(DISTINCT po.id)::int AS post_count,
              MAX(po.created_at) AS last_post_at,
              EXISTS (
                SELECT 1 FROM follows fl
                WHERE fl.follower_id = $1 AND fl.following_id = p.id
              ) AS is_following
       FROM profiles p
       LEFT JOIN posts po ON po.profile_id = p.id AND po.visibility = 'public'
       WHERE p.id != $1
         AND p.is_system = false
       GROUP BY p.id
       HAVING COUNT(DISTINCT po.id) > 0
       ORDER BY MAX(po.created_at) DESC NULLS LAST
       LIMIT 12`,
      [req.user.profileId]
    )
    res.json(result.rows.map(row => ({
      id: row.id,
      name: row.name,
      handle: row.handle,
      bio: row.bio || '',
      hasAvatar: Boolean(row.avatar) && isStoredFile(row.avatar),
      isFollowing: row.is_following === true,
      verified: row.is_system || false,
      postCount: row.post_count,
    })))
  } catch (err) {
    console.error('GET /users/suggested error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

module.exports = router

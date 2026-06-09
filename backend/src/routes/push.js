const express = require('express')
const pool = require('../db')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

router.get('/vapid-public-key', (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY
  if (!key) return res.status(503).json({ error: 'Push notifications não configuradas no servidor.' })
  res.json({ publicKey: key })
})

router.post('/subscribe', async (req, res) => {
  const { subscription } = req.body
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return res.status(400).json({ error: 'Dados de subscription incompletos.' })
  }
  try {
    await pool.query(
      `INSERT INTO push_subscriptions (profile_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (profile_id, endpoint) DO UPDATE
         SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, updated_at = now()`,
      [req.user.profileId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error('push subscribe error:', err)
    res.status(500).json({ error: 'Erro ao salvar subscription.' })
  }
})

router.delete('/subscribe', async (req, res) => {
  const { endpoint } = req.body || {}
  try {
    if (endpoint) {
      await pool.query(
        'DELETE FROM push_subscriptions WHERE profile_id = $1 AND endpoint = $2',
        [req.user.profileId, endpoint]
      )
    } else {
      await pool.query('DELETE FROM push_subscriptions WHERE profile_id = $1', [req.user.profileId])
    }
    res.json({ ok: true })
  } catch (err) {
    console.error('push unsubscribe error:', err)
    res.status(500).json({ error: 'Erro ao remover subscription.' })
  }
})

module.exports = router

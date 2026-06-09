const webpush = require('web-push')
const pool = require('../db')

let vapidConfigured = false

function initVapid() {
  if (vapidConfigured) return
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'
  if (pub && priv) {
    webpush.setVapidDetails(subject, pub, priv)
    vapidConfigured = true
  } else {
    console.warn('[push] VAPID not configured — VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY missing')
  }
}

// Returns { sent, failed, total } or { skipped, reason } for diagnostics.
async function sendPushToUser(profileId, payload) {
  initVapid()
  if (!vapidConfigured) {
    return { skipped: true, reason: 'vapid_not_configured' }
  }

  let subs
  try {
    const result = await pool.query(
      'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE profile_id = $1',
      [profileId]
    )
    subs = result.rows
  } catch (err) {
    console.error('[push] DB error fetching subscriptions for profile', profileId, err)
    return { skipped: true, reason: 'db_error' }
  }

  if (subs.length === 0) {
    return { sent: 0, failed: 0, total: 0 }
  }

  const results = await Promise.allSettled(subs.map(async sub => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
      console.log('[push] sent ok — sub', sub.id, 'profile', profileId)
      return { ok: true }
    } catch (err) {
      console.error('[push] send failed — sub', sub.id, 'status', err.statusCode, err.message)
      if (err.statusCode === 410 || err.statusCode === 404) {
        await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]).catch(() => {})
        console.log('[push] removed expired subscription', sub.id)
      }
      return { ok: false, statusCode: err.statusCode, message: err.message }
    }
  }))

  const sent = results.filter(r => r.status === 'fulfilled' && r.value?.ok).length
  const failed = results.length - sent
  console.log(`[push] profile ${profileId} — ${sent}/${results.length} sent`)
  return { sent, failed, total: results.length }
}

module.exports = { sendPushToUser }

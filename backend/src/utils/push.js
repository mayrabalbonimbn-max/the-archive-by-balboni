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
  }
}

async function sendPushToUser(profileId, payload) {
  initVapid()
  if (!vapidConfigured) return

  let subs
  try {
    const result = await pool.query(
      'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE profile_id = $1',
      [profileId]
    )
    subs = result.rows
  } catch {
    return
  }

  await Promise.allSettled(subs.map(async sub => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]).catch(() => {})
      }
    }
  }))
}

module.exports = { sendPushToUser }

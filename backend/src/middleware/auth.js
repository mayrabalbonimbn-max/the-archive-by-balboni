const jwt = require('jsonwebtoken')

module.exports = function requireAuth(req, res, next) {
  // Accept token from Authorization header OR ?token= query param (for <video>/<audio> src)
  let token
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    token = header.slice(7)
  } else if (req.query.token) {
    token = req.query.token
  }

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

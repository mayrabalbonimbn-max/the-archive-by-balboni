const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_, res) => res.json({ ok: true }))

app.use('/api/auth', require('./routes/auth'))
app.use('/api/me', require('./routes/me'))
app.use('/api/me', require('./routes/export'))
app.use('/api/posts', require('./routes/posts'))
app.use('/api/profiles', require('./routes/profiles'))
app.use('/api/collections', require('./routes/collections'))
app.use('/api/library', require('./routes/library'))
app.use('/api/archive', require('./routes/archive'))
app.use('/api/friends', require('./routes/friends'))
app.use('/api/follows', require('./routes/follows'))
app.use('/api', require('./routes/comments'))
app.use('/api/notifications', require('./routes/notifications'))
app.use('/api/push', require('./routes/push'))
app.use('/api/search', require('./routes/search'))
app.use('/api/users', require('./routes/users'))
app.use('/api/tags', require('./routes/tags'))
app.use('/api/link-preview', require('./routes/link-preview'))
app.use('/api', require('./routes/attachments'))
app.use('/api/stories', require('./routes/stories'))
app.use('/api/capsules', require('./routes/capsules'))
app.use('/api/projects', require('./routes/projects'))
app.use('/api/conversations', require('./routes/conversations'))

module.exports = app

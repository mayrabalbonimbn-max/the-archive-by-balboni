require('dotenv').config()
const app = require('./app')
const pool = require('./db')

const PORT = process.env.PORT || 3001

for (const name of ['DATABASE_URL', 'JWT_SECRET']) {
  if (!process.env[name]) {
    console.error(`✗ Missing required environment variable: ${name}`)
    process.exit(1)
  }
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('✗ JWT_SECRET must contain at least 32 characters')
  process.exit(1)
}

pool.initialize()
  .then(() => pool.migrateLegacyImages())
  .then(() => pool.migrateLegacyProfileImages())
  .then(() => {
    console.log('✓ PostgreSQL connected')
    app.listen(PORT, () => console.log(`✓ API running on port ${PORT}`))
  })
  .catch(err => {
    console.error('✗ Database connection failed:', err.message)
    process.exit(1)
  })

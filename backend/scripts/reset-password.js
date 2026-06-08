const bcrypt = require('bcryptjs')
const readline = require('readline/promises')
const pool = require('../src/db')

function normalizeHandle(handle) {
  const value = handle.trim()
  return value.startsWith('@') ? value : '@' + value
}

async function main() {
  const [, , handleArg] = process.argv

  if (!handleArg) {
    throw new Error('Uso: npm run reset-password -- @handle')
  }

  const input = readline.createInterface({ input: process.stdin, output: process.stdout })
  const password = await input.question('Nova senha: ')
  const confirmation = await input.question('Confirme a nova senha: ')
  input.close()

  if (password.length < 6) {
    throw new Error('A nova senha deve ter ao menos 6 caracteres.')
  }
  if (password !== confirmation) {
    throw new Error('As senhas não coincidem.')
  }

  const handle = normalizeHandle(handleArg)
  const passwordHash = await bcrypt.hash(password, 12)
  const result = await pool.query(
    `UPDATE profiles
     SET password_hash = $1
     WHERE lower(handle) = lower($2)
     RETURNING handle`,
    [passwordHash, handle]
  )

  if (result.rowCount === 0) {
    throw new Error(`Perfil ${handle} não encontrado.`)
  }

  console.log(`Senha de ${result.rows[0].handle} redefinida com sucesso.`)
}

main()
  .catch(err => {
    console.error(err.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())

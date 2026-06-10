#!/usr/bin/env node
/**
 * Gerencia códigos de convite para o The Archive.
 *
 * Uso:
 *   ADMIN_SECRET=<secret> node scripts/manage-invites.js create [--uses=N] [--days=N] [--note="texto"]
 *   ADMIN_SECRET=<secret> node scripts/manage-invites.js list
 *   ADMIN_SECRET=<secret> node scripts/manage-invites.js revoke <code>
 *
 * Exemplos:
 *   ADMIN_SECRET=xxx node scripts/manage-invites.js create
 *   ADMIN_SECRET=xxx node scripts/manage-invites.js create --uses=3 --days=30 --note="Para amiga X"
 *   ADMIN_SECRET=xxx node scripts/manage-invites.js list
 *   ADMIN_SECRET=xxx node scripts/manage-invites.js revoke a1b2c3d4e5f6a7b8
 */

const BASE = process.env.API || 'http://localhost:4016/api'
const SECRET = process.env.ADMIN_SECRET

if (!SECRET) {
  console.error('Falta ADMIN_SECRET. Exemplo: ADMIN_SECRET=xxx node scripts/manage-invites.js ...')
  process.exit(1)
}

const headers = {
  'Content-Type': 'application/json',
  'X-Admin-Secret': SECRET,
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}/auth${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`${res.status}: ${json.error || JSON.stringify(json)}`)
  }
  return json
}

function parseArgs(argv) {
  const args = {}
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [key, val] = arg.slice(2).split('=')
      args[key] = val ?? true
    }
  }
  return args
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

async function cmdCreate(argv) {
  const args = parseArgs(argv)
  const body = {
    maxUses: args.uses ? Number(args.uses) : 1,
    expiresDays: args.days ? Number(args.days) : undefined,
    note: typeof args.note === 'string' ? args.note : undefined,
  }
  const invite = await req('POST', '/admin/invites', body)
  console.log('\n✓ Código criado:\n')
  console.log(`  Código:    ${invite.code}`)
  console.log(`  Usos:      ${invite.usedCount}/${invite.maxUses}`)
  console.log(`  Expira em: ${fmtDate(invite.expiresAt)}`)
  console.log(`  Nota:      ${invite.note || '—'}`)
  console.log()
}

async function cmdList() {
  const invites = await req('GET', '/admin/invites')
  if (!invites.length) {
    console.log('\nNenhum código cadastrado.\n')
    return
  }
  console.log(`\n${invites.length} código(s):\n`)
  const COL = 18
  console.log(`${'CÓDIGO'.padEnd(COL)} ${'USOS'.padEnd(8)} ${'VÁLIDO'.padEnd(8)} ${'EXPIRA'.padEnd(18)} NOTA`)
  console.log('─'.repeat(72))
  for (const inv of invites) {
    const status = inv.revokedAt ? 'revogado' : inv.valid ? 'sim' : 'não'
    console.log(
      `${inv.code.padEnd(COL)} ${`${inv.usedCount}/${inv.maxUses}`.padEnd(8)} ${status.padEnd(8)} ${fmtDate(inv.expiresAt).padEnd(18)} ${inv.note || ''}`
    )
  }
  console.log()
}

async function cmdRevoke(code) {
  if (!code) { console.error('Informe o código. Ex: revoke a1b2c3d4e5f6a7b8'); process.exit(1) }
  await req('DELETE', `/admin/invites/${code}`)
  console.log(`\n✓ Código ${code} revogado.\n`)
}

async function main() {
  const [,, cmd, ...rest] = process.argv
  if (!cmd || cmd === 'help') {
    console.log('\nUso: [create | list | revoke <code>]\n')
    process.exit(0)
  }
  if (cmd === 'create') await cmdCreate(rest)
  else if (cmd === 'list') await cmdList()
  else if (cmd === 'revoke') await cmdRevoke(rest[0])
  else { console.error(`Comando desconhecido: ${cmd}`); process.exit(1) }
}

main().catch(err => { console.error('Erro:', err.message); process.exit(1) })

export function exportPostsAsMarkdown(posts) {
  const lines = ['# The Archive by Balboni - Backup\n']
  const sorted = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  for (const post of sorted) {
    const date = new Date(post.createdAt).toLocaleString('pt-BR')
    lines.push(`## ${date} - ${post.type}`, '', post.content, '')
    if (post.attachments?.length) {
      lines.push('Anexos:', ...post.attachments.map(item => `- ${item.originalName}`), '')
    }
    lines.push('---', '')
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `the-archive-backup-${new Date().toISOString().split('T')[0]}.md`
  link.click()
  URL.revokeObjectURL(url)
}

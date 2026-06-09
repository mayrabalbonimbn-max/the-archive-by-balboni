# The Archive by Balboni

> Um arquivo pessoal, silencioso, editorial e permanente.

**Status:** MVP funcional em desenvolvimento ativo  
**Produção:** https://social.balbonilab.com

The Archive é um espaço para guardar aquilo que importa: pensamentos, projetos, memórias, fotografias, arquivos, código e reflexões.

Ele combina diário digital, biblioteca pessoal, portfólio vivo e documentação de trajetória — sem algoritmo, sem disputa por atenção e sem a lógica de feed infinito das redes sociais tradicionais.

---

## O que é o Archive

O Archive não é uma rede social tradicional.

É um espaço para registrar ideias, acompanhar projetos, organizar conhecimento, preservar memórias e documentar a própria evolução ao longo do tempo.

Você pode usá-lo como:

- Diário digital
- Biblioteca pessoal
- Portfólio vivo
- Arquivo fotográfico
- Base de conhecimento
- Documentação de projetos
- Espaço de reflexão

Com o tempo, todos esses registros formam uma narrativa construída automaticamente a partir daquilo que você cria.

---

## Principais recursos

- Publicação de notas, ensaios, fotos, documentos, código e arquivos
- Projetos com timeline, status, marcos e aprendizados
- Cápsulas do tempo
- Memórias e calendário
- Stories arquiváveis
- Comentários, respostas e menções
- Reações temáticas
- Sandbox para Python, JavaScript e HTML
- Dashboard de evolução
- Mapa de conexões (Graph)
- Conquistas
- História automática do usuário
- Base de conhecimento
- PWA mobile-first

---

# Stack

| Camada | Tecnologia |
|----------|----------|
| Frontend | React 18 |
| Build Tool | Vite |
| UI | Tailwind CSS v3 |
| Roteamento | React Router v6 |
| PWA | vite-plugin-pwa |
| Backend | Node.js + Express |
| Banco de Dados | PostgreSQL |
| Process Manager | PM2 |
| Servidor | VPS Linux + Nginx |

---

# Filosofia

O Archive foi construído para ser um lugar de registro, não de competição.

Não existe algoritmo de descoberta baseado em engajamento.

Não existe feed infinito otimizado para retenção.

Não existe pressão para produzir conteúdo constantemente.

O objetivo é simples:

> Guardar aquilo que importa.

Uma ideia.

Uma fotografia.

Um projeto.

Uma memória.

Um aprendizado.

---

# Identidade Visual

### Superfície

Preto puro:

```css
#000000
```

Separação por hairlines:

```css
rgba(255,255,255,0.08)
```

### Cor de destaque

```css
#E86CB4
```

Utilizada em:

- Links
- CTAs
- Estados ativos
- Indicadores
- Contadores

### Tipografia

| Fonte | Uso |
|---------|---------|
| Newsreader | Títulos e leitura |
| Hanken Grotesk | Interface |
| JetBrains Mono | Código e datas |

### Paleta de texto

```css
#F2EDE6
#ABA49A
#6C665E
```

---

# Layout

## Mobile

- AppBar fixa
- Safe Area iOS
- Bottom Navigation
- Compose em fullscreen
- Navegação otimizada para PWA

### Bottom Navigation

- Hoje
- Arquivo
- Criar
- Explorar
- Você

---

## Desktop

Sidebar esquerda dividida em três grupos.

### Principal

- Hoje
- Explorar
- Pessoas
- Avisos
- Mensagens
- Cápsulas

### Seu Arquivo

- Visão Geral
- Memórias
- Calendário
- Coleções
- Arquivos
- Fotografia
- Stories

### Sua Trajetória

- Projetos
- Dashboard
- Mapa de Conexões
- Minha História
- Conquistas
- Trajetória
- Conhecimento
- Mapa da Vida
- Retrospectiva

---

# Rotas

## Arquivo

| Rota | Descrição |
|----------|----------|
| / | Hoje |
| /archive | Hub principal |
| /archive?s=memories | Memórias |
| /archive?s=calendar | Calendário |
| /archive?s=collections | Coleções |
| /library | Arquivos |
| /photos | Fotografias |
| /archive/stories | Stories arquivados |
| /capsules | Cápsulas |

---

## Trajetória

| Rota | Descrição |
|----------|----------|
| /projects | Projetos |
| /projects/:slug | Projeto individual |
| /dashboard | Dashboard |
| /graph | Mapa de Conexões |
| /story | Minha História |
| /achievements | Conquistas |
| /growth | Trajetória |
| /knowledge | Base de Conhecimento |
| /life-map | Mapa da Vida |
| /year-review/:year | Retrospectiva anual |

---

## Social

| Rota | Descrição |
|----------|----------|
| /explore | Explorar |
| /profile | Perfil |
| /profiles/:id | Perfil público |
| /friends | Pessoas |
| /notifications | Avisos |
| /messages | Mensagens |
| /messages/:id | Conversa |
| /settings | Ajustes |

---

# Registros

O Archive suporta diferentes tipos de entrada.

### Nota

Texto rápido.

### Ensaio

Texto longo com editor rico.

### Foto

Imagem com suporte a metadados EXIF.

### Documento

PDF.

### Código

Editor com sandbox.

### Arquivo

Markdown, scripts e documentos técnicos.

### Link

Preview automático.

---

# Privacidade

Cada registro pode ser:

- Privado
- Círculo
- Público

---

# Projetos

Projetos agrupam registros relacionados.

Cada projeto possui:

- Emoji
- Nome
- Descrição
- Status
- Tags
- GitHub
- Website
- Datas
- Cover

### Status

- Ideia
- Ativo
- Pausado
- Concluído
- Arquivado

### Estrutura interna

#### Marcos

Milestones com data.

#### Aprendizados

Notas permanentes sobre o projeto.

---

# Stories

Stories rápidos para compartilhamento cotidiano.

Suportam:

- Texto
- Foto

Após expirarem:

- Saem da área pública
- Permanecem no arquivo pessoal

---

# Cápsulas do Tempo

Mensagens seladas para o futuro.

Podem ser abertas:

- Em uma data específica
- Em alguns meses
- Em alguns anos

Enquanto fechadas:

- Não aparecem no feed
- Não aparecem no perfil
- Não podem ser acessadas

---

# Fotografias

Galeria visual organizada.

Suporte para:

- Thumbnail automática
- Versão otimizada
- EXIF

Metadados:

- Câmera
- Lente
- ISO
- Abertura
- Velocidade
- Data original

---

# Código e Sandbox

O Archive permite armazenar e executar código diretamente no navegador.

### Python

Executado via Pyodide.

### JavaScript

Executado em Web Worker isolado.

### HTML

Executado em iframe sandbox.

---

# Sistema Social

## Comentários

Comentários encadeados.

## Respostas

Respostas em comentários.

## Menções

```text
@usuario
```

## Reações

- ❤️ Gostei
- ✨ Inspirador
- 📚 Aprendizado
- 💻 Código
- 📷 Fotografia

## Amizades

Relacionamento bidirecional.

## Seguidores

Relacionamento unidirecional.

---

# Memórias

O sistema relembra registros antigos automaticamente.

### Neste Dia

Mostra registros da mesma data em anos anteriores.

### Reflexões

Cada memória pode gerar uma nova reflexão conectada ao registro original.

---

# Dashboard

Visualização da atividade do usuário.

Inclui:

- Quantidade de registros
- Evolução temporal
- Distribuição por tipo
- Atividade recente

---

# Conquistas

Marcos importantes da jornada.

Exemplos:

- Primeira Entrada
- Primeira Foto
- Primeira Cápsula
- Primeira Reflexão
- 100 Registros

---

# Minha História

Narrativa automática construída a partir dos registros do usuário.

Transforma:

- projetos
- memórias
- reflexões
- cápsulas
- marcos

em uma linha narrativa contínua.

---

# Desenvolvimento Local

## Frontend

```bash
npm install
npm run dev
```

Servidor:

```text
http://localhost:5173
```

---

## Backend

```bash
cd backend

npm install

npm run dev
```

Servidor:

```text
http://localhost:3001
```

---

# Variáveis de Ambiente

Copie:

```bash
.env.example
```

para:

```bash
.env
```

e configure:

- DATABASE_URL
- JWT_SECRET
- demais credenciais necessárias

---

# Deploy

Fluxo atual:

1. Commit
2. Push
3. Pull no servidor
4. Build
5. Restart via PM2

---

# Segurança

Nunca versionar:

```text
.env
backend/.env
backend/storage/uploads/
dist/
node_modules/
```

---

## Licença

Projeto pessoal de pesquisa e desenvolvimento.

---

> The Archive by Balboni  
> Guardado, não transmitido.
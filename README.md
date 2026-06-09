# The Archive by Balboni

> Um arquivo pessoal. Silencioso, editorial, permanente.

**Produção:** [social.balbonilab.com](https://social.balbonilab.com) &nbsp;·&nbsp; PWA · Mobile-first · Dark theme

---

## O que é isso

O Archive é uma aplicação web full-stack construída do zero para ser um espaço pessoal de registro, documentação e memória. Não é um blog, não é uma rede social, não é um Notion. É um arquivo — no sentido literal da palavra: um lugar onde as coisas não somem.

Cada entrada tem privacidade individual. Cada projeto tem uma linha do tempo de marcos e aprendizados. Cada fotografia preserva os dados de câmera. O código roda dentro da interface. As cápsulas do tempo ficam seladas até a data que você escolheu.

---

## O problema

A maioria dos aplicativos de anotação trata o conteúdo como descartável — feeds cronológicos, sem estrutura, sem conexão entre registros. As ferramentas mais completas (Notion, Obsidian, Roam) resolvem organização, mas não resolvem presença: não têm o prazer de publicar, o peso de uma fotografia real, a satisfação de ver um projeto evoluir com o tempo.

O Archive tenta resolver os dois lados: a profundidade de um arquivo pessoal e a leveza de uma interface que você quer abrir todo dia.

---

## Status

| Área | Estado |
|---|---|
| Posts, artigos, código, fotos | ✅ Produção |
| Projetos com marcos e aprendizados | ✅ Produção |
| Cápsulas do tempo | ✅ Produção |
| Busca full-text (PostgreSQL FTS) | ✅ Produção |
| Archive hub: memórias, calendário, stats | ✅ Produção |
| Dashboard e grafo de conexões | ✅ Produção |
| Reações, comentários, notificações | ✅ Produção |
| Mensagens diretas | ✅ MVP funcional |
| Stories arquiváveis | ✅ MVP funcional |
| Trajetória: conquistas, crescimento, mapa da vida | ✅ MVP funcional |
| Testes de integração | ✅ Produção |

---

## Principais recursos

**Registros**
Cada entrada pode ser uma nota livre, um ensaio em Markdown, uma fotografia (com EXIF completo de câmera, lente e localização), um arquivo PDF/documento, um snippet de código com sandbox interativo (Python, JavaScript, HTML/CSS), ou um link com preview automático gerado pelo backend.

Toda entrada tem privacidade individual: privado, seguidores, amigos ou público. Entradas privadas nunca aparecem para ninguém além do autor, independentemente de qual tela ou rota.

**Categorias semânticas**
O sistema detecta automaticamente a natureza de cada entrada conforme o usuário digita — pensamento, reflexão, ideia, aprendizado, decisão, observação, memória, citação ou meta. A detecção usa heurísticas locais por padrão; o autor pode corrigir manualmente via chip antes de salvar.

**Projetos**
Cada projeto tem título, slug, status (`ideia` → `ativo` → `concluído`), tags, links externos (GitHub, site), cover, cores e datas. Dentro de cada projeto: um feed de registros vinculados, marcos com data, e aprendizados textuais. O projeto funciona como portfólio e diário de desenvolvimento ao mesmo tempo.

**Cápsulas do tempo**
Entradas seladas até uma data futura. Ficam invisíveis no feed principal e inacessíveis via rota direta enquanto o prazo não vence. Só aparecem na tela `/capsules` para o próprio autor.

**Arquivo pessoal**
Hub central com: "neste dia em outros anos" (memórias), calendário de atividade, estatísticas de volume por tipo, coleções temáticas, biblioteca de arquivos, galeria fotográfica ordenada por câmera e data, stories arquiváveis.

**Trajetória**
Dashboard de atividade com heatmap e métricas. Grafo de conexões entre registros via `[[links internos]]` e `#tags` — renderizado como grafo force-directed sem D3, feito com Canvas nativo. Conquistas desbloqueáveis, timeline de crescimento, história narrativa automática, base de conhecimento, mapa da vida, retrospectiva anual.

**Social**
Comentários encadeados com respostas. Reações temáticas (heart, spark, save, inspirador, aprendizado, código, fotografia). Reações primárias são mutuamente exclusivas por usuário por post. Seguir e amizade bidirecional. Mensagens diretas. Notificações em tempo real via push web.

**Busca**
CMD+K abre busca global. Backend usa `to_tsvector` + `websearch_to_tsquery` em PostgreSQL com ranking por `ts_rank` e excerpts contextuais via `ts_headline`. GIN indexes em posts, arquivos e coleções. Suporte a buscas com `"frases exatas"` e operadores naturais.

---

## Fluxo de uso

```
Abrir o Archive
  → Hoje: feed pessoal, post fixado, compose box
  → Escrever uma entrada (texto, foto, código, arquivo, link)
  → Categorizar e definir privacidade antes de publicar
  → A entrada entra no feed e no Archive hub

Ao longo do tempo
  → Vincular entradas a um projeto em andamento
  → Criar uma cápsula para o futuro
  → Ver o grafo crescer conforme os links se formam
  → "Neste dia em 2023" aparece como memória no Archive hub

CMD+K a qualquer momento
  → Buscar por conteúdo, arquivo, tag, coleção ou usuário
  → Resultados rankeados por relevância com excerpt do trecho correspondente
```

---

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite 5 + Tailwind CSS v3 |
| Roteamento | React Router v6 |
| PWA | vite-plugin-pwa (manifest + service worker) |
| Bundle | React.lazy + Suspense — code splitting por página |
| Backend | Node.js + Express |
| Banco | PostgreSQL (pool nativo via `pg`) |
| Auth | JWT (30 dias) + bcryptjs |
| Upload | Multer + Sharp (thumbnails + otimização WebP) |
| Push | Web Push API (VAPID) |
| Processo | PM2 + Nginx |

O banco não usa nenhum ORM. Todas as queries são SQL direto com `pg`. O schema é aplicado automaticamente via `pool.initialize()` no startup — `ALTER TABLE ... IF NOT EXISTS` garante retrocompatibilidade entre deploys.

---

## Arquitetura

```
src/
  App.jsx              # Roteamento, estado global (profile, posts), lazy loading
  components/
    ComposeBox.jsx     # Compose de post: texto, código, arquivo, link preview
    PostCard.jsx       # Card de post no feed
    GlobalSearch.jsx   # CMD+K — busca full-text
    Sidebar.jsx        # Desktop: nav principal + SEU ARQUIVO + SUA TRAJETÓRIA
    StoriesBar.jsx     # Stories horizontais no topo do feed
    CommentsBox.jsx    # Comentários + respostas encadeadas
    CodeSandbox.jsx    # Sandbox interativo (Python via Pyodide, JS via eval, HTML via iframe)
  pages/              # 35+ páginas, todas com React.lazy exceto as carregadas no primeiro render
  hooks/              # useProfile, useStories, useAvatarUrl
  utils/
    api.js            # Wrapper fetch com auth header
    helpers.js        # CATEGORIA_CONFIG, TYPE_CONFIG, formatDate

backend/src/
  app.js              # Express app (sem server.js — separação para testes)
  db/
    index.js          # Pool pg + initialize() + migrações de schema
    schema.sql        # Schema completo + ALTERs retrocompatíveis
  routes/             # 19 arquivos de rota (auth, posts, archive, projects, ...)
  middleware/auth.js  # Middleware JWT
  utils/social.js     # visibleSql(), reactionCountsSql(), REACTIONS set
  __tests__/
    integration.test.js  # 26 testes de integração (node:test + supertest)
```

**Separação de responsabilidades no backend:**
- `app.js` exporta o Express app sem iniciar o servidor — permite `require('../app')` nos testes sem abrir porta
- `server.js` faz o `app.listen` — único ponto de entrada em produção
- O pool usa `DATABASE_URL` do `.env`; testes usam `.env.test` se existir

---

## Funcionalidades por área

### Posts (`/api/posts`)
- CRUD completo com visibilidade por entrada (`private`, `followers`, `friends`, `public`)
- Tags via `#hashtag` extraídas do conteúdo (post_tags + tags tables)
- Links internos `[[título]]` (backlinks, usados no grafo)
- Código com linguagem e sandbox associado
- Artigos com título separado (renderização em rota `/articles/:id`)
- Preview de link automático via scraping no backend
- Pinagem de post no topo do feed
- Reações via `PATCH /api/posts/:id` com `action: 'react'`

### Projetos (`/api/projects`)
- CRUD por slug
- Milestones com data e status
- Learnings textuais
- Feed de posts vinculados ao projeto por `projectId`

### Archive (`/api/archive`)
- `/memories` — "neste dia em anos anteriores"
- `/streak` — sequência de dias com registro
- `/calendar` e `/calendar/:year/:month` — mapa de atividade
- `/stats` — contagens por tipo
- `/search` — busca full-text com FTS PostgreSQL
- `/tags` — tags mais usadas
- `/backlinks/:title` — posts que apontam para um link interno
- `/graph` — nós e arestas extraídos de tags e backlinks
- `/dashboard` — métricas agregadas para o dashboard
- `/year-review/:year` — retrospectiva anual

### Social
- Comentários e respostas: `/api/posts/:id/comments`, `/api/comments/:id/replies`
- Reações: PATCH com action `react`, `like`, `save`
- Follows e amizades: `/api/follows`, `/api/friends`
- Mensagens: `/api/messages` (MVP)
- Notificações: `/api/notifications` + Web Push

---

## Rotas do frontend

| Arquivo / Feed | Trajetória |
|---|---|
| `/` — Hoje (feed principal) | `/projects` — Projetos |
| `/archive` — Hub do arquivo | `/projects/:slug` — Detalhe do projeto |
| `/photos` — Galeria fotográfica | `/dashboard` — Dashboard |
| `/library` — Arquivos e documentos | `/graph` — Grafo de conexões |
| `/capsules` — Cápsulas do tempo | `/story` — Minha história |
| `/diary` — Entradas de diário | `/achievements` — Conquistas |
| `/saved` — Posts salvos | `/growth` — Linha do tempo |
| `/collections` — Coleções | `/knowledge` — Base de conhecimento |
| `/memories` — Memórias | `/life-map` — Mapa da vida |
| `/calendar` — Calendário | `/year-review/:year` — Retrospectiva |
| `/archive/stories` — Stories | |
| `/explore` — Feed público | `/messages` — Mensagens diretas |
| `/tags/:tag` — Posts por tag | `/notifications` — Notificações |
| `/backlinks/:title` — Links internos | `/friends` — Amigos e pedidos |

---

## Design system

O Archive tem tema escuro por padrão, sem alternância de tema — a identidade visual depende do preto como base.

**Paleta (CSS variables)**

| Variável | Valor | Uso |
|---|---|---|
| `--bg` | `#000000` | Fundo geral |
| `--surface-2` | `#0D0D0D` | Cards |
| `--surface-3` | `#141414` | Inputs, hovers |
| `--line` | `rgba(255,255,255,0.07)` | Separadores |
| `--line-strong` | `rgba(255,255,255,0.14)` | Bordas de componente |
| `--ink` | `#F2EDE6` | Texto principal |
| `--ink-2` | `#ABA49A` | Texto secundário |
| `--ink-3` | `#6C665E` | Texto terciário, labels |
| `--accent` | `#E86CB4` | Rosa — CTAs, ativos, links |

**Tipografia**

| Variável | Fonte | Uso |
|---|---|---|
| `--serif` | Newsreader | Títulos, artigos, manifesto |
| `--sans` | Hanken Grotesk | UI geral, corpo de texto |
| `--mono` | JetBrains Mono | Datas, código, labels técnicas |

**Componentes**
- `pill-badge` — badge de categoria/tipo com cor semântica
- `Avatar` — iniciais com fallback para imagem
- `Icon` — SVG stroke padronizado (sem biblioteca de ícones)
- `PostCard` — card de feed com suporte a todos os tipos de entrada
- `EntryCard` — card compacto para listas de archive

---

## Desenvolvimento local

**Pré-requisitos:** Node.js 18+, PostgreSQL 14+

```bash
# 1. Clone e instale dependências
git clone <repo>
cd the-archive
npm install
cd backend && npm install && cd ..

# 2. Configure as variáveis de ambiente
cp .env.example .env                    # frontend (VITE_API_URL)
cp backend/.env.example backend/.env    # backend (DATABASE_URL, JWT_SECRET)

# 3. Inicie o banco e o schema
# O schema é aplicado automaticamente no primeiro start do backend

# 4. Suba os servidores
npm run dev          # Frontend → http://localhost:5173
cd backend && npm run dev  # Backend → http://localhost:3001
```

**Variáveis do backend (`.env`)**

```
DATABASE_URL=postgres://localhost:5432/archive
JWT_SECRET=<string longa e aleatória>
JWT_EXPIRES_IN=30d
UPLOAD_DIR=./storage/uploads
FRONTEND_URL=http://localhost:5173
```

---

## Testes

Testes de integração via `node:test` + `supertest`. Cobrem os fluxos principais: auth, posts, categorias, reações, comentários, cápsulas e projetos — 26 casos no total.

```bash
# 1. Crie um banco de teste (uma única vez)
createdb archive_test

# 2. Configure
cp backend/.env.test.example backend/.env.test
# Edite backend/.env.test com DATABASE_URL do banco de teste

# 3. Execute
cd backend && npm test
```

Os testes criam usuários com handle `@_test_<run_id>_*` e fazem cleanup via CASCADE ao final. Se o banco não estiver acessível, os testes são ignorados com aviso — sem falha no CI.

---

## Deploy

O deploy é feito em um VPS Linux com Nginx como proxy reverso e PM2 gerenciando o processo Node.

```bash
# No servidor
cd /caminho/do/projeto
git pull origin main
npm install --prefix backend
pm2 restart the-archive
```

O Nginx serve o frontend buildado (`dist/`) como arquivos estáticos e faz proxy do `/api` para o processo Node na porta 3001. O schema do banco é re-aplicado a cada restart do PM2 (as migrações são idempotentes via `IF NOT EXISTS`).

---

## Segurança

- JWT com expiração configurável (padrão 30 dias)
- Senhas com bcryptjs (salt 12)
- Visibilidade de post validada no backend em todas as queries — a privacidade não depende do frontend
- Cápsulas seladas: acessível por ID direto retorna 403 com `capsule_locked` até o prazo
- Rate limiting em rotas de reset de senha (5 tentativas por 15 min)
- Uploads: Multer com validação de mime type + Sharp reprocessa imagens antes de salvar
- Nunca versionar: `.env`, `backend/.env`, `backend/.env.test`, `backend/storage/uploads/`, `dist/`, `node_modules/`

---

## Roadmap

O Archive é um projeto pessoal em desenvolvimento ativo. O que vem a seguir:

- **Editor rico para artigos** — blocos, embeds, imagens inline (hoje é Markdown puro)
- **Exportação** — PDF de artigos, ZIP do arquivo pessoal
- **Busca por data e filtros avançados** — além do full-text atual
- **Recurring review** — revisitar entradas antigas de forma estruturada
- **Versão pública estática** — perfil público com os posts marcados como públicos, sem auth

---

*Construído por Mayra Balboni. Guardado, não transmitido.*

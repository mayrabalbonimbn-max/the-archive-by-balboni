# The Archive by Balboni

> Um arquivo pessoal. Silencioso, editorial, permanente.

O Archive é um espaço para guardar aquilo que importa — pensamentos, projetos, memórias, fotografias, arquivos, código, reflexões — e acompanhar sua evolução ao longo do tempo. Não existe algoritmo, não existe disputa por atenção. Apenas você e aquilo que você constrói.

**Produção:** https://social.balbonilab.com

---

## O que é o Archive

O Archive não é uma rede social. É um diário criativo com camadas: você registra, organiza em projetos, revisita memórias, escreve para o futuro e acompanha quem você está se tornando.

Com o tempo, todos esses registros formam uma narrativa — gerada automaticamente a partir do que você cria.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS v3 |
| Roteamento | React Router v6 |
| PWA | vite-plugin-pwa |
| Backend | Express + PostgreSQL |
| Gerenciador de processos | PM2 (`mayra-social-api`) |
| Servidor | VPS Linux + Nginx + PM2 |

---

## Identidade visual

- **Superfície:** preto puro `#000000`. Separação por hairlines (`rgba(255,255,255,0.08)`), não por preenchimentos.
- **Destaque:** rosa `#E86CB4` — CTAs, estados ativos, links, contadores.
- **Tipografia:** Newsreader (serif, títulos e leitura), Hanken Grotesk (sans, interface), JetBrains Mono (mono, datas e código).
- **Tinta:** off-whites quentes — `#F2EDE6` / `#ABA49A` / `#6C665E`.
- **Motion:** fade-up suave na entrada de telas; modal centralizado no desktop; full-screen no mobile.

---

## Layout

### Mobile (< 768px)
- `AppBar` fixo no topo por tela (respeita safe area do iOS)
- `TabBar` fixo no rodapé: Hoje · Arquivo · + · Explorar · Você
- Compose: sheet full-screen com slide-up
- Seção "SEU ESPAÇO" no perfil com atalhos para todas as rotas

### Desktop (≥ 768px)
- Sidebar esquerda de 264px com duas seções de navegação:
  - **Navegação principal:** Hoje, Explorar, Pessoas, Avisos, Mensagens, Cápsulas
  - **SEU ARQUIVO:** Visão geral, Memórias, Calendário, Coleções, Arquivos, Fotografia, Stories
  - **SUA TRAJETÓRIA:** Projetos, Dashboard, Graph, Minha História, Conquistas, Trajetória, Conhecimento, Mapa da Vida, Retrospectiva
- A área de navegação rola independentemente; o chip de usuário fica sempre visível no rodapé
- Coluna central (flex-1, max ~880–1140px)
- Painel direito contextual de 300px

---

## Rotas

### Arquivo diário
| Rota | Tela |
|---|---|
| `/` | Hoje — prompt diário, strip de memórias, feed do círculo |
| `/archive` | Hub do arquivo — visão geral + subnavegação |
| `/archive?s=memories` | Memórias — "neste dia em outros anos" |
| `/archive?s=calendar` | Calendário — navegação por data |
| `/archive?s=collections` | Coleções |
| `/library` | Arquivos — PDFs, markdowns, scripts |
| `/photos` | Fotografia — galeria com metadados EXIF |
| `/archive/stories` | Stories arquivados |
| `/capsules` | Cápsulas do tempo |

### Trajetória pessoal
| Rota | Tela |
|---|---|
| `/projects` | Projetos — cards com status, marcos e aprendizados |
| `/projects/:slug` | Detalhe do projeto — milestones, learnings, edição |
| `/dashboard` | Dashboard — gráficos de atividade (30 dias / 12 meses) |
| `/graph` | Graph — visualização force-directed de posts, projetos, tags |
| `/story` | Minha História — narrativa em prosa gerada automaticamente |
| `/achievements` | Conquistas — 17 badges baseadas em atividade real |
| `/growth` | Trajetória — timeline vertical dos primeiros marcos |
| `/knowledge` | Base de Conhecimento — conteúdo pesquisável por categoria |
| `/life-map` | Mapa da Vida — calendário anual com intensidade por período |
| `/year-review/:year` | Retrospectiva — resumo editorial do ano |

### Social e configurações
| Rota | Tela |
|---|---|
| `/explore` | Explorar — busca, temas, arquivos públicos |
| `/profile` | Perfil — stats, streak, projetos, atalhos |
| `/profiles/:id` | Perfil público |
| `/friends` | Pessoas — círculo, seguidores |
| `/notifications` | Avisos — atividade agrupada |
| `/messages` | Mensagens — lista de conversas |
| `/messages/:id` | Conversa individual |
| `/settings` | Ajustes — perfil, senha, export/import, onboarding |

---

## Funcionalidades principais

### Registros
Tipos suportados no compose: Nota, Ensaio (artigo longo com editor rich text), Foto, Documento (PDF), Código (com sandbox Python/JS/HTML), Arquivo (markdown, scripts), Link (preview automático).

Privacidade por entrada: Privado · Círculo · Público.

### Projetos
Cada projeto tem: título, emoji, descrição, status (ideia / ativo / pausado / concluído / arquivado), URL do GitHub, URL do site, tags, cover image, datas de início e conclusão.

Dentro do projeto: **MARCOS** (milestones com datas) e **APRENDIZADOS** (learnings textuais editáveis).

### Cápsulas
Mensagens seladas com data de abertura. Permanece bloqueada até a data configurada.

### Streaks
Contagem de dias consecutivos com pelo menos um registro. Calculado no backend com forward pass nas datas.

### Onboarding editorial
8 capítulos que ensinam a filosofia do Archive — não um tour de interface. Suporte a teclado (setas + Enter + Escape), swipe no mobile, progresso persistido no backend.

### Evolução automática
Dashboard, Graph, Conquistas, Story e Growth são gerados automaticamente a partir dos registros existentes. Nenhuma ação manual necessária.

---

## Componentes relevantes

### Shell
- **Layout** — sidebar + main + right panel + listener global de compose
- **Sidebar** — seções SEU ARQUIVO e SUA TRAJETÓRIA; nav rola, chip de usuário fixo
- **ComposeBox** — modal centralizado no desktop; sheet full-screen no mobile
- **StoriesBar** — carousel de stories com upload por câmera ou galeria

### UI (`src/components/ui/`)
| Componente | Descrição |
|---|---|
| `AppBar` | Barra topo mobile com safe area |
| `TabBar` | Barra de navegação inferior mobile |
| `Avatar` | Círculo com fallback de iniciais |
| `EntryCard` | Card de entrada com reações |
| `PersonRow` | Avatar + nome + botão seguir |
| `Icon` | SVG inline (stroke, 24×24, currentColor) |

---

## Desenvolvimento local

```bash
# Frontend
npm install
npm run dev        # http://localhost:5173

# Backend
cd backend
npm install
npm run dev        # http://localhost:3001
```

Copie `.env.example` para `.env` e preencha a URL do banco e o JWT secret.

---

## Deploy

Build local e push para o repositório. O servidor puxa a atualização, faz o build e reinicia o processo via PM2.

---

## Segurança

Nunca comitar:
- `.env` ou `backend/.env`
- `backend/storage/uploads/` (manter apenas `.gitkeep`)
- `dist/` ou `node_modules/`

---

*The Archive by Balboni — guardado, não transmitido.*

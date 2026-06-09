# The Archive by Balboni

> Um arquivo pessoal. Silencioso, editorial, permanente.

**Produção:** https://social.balbonilab.com

O Archive não é uma rede social. É um espaço para guardar pensamentos, projetos, memórias, fotografias, código e reflexões — sem algoritmo, sem feed infinito, sem disputa por atenção. Com o tempo, todos esses registros formam uma narrativa construída automaticamente a partir daquilo que você cria.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS v3 |
| Roteamento | React Router v6 |
| PWA | vite-plugin-pwa |
| Backend | Node.js + Express + PostgreSQL |
| Processo | PM2 + Nginx |

---

## O que tem no Archive

**Registros** — nota, ensaio (markdown), foto (com EXIF completo), PDF, código (com sandbox Python/JS/HTML), arquivo, link com preview automático. Cada entrada tem privacidade individual: privado, círculo ou público.

**Projetos** — agrupam registros ao longo do tempo. Cada projeto tem status, tags, GitHub, website, datas, cover, marcos com data e aprendizados textuais.

**Cápsulas do tempo** — mensagens seladas até uma data futura. Permanecem inacessíveis até lá.

**Arquivo pessoal** — memórias ("neste dia em outros anos"), calendário de atividade, coleções, biblioteca de arquivos, galeria fotográfica, stories arquiváveis.

**Trajetória** — dashboard de atividade, mapa de conexões (grafo force-directed sem D3), conquistas, timeline de crescimento, história narrativa automática, base de conhecimento, mapa da vida, retrospectiva anual.

**Social** — comentários encadeados, reações temáticas, menções `@handle`, seguir/amizade, mensagens diretas, notificações.

---

## Navegação

**Mobile:** bottom nav com Hoje · Arquivo · + · Explorar · Você. Compose em fullscreen. Atalhos para todas as rotas na seção "Seu Espaço" do perfil.

**Desktop:** sidebar com três seções — navegação principal, **SEU ARQUIVO** e **SUA TRAJETÓRIA**. A área de nav rola; o chip de usuário fica fixo no rodapé.

### Rotas

| Arquivo | Trajetória |
|---|---|
| `/` — Hoje | `/projects` — Projetos |
| `/archive` — Hub | `/dashboard` — Dashboard |
| `/photos` — Fotografias | `/graph` — Grafo |
| `/library` — Arquivos | `/story` — Minha História |
| `/capsules` — Cápsulas | `/achievements` — Conquistas |
| `/archive/stories` — Stories | `/growth` — Trajetória |
| | `/knowledge` — Conhecimento |
| | `/life-map` — Mapa da Vida |
| | `/year-review/:year` — Retrospectiva |

---

## Design

- **Superfície:** preto puro `#000000`, separação por hairlines `rgba(255,255,255,0.08)`
- **Destaque:** rosa `#E86CB4` — CTAs, estados ativos, links
- **Tipografia:** Newsreader (serif, títulos), Hanken Grotesk (sans, UI), JetBrains Mono (mono, datas e código)
- **Tinta:** `#F2EDE6` / `#ABA49A` / `#6C665E`

---

## Desenvolvimento local

```bash
# Frontend
npm install && npm run dev        # http://localhost:5173

# Backend
cd backend && npm install && npm run dev   # http://localhost:3001
```

Copie `.env.example` para `.env` e configure `DATABASE_URL` e `JWT_SECRET`.

---

## Testes

Testes de integração cobrem os fluxos principais do backend: auth, posts, categorias, reações, comentários, cápsulas e projetos.

```bash
# 1. Crie um banco de teste local (uma única vez)
createdb archive_test

# 2. Configure .env.test
cp backend/.env.test.example backend/.env.test
# Edite backend/.env.test e ajuste DATABASE_URL e JWT_SECRET

# 3. Execute
cd backend && npm test
```

Os testes criam usuários com handle `@_test_<run_id>_*` e removem todos os dados ao final.
Se `backend/.env.test` não existir, os testes tentam usar o banco configurado em `backend/.env`.
Se o banco não estiver acessível, os testes são ignorados com aviso — sem falha no CI.

---

## Segurança

Nunca versionar: `.env`, `backend/.env`, `backend/.env.test`, `backend/storage/uploads/`, `dist/`, `node_modules/`.

---

*Guardado, não transmitido.*

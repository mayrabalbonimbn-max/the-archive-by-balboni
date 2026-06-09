-- ════════════════════════════════════════════════════════════════════════
-- MIGRATION SEGURA — The Archive
-- Idempotente: pode rodar múltiplas vezes sem efeito colateral.
-- Sem DROP TABLE. Sem perda de dados.
-- ════════════════════════════════════════════════════════════════════════

-- ── PASSO 1 — Inspecionar estrutura atual (rode isso PRIMEIRO) ────────
-- \d stories
-- \d story_views
-- \d conversations
-- \d direct_messages

-- ── PASSO 2 — stories: adicionar colunas faltantes ────────────────────

ALTER TABLE stories ADD COLUMN IF NOT EXISTS type        VARCHAR(20)  NOT NULL DEFAULT 'text';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS content     TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS media_path  TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS bg_color    VARCHAR(30)  DEFAULT '#0a0a0a';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS font_style  VARCHAR(20)  DEFAULT 'serif';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS visibility  VARCHAR(20)  NOT NULL DEFAULT 'friends';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS expires_at  TIMESTAMPTZ  NOT NULL DEFAULT (now() + INTERVAL '24 hours');

-- Constraints (drop+add é idempotente)
ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_type_check;
ALTER TABLE stories ADD  CONSTRAINT stories_type_check
  CHECK (type IN ('text', 'photo'));

ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_visibility_check;
ALTER TABLE stories ADD  CONSTRAINT stories_visibility_check
  CHECK (visibility IN ('public', 'friends', 'private'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stories_profile ON stories(profile_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires  ON stories(expires_at);

-- ── PASSO 3 — story_views ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS story_views (
  story_id  UUID NOT NULL REFERENCES stories(id)  ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_story_views_story ON story_views(story_id);

-- ── PASSO 4 — conversations ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_a  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_b  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_pair
  ON conversations (
    LEAST(profile_a::text,    profile_b::text),
    GREATEST(profile_a::text, profile_b::text)
  );

-- ── PASSO 5 — direct_messages ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS direct_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_conv
  ON direct_messages(conversation_id, created_at);

-- ── PASSO 6 — Validação ───────────────────────────────────────────────
-- Rode depois da migration para confirmar:
--
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'stories'
-- ORDER BY ordinal_position;
--
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'story_views';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'conversations';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'direct_messages';
--
-- SELECT conname, consrc FROM pg_constraint WHERE conrelid = 'stories'::regclass;

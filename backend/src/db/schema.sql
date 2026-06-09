CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  handle VARCHAR(50) UNIQUE NOT NULL,
  bio TEXT DEFAULT '',
  avatar TEXT,
  header_color TEXT DEFAULT 'linear-gradient(135deg, #c084fc, #f472b6)',
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Keep installations created by older versions compatible with authentication.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS handle VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS header_color TEXT DEFAULT 'linear-gradient(135deg, #c084fc, #f472b6)';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  type VARCHAR(30) NOT NULL DEFAULT 'pensamento',
  is_diary BOOLEAN NOT NULL DEFAULT false,
  is_private BOOLEAN NOT NULL DEFAULT false,
  liked BOOLEAN NOT NULL DEFAULT false,
  like_count INTEGER NOT NULL DEFAULT 0,
  saved BOOLEAN NOT NULL DEFAULT false,
  pinned BOOLEAN NOT NULL DEFAULT false,
  code_language VARCHAR(30) DEFAULT NULL,
  code_content TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'private';
UPDATE posts SET visibility = CASE WHEN is_private THEN 'private' ELSE COALESCE(NULLIF(visibility, ''), 'private') END;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_visibility_check;
ALTER TABLE posts ADD CONSTRAINT posts_visibility_check CHECK (visibility IN ('private', 'followers', 'friends', 'public'));

CREATE TABLE IF NOT EXISTS post_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL UNIQUE,
  mime_type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL CHECK (size >= 0),
  file_type VARCHAR(20) NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE post_attachments ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'private';
ALTER TABLE post_attachments ADD COLUMN IF NOT EXISTS title VARCHAR(200);
ALTER TABLE post_attachments ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE post_attachments DROP CONSTRAINT IF EXISTS post_attachments_visibility_check;
ALTER TABLE post_attachments ADD CONSTRAINT post_attachments_visibility_check CHECK (visibility IN ('private', 'followers', 'friends', 'public'));

ALTER TABLE posts ADD COLUMN IF NOT EXISTS code_language VARCHAR(30) DEFAULT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS code_content TEXT DEFAULT NULL;

-- Profile: digital garden additions
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- Collections
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  emoji VARCHAR(10) DEFAULT '📁',
  color VARCHAR(50) DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE collections ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'private';
ALTER TABLE collections DROP CONSTRAINT IF EXISTS collections_visibility_check;
ALTER TABLE collections ADD CONSTRAINT collections_visibility_check CHECK (visibility IN ('private', 'followers', 'friends', 'public'));

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT follows_not_self CHECK (follower_id <> following_id),
  CONSTRAINT follows_unique UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT friendships_not_self CHECK (requester_id <> receiver_id),
  CONSTRAINT friendships_status_check CHECK (status IN ('pending', 'accepted', 'rejected'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_friendships_pair
  ON friendships (LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id));

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_receiver ON friendships(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT post_reactions_type_check CHECK (reaction_type IN ('heart', 'spark', 'save')),
  CONSTRAINT post_reactions_unique UNIQUE (post_id, profile_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_profile_id ON post_reactions(profile_id);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);

CREATE TABLE IF NOT EXISTS comment_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comment_replies_comment_id ON comment_replies(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_replies_author_id ON comment_replies(author_id);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  type VARCHAR(40) NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT notifications_type_check CHECK (type IN ('join', 'follow', 'like', 'comment', 'reply'))
);

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('join', 'follow', 'like', 'comment', 'reply'));

CREATE INDEX IF NOT EXISTS idx_notifications_profile_created ON notifications(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(profile_id, read_at);

-- Posts: articles + collections
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_article BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS article_title VARCHAR(500);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS collection_id UUID;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'private';
ALTER TABLE post_attachments ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'private';
ALTER TABLE post_attachments ADD COLUMN IF NOT EXISTS title VARCHAR(200);
ALTER TABLE post_attachments ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE collections ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'private';

CREATE INDEX IF NOT EXISTS idx_posts_profile_id ON posts(profile_id);
CREATE INDEX IF NOT EXISTS idx_posts_profile_created ON posts(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_post_id ON post_attachments(post_id);
CREATE INDEX IF NOT EXISTS idx_attachments_profile_id ON post_attachments(profile_id);
CREATE INDEX IF NOT EXISTS idx_collections_profile_id ON collections(profile_id);
CREATE INDEX IF NOT EXISTS idx_posts_collection_id ON posts(collection_id);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
CREATE INDEX IF NOT EXISTS idx_attachments_visibility ON post_attachments(visibility);
CREATE INDEX IF NOT EXISTS idx_collections_visibility ON collections(visibility);

-- Web Push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT push_subscriptions_unique UNIQUE (profile_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_profile ON push_subscriptions(profile_id);

-- Image processing (thumbnails, optimized versions, EXIF)
ALTER TABLE post_attachments ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;
ALTER TABLE post_attachments ADD COLUMN IF NOT EXISTS optimized_path TEXT;
ALTER TABLE post_attachments ADD COLUMN IF NOT EXISTS optimized_mime TEXT;
ALTER TABLE post_attachments ADD COLUMN IF NOT EXISTS exif_data JSONB;

-- Archive Organization: tags
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT tags_profile_slug_unique UNIQUE (profile_id, slug)
);
CREATE TABLE IF NOT EXISTS post_tags (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_tags_profile ON tags(profile_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_post ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag_id);

-- Pin order (up to 5 pinned posts)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS pin_order INTEGER DEFAULT 0;

-- Rich link preview cache
ALTER TABLE posts ADD COLUMN IF NOT EXISTS link_preview JSONB;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON posts(profile_id, pinned, pin_order) WHERE pinned = true;
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(profile_id, type);
CREATE INDEX IF NOT EXISTS idx_posts_is_article ON posts(profile_id, is_article) WHERE is_article = true;

-- Stories
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'text',
  content TEXT,
  media_path TEXT,
  bg_color VARCHAR(30) DEFAULT '#0a0a0a',
  font_style VARCHAR(20) DEFAULT 'serif',
  visibility VARCHAR(20) NOT NULL DEFAULT 'friends',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT stories_type_check CHECK (type IN ('text', 'photo')),
  CONSTRAINT stories_visibility_check CHECK (visibility IN ('public', 'friends', 'private'))
);

CREATE TABLE IF NOT EXISTS story_views (
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_stories_profile ON stories(profile_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_story_views_story ON story_views(story_id);

-- Time capsules
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_time_capsule BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS unlock_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_posts_capsule ON posts(profile_id, is_time_capsule) WHERE is_time_capsule = true;

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  emoji VARCHAR(10) DEFAULT '🌱',
  description TEXT DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  github_url TEXT,
  website_url TEXT,
  cover_image TEXT,
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT projects_profile_slug_unique UNIQUE (profile_id, slug),
  CONSTRAINT projects_status_check CHECK (status IN ('ideia', 'construindo', 'ativo', 'pausado', 'concluído'))
);

CREATE INDEX IF NOT EXISTS idx_projects_profile ON projects(profile_id);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(profile_id, is_featured) WHERE is_featured = true;

ALTER TABLE posts ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_posts_project_id ON posts(project_id);

-- Onboarding
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Memory reflections
ALTER TABLE posts ADD COLUMN IF NOT EXISTS parent_memory_post_id UUID REFERENCES posts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_posts_parent_memory ON posts(parent_memory_post_id) WHERE parent_memory_post_id IS NOT NULL;

-- Expanded reactions (keep save separate, new primary emoji reactions)
ALTER TABLE post_reactions DROP CONSTRAINT IF EXISTS post_reactions_type_check;
ALTER TABLE post_reactions ADD CONSTRAINT post_reactions_type_check
  CHECK (reaction_type IN ('heart', 'spark', 'save', 'inspirador', 'aprendizado', 'codigo', 'fotografia'));

-- Projects: dates (legacy)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date DATE;

-- Projects: expanded fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS color VARCHAR(30);

-- Project milestones (MARCOS)
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  reached_at DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones(project_id, sort_order);

-- Project learnings (APRENDIZADOS)
CREATE TABLE IF NOT EXISTS project_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_project_learnings_project ON project_learnings(project_id);

-- Post categoria (semantic nature of the content)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS categoria VARCHAR(40) DEFAULT NULL;

-- GIN indexes for full-text search (Portuguese)
CREATE INDEX IF NOT EXISTS idx_posts_fts ON posts USING GIN (
  to_tsvector('portuguese', coalesce(article_title,'') || ' ' || coalesce(content,''))
);
CREATE INDEX IF NOT EXISTS idx_attachments_fts ON post_attachments USING GIN (
  to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(original_name,'') || ' ' || coalesce(description,''))
);
CREATE INDEX IF NOT EXISTS idx_collections_fts ON collections USING GIN (
  to_tsvector('portuguese', name)
);

-- Direct messages
-- conversations uses a participants table to support group chats in the future.
-- Production schema: conversations(id, created_at) + conversation_participants(conversation_id, profile_id).
CREATE TABLE IF NOT EXISTS conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  last_read_at    TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, profile_id)
);
CREATE INDEX IF NOT EXISTS idx_cp_profile ON conversation_participants(profile_id);

CREATE TABLE IF NOT EXISTS direct_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id        UUID NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  content          TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conv ON direct_messages(conversation_id, created_at);

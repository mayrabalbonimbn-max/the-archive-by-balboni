const VISIBILITIES = new Set(['private', 'followers', 'friends', 'public'])
const REACTIONS = new Set(['heart', 'spark', 'save'])

function normalizeVisibility(value, fallback = 'private') {
  return VISIBILITIES.has(value) ? value : fallback
}

function canSeeContent(row, viewerProfileId) {
  if (!row || !viewerProfileId) return false
  if (row.profile_id === viewerProfileId) return true
  if (row.visibility === 'public') return true
  if (row.visibility === 'followers') return row.is_following === true
  return row.visibility === 'friends' && row.is_friend === true
}

function visibleSql(alias = 'p') {
  return `(
    ${alias}.profile_id = $1
    OR ${alias}.visibility = 'public'
    OR (
      ${alias}.visibility = 'followers'
      AND EXISTS (
        SELECT 1 FROM follows fl
        WHERE fl.follower_id = $1 AND fl.following_id = ${alias}.profile_id
      )
    )
    OR (
      ${alias}.visibility = 'friends'
      AND EXISTS (
        SELECT 1 FROM friendships f
        WHERE f.status = 'accepted'
          AND (
            (f.requester_id = $1 AND f.receiver_id = ${alias}.profile_id)
            OR (f.receiver_id = $1 AND f.requester_id = ${alias}.profile_id)
          )
      )
    )
  )`
}

function attachmentVisibleSql(attachmentAlias = 'a', postAlias = 'p') {
  return `(
    ${postAlias}.profile_id = $1
    OR (
      ${postAlias}.visibility = 'public'
      AND ${attachmentAlias}.visibility = 'public'
    )
    OR (
      ${postAlias}.visibility IN ('followers', 'friends', 'public')
      AND ${attachmentAlias}.visibility IN ('followers', 'friends', 'public')
      AND ${postAlias}.visibility = 'followers'
      AND EXISTS (
        SELECT 1 FROM follows fl
        WHERE fl.follower_id = $1 AND fl.following_id = ${postAlias}.profile_id
      )
    )
    OR (
      ${postAlias}.visibility IN ('friends', 'public')
      AND ${attachmentAlias}.visibility IN ('friends', 'public')
      AND EXISTS (
        SELECT 1 FROM friendships f
        WHERE f.status = 'accepted'
          AND (
            (f.requester_id = $1 AND f.receiver_id = ${postAlias}.profile_id)
            OR (f.receiver_id = $1 AND f.requester_id = ${postAlias}.profile_id)
          )
      )
    )
  )`
}

function followingSelect(viewerParam = '$1', profileAlias = 'p') {
  return `EXISTS (
    SELECT 1 FROM follows fl
    WHERE fl.follower_id = ${viewerParam} AND fl.following_id = ${profileAlias}.id
  ) AS is_following`
}

function friendshipSelect(viewerParam = '$1', profileAlias = 'p') {
  return `EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.status = 'accepted'
      AND (
        (f.requester_id = ${viewerParam} AND f.receiver_id = ${profileAlias}.id)
        OR (f.receiver_id = ${viewerParam} AND f.requester_id = ${profileAlias}.id)
      )
  ) AS is_friend`
}

function reactionCountsSql(postAlias = 'p') {
  return `COALESCE((
    SELECT jsonb_object_agg(reaction_type, count)
    FROM (
      SELECT reaction_type, COUNT(*)::int AS count
      FROM post_reactions pr
      WHERE pr.post_id = ${postAlias}.id
      GROUP BY reaction_type
    ) counts
  ), '{}'::jsonb) AS reaction_counts`
}

function viewerReactionsSql(postAlias = 'p', viewerParam = '$1') {
  return `COALESCE((
    SELECT jsonb_agg(reaction_type)
    FROM post_reactions pr
    WHERE pr.post_id = ${postAlias}.id AND pr.profile_id = ${viewerParam}
  ), '[]'::jsonb) AS viewer_reactions`
}

module.exports = {
  REACTIONS,
  VISIBILITIES,
  attachmentVisibleSql,
  canSeeContent,
  friendshipSelect,
  followingSelect,
  normalizeVisibility,
  reactionCountsSql,
  viewerReactionsSql,
  visibleSql,
}

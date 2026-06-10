import { lazy, Suspense, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'

// ── Always eager: shell + highest-traffic pages ────────────────────────────────
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import ArchiveHubPage from './pages/ArchiveHubPage'
import OnboardingTour from './components/OnboardingTour'
import ErrorBoundary from './components/ErrorBoundary'
import { usePosts } from './hooks/usePosts'
import { useProfile } from './hooks/useProfile'
import { useSession } from './hooks/useSession'

// ── Debug page — renders with zero deps on profile/session ────────────────────
function SettingsDebugPage() {
  const info = {
    ua: navigator.userAgent,
    standalone: window.matchMedia?.('(display-mode: standalone)')?.matches,
    token: !!localStorage.getItem('ms_token'),
    sw: 'serviceWorker' in navigator,
    push: 'PushManager' in window,
    notif: typeof Notification !== 'undefined' ? Notification.permission : 'unavailable',
    href: location.href,
    ts: new Date().toISOString(),
  }
  return (
    <div style={{ minHeight: '100dvh', background: '#000', color: '#f2ede6', fontFamily: 'monospace', fontSize: 13, padding: '32px 20px', overflowY: 'auto' }}>
      <div style={{ color: '#e86cb4', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>settings-debug — renderizou ✓</div>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#aba49a' }}>{JSON.stringify(info, null, 2)}</pre>
      <button onClick={() => location.href = '/settings'} style={{ marginTop: 24, padding: '10px 20px', border: '1px solid #333', background: 'transparent', color: '#f2ede6', cursor: 'pointer', fontFamily: 'monospace', borderRadius: 8 }}>
        Ir para /settings
      </button>
    </div>
  )
}

// ── Lazy: every other page ─────────────────────────────────────────────────────
const PublicProfilePage    = lazy(() => import('./pages/PublicProfilePage'))
const FriendsPage          = lazy(() => import('./pages/FriendsPage'))
const NotificationsPage    = lazy(() => import('./pages/NotificationsPage'))
const TodayPage            = lazy(() => import('./pages/TodayPage'))
const MemoriesPage         = lazy(() => import('./pages/MemoriesPage'))
const CalendarPage         = lazy(() => import('./pages/CalendarPage'))
const StatsPage            = lazy(() => import('./pages/StatsPage'))
const PhotosPage           = lazy(() => import('./pages/PhotosPage'))
const ArchiveListPage      = lazy(() => import('./pages/ArchiveListPage'))
const ExplorePage          = lazy(() => import('./pages/ExplorePage'))
const DiaryPage            = lazy(() => import('./pages/DiaryPage'))
const SavedPage            = lazy(() => import('./pages/SavedPage'))
const SettingsPage         = lazy(() => import('./pages/SettingsPage'))
const CollectionsPage      = lazy(() => import('./pages/CollectionsPage'))
const CollectionDetailPage = lazy(() => import('./pages/CollectionDetailPage'))
const LibraryPage          = lazy(() => import('./pages/LibraryPage'))
const ArticlePage          = lazy(() => import('./pages/ArticlePage'))
const PostDetailPage       = lazy(() => import('./pages/PostDetailPage'))
const MessagesPage         = lazy(() => import('./pages/MessagesPage'))
const ConversationPage     = lazy(() => import('./pages/ConversationPage'))
const CapsulesPage         = lazy(() => import('./pages/CapsulesPage'))
const CapsulePage          = lazy(() => import('./pages/CapsulePage'))
const StoriesArchivePage   = lazy(() => import('./pages/StoriesArchivePage'))
const ProjectsPage         = lazy(() => import('./pages/ProjectsPage'))
const ProjectDetailPage    = lazy(() => import('./pages/ProjectDetailPage'))
const LifeMapPage          = lazy(() => import('./pages/LifeMapPage'))
const GraphPage            = lazy(() => import('./pages/GraphPage'))
const DashboardPage        = lazy(() => import('./pages/DashboardPage'))
const YearReviewPage       = lazy(() => import('./pages/YearReviewPage'))
const KnowledgePage        = lazy(() => import('./pages/KnowledgePage'))
const AchievementsPage     = lazy(() => import('./pages/AchievementsPage'))
const StoryPage            = lazy(() => import('./pages/StoryPage'))
const TrajetoriaPage       = lazy(() => import('./pages/TrajetoriaPage'))

// ── Suspense fallback ──────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', opacity: 0.7, animation: 'pagePulse 1.1s ease-in-out infinite' }} />
      <style>{`@keyframes pagePulse { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.6);opacity:1} }`}</style>
    </div>
  )
}

// ── App root ───────────────────────────────────────────────────────────────────
export default function App() {
  const { session, login, logout } = useSession()
  console.log('[App] session:', !!session, 'token:', !!localStorage.getItem('ms_token'))
  if (!session) return <LoginPage onLogin={login} />
  return <AuthenticatedApp onLogout={logout} />
}

function AuthenticatedApp({ onLogout }) {
  const { profile, loading: profileLoading, updateProfile, uploadProfileMedia, removeProfileMedia, completeOnboarding, resetOnboarding } = useProfile()
  const { posts, loading: postsLoading, addPost, toggleLike, toggleSave, togglePin, deletePost, importPosts } = usePosts()
  const [searchQuery, setSearchQuery] = useState('')

  // Expose handle globally so CirculoSection empty state can build the profile link
  if (profile?.handle) window.__archiveHandle = profile.handle.replace(/^@/, '')

  console.log('[AuthenticatedApp] profileLoading:', profileLoading, 'profile:', profile?.handle ?? null)

  if (profileLoading) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!profile) {
    console.warn('[AuthenticatedApp] profile is null after loading — forcing logout')
    onLogout()
    return null
  }

  const sharedProps = { posts, profile, onLike: toggleLike, onSave: toggleSave, onPin: togglePin, onDelete: deletePost }

  return (
    <>
      {!profile.onboardingCompleted && <OnboardingTour onComplete={completeOnboarding} />}
      <Layout profile={profile} posts={posts} searchQuery={searchQuery} onSearch={setSearchQuery} onLogout={onLogout} onPost={addPost}>
        <Suspense fallback={<PageLoader />}>
          <ErrorBoundary>
          <Routes>
            {/* Eager */}
            <Route path="/"        element={<HomePage {...sharedProps} searchQuery={searchQuery} onPost={addPost} />} />
            <Route path="/profile" element={<ProfilePage {...sharedProps} onPost={addPost} />} />
            <Route path="/archive" element={<ArchiveHubPage />} />

            {/* Lazy */}
            <Route path="/profiles/:id"   element={<PublicProfilePage {...sharedProps} />} />
            <Route path="/friends"        element={<FriendsPage />} />
            <Route path="/notifications"  element={<NotificationsPage />} />
            <Route path="/today"          element={<TodayPage />} />
            <Route path="/memories"       element={<MemoriesPage />} />
            <Route path="/calendar"       element={<CalendarPage />} />
            <Route path="/stats"          element={<StatsPage />} />
            <Route path="/photos"         element={<PhotosPage />} />
            <Route path="/explore"        element={<ExplorePage />} />
            <Route path="/tags/:tag"      element={<ArchiveListPage kind="tag" />} />
            <Route path="/backlinks/:title" element={<ArchiveListPage kind="backlink" />} />
            <Route path="/diary"          element={<DiaryPage {...sharedProps} searchQuery={searchQuery} />} />
            <Route path="/saved"          element={<SavedPage {...sharedProps} searchQuery={searchQuery} />} />
            <Route path="/settings-debug" element={<SettingsDebugPage />} />
            <Route path="/settings"       element={
              <SettingsPage profile={profile} posts={posts} onUpdateProfile={updateProfile} onUploadProfileMedia={uploadProfileMedia} onRemoveProfileMedia={removeProfileMedia} onImportPosts={importPosts} onLogout={onLogout} onResetOnboarding={resetOnboarding} />
            } />
            <Route path="/collections"      element={<CollectionsPage />} />
            <Route path="/collections/:id"  element={<CollectionDetailPage {...sharedProps} />} />
            <Route path="/library"          element={<LibraryPage />} />
            <Route path="/articles/:id"     element={<ArticlePage profile={profile} onLike={toggleLike} onSave={toggleSave} onDelete={deletePost} />} />
            <Route path="/posts/:id"        element={<PostDetailPage profile={profile} onLike={toggleLike} onSave={toggleSave} onDelete={deletePost} />} />
            <Route path="/messages"         element={<MessagesPage />} />
            <Route path="/messages/:id"     element={<ConversationPage profile={profile} />} />
            <Route path="/capsules"         element={<CapsulesPage />} />
            <Route path="/capsules/:id"     element={<CapsulePage />} />
            <Route path="/archive/stories"  element={<StoriesArchivePage />} />
            <Route path="/projects"         element={<ProjectsPage />} />
            <Route path="/projects/:slug"   element={<ProjectDetailPage />} />
            <Route path="/life-map"         element={<LifeMapPage />} />
            <Route path="/graph"            element={<GraphPage />} />
            <Route path="/dashboard"        element={<DashboardPage />} />
            <Route path="/year-review/:year" element={<YearReviewPage />} />
            <Route path="/knowledge"        element={<KnowledgePage />} />
            <Route path="/growth"           element={<Navigate to="/story" replace />} />
            <Route path="/achievements"     element={<AchievementsPage />} />
            <Route path="/story"            element={<StoryPage />} />
            <Route path="/trajetoria"       element={<TrajetoriaPage />} />

            {/* Public profile by @username — catch-all, must be last */}
            <Route path="/:username"        element={<PublicProfilePage {...sharedProps} />} />
          </Routes>
          </ErrorBoundary>
        </Suspense>
      </Layout>
    </>
  )
}

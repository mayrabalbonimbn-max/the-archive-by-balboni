import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import DiaryPage from './pages/DiaryPage'
import SavedPage from './pages/SavedPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import CollectionsPage from './pages/CollectionsPage'
import CollectionDetailPage from './pages/CollectionDetailPage'
import LibraryPage from './pages/LibraryPage'
import ArticlePage from './pages/ArticlePage'
import FriendsPage from './pages/FriendsPage'
import NotificationsPage from './pages/NotificationsPage'
import PublicProfilePage from './pages/PublicProfilePage'
import TodayPage from './pages/TodayPage'
import MemoriesPage from './pages/MemoriesPage'
import CalendarPage from './pages/CalendarPage'
import StatsPage from './pages/StatsPage'
import PhotosPage from './pages/PhotosPage'
import ArchiveListPage from './pages/ArchiveListPage'
import ArchiveHubPage from './pages/ArchiveHubPage'
import ExplorePage from './pages/ExplorePage'
import { usePosts } from './hooks/usePosts'
import { useProfile } from './hooks/useProfile'
import { useSession } from './hooks/useSession'

export default function App() {
  const { session, login, logout } = useSession()
  if (!session) return <LoginPage onLogin={login} />
  return <AuthenticatedApp onLogout={logout} />
}

function AuthenticatedApp({ onLogout }) {
  const { profile, loading: profileLoading, updateProfile, uploadProfileMedia, removeProfileMedia } = useProfile()
  const { posts, loading: postsLoading, addPost, toggleLike, toggleSave, togglePin, deletePost, importPosts } = usePosts()
  const [searchQuery, setSearchQuery] = useState('')

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-rose border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!profile) {
    onLogout()
    return null
  }

  const sharedProps = { posts, profile, onLike: toggleLike, onSave: toggleSave, onPin: togglePin, onDelete: deletePost }

  return (
    <Layout profile={profile} posts={posts} searchQuery={searchQuery} onSearch={setSearchQuery} onLogout={onLogout} onPost={addPost}>
      <Routes>
        <Route path="/"        element={<HomePage {...sharedProps} searchQuery={searchQuery} onPost={addPost} />} />
        <Route path="/profile" element={<ProfilePage {...sharedProps} onPost={addPost} />} />
        <Route path="/profiles/:id" element={<PublicProfilePage {...sharedProps} />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/memories" element={<MemoriesPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/photos" element={<PhotosPage />} />
        <Route path="/archive" element={<ArchiveHubPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/tags/:tag" element={<ArchiveListPage kind="tag" />} />
        <Route path="/backlinks/:title" element={<ArchiveListPage kind="backlink" />} />
        <Route path="/diary"   element={<DiaryPage {...sharedProps} searchQuery={searchQuery} />} />
        <Route path="/saved"   element={<SavedPage {...sharedProps} searchQuery={searchQuery} />} />
        <Route path="/settings" element={
          <SettingsPage profile={profile} posts={posts} onUpdateProfile={updateProfile} onUploadProfileMedia={uploadProfileMedia} onRemoveProfileMedia={removeProfileMedia} onImportPosts={importPosts} onLogout={onLogout} />
        } />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/:id" element={<CollectionDetailPage {...sharedProps} />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/articles/:id" element={<ArticlePage profile={profile} onLike={toggleLike} onSave={toggleSave} onDelete={deletePost} />} />
      </Routes>
    </Layout>
  )
}

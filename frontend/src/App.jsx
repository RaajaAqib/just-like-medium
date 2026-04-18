import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Article from './pages/Article';
import Login from './pages/Login';
import Register from './pages/Register';
import WriteArticle from './pages/WriteArticle';
import EditArticle from './pages/EditArticle';
import AuthorProfile from './pages/AuthorProfile';
import AdminDashboard from './pages/AdminDashboard';
import OurStory from './pages/OurStory';
import Library from './pages/Library';
import MyStories from './pages/MyStories';
import StatsPage from './pages/StatsPage';
import FollowingPage from './pages/FollowingPage';
import AppealPage from './pages/AppealPage';
import NotificationsPage from './pages/NotificationsPage';
import ListDetailPage from './pages/ListDetailPage';
import AboutDeveloper from './pages/AboutDeveloper';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/our-story" element={<OurStory />} />
      <Route path="/about-developer" element={<AboutDeveloper />} />
      <Route path="/article/:slug" element={<Article />} />
      <Route path="/profile/:id" element={<AuthorProfile />} />

      {/* Protected — use SidebarLayout internally */}
      <Route path="/write" element={<ProtectedRoute><WriteArticle /></ProtectedRoute>} />
      <Route path="/edit/:id" element={<ProtectedRoute><EditArticle /></ProtectedRoute>} />
      <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
      <Route path="/my-stories" element={<ProtectedRoute><MyStories /></ProtectedRoute>} />
      <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
      <Route path="/following" element={<ProtectedRoute><FollowingPage /></ProtectedRoute>} />
      <Route path="/appeals" element={<ProtectedRoute><AppealPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/list/:id" element={<ListDetailPage />} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

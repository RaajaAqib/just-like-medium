import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Article from './pages/Article';
import Login from './pages/Login';
import Register from './pages/Register';
import WriteArticle from './pages/WriteArticle';
import EditArticle from './pages/EditArticle';
import AuthorProfile from './pages/AuthorProfile';
import AdminDashboard from './pages/AdminDashboard';

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

// Pages that manage their own Navbar
const SELF_NAVBARED = ['/', '/login', '/register'];

function Layout({ children }) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isAuth = ['/login', '/register'].includes(location.pathname);

  // Home and auth pages manage their own navbar
  if (isHome || isAuth) return <>{children}</>;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/article/:slug" element={<Article />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile/:id" element={<AuthorProfile />} />
        <Route path="/write" element={<ProtectedRoute><WriteArticle /></ProtectedRoute>} />
        <Route path="/edit/:id" element={<ProtectedRoute><EditArticle /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

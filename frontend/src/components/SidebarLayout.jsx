import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/axios';
import {
  FiHome, FiBookmark, FiUser, FiFileText, FiBarChart2,
  FiUserPlus, FiEdit, FiBell, FiSearch, FiMenu, FiX,
  FiPlus, FiSun, FiMoon, FiCode,
} from 'react-icons/fi';

const NavItem = ({ to, icon: Icon, label, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors w-full ${
      active
        ? 'text-medium-black dark:text-gray-100 font-semibold'
        : 'text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100'
    }`}
  >
    <Icon className={`text-xl flex-shrink-0 ${active ? 'text-medium-black dark:text-gray-100' : 'text-medium-gray dark:text-gray-400'}`} />
    <span>{label}</span>
  </Link>
);

export default function SidebarLayout({ children }) {
  const { user, logout } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const path = location.pathname;

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setMobileOpen(false);
    }
  };

  // Poll unread count for the bell badge only
  useEffect(() => {
    if (!user) return;
    const fetch = () => api.get('/notifications').then(r => setNotifications(r.data.notifications || [])).catch(() => {});
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleHamburger = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(true);
    } else {
      setDesktopOpen(prev => !prev);
    }
  };

  const SidebarContent = ({ onClose }) => (
    <div className="flex flex-col h-full">
      <nav className="flex flex-col gap-0.5 px-2 pt-4 flex-1">
        <NavItem to="/" icon={FiHome} label="Home" active={path === '/'} onClick={onClose} />
        <NavItem to="/library" icon={FiBookmark} label="Library" active={path === '/library'} onClick={onClose} />
        <NavItem to={`/profile/${user?._id}`} icon={FiUser} label="Profile" active={path.startsWith('/profile')} onClick={onClose} />
        <NavItem to="/my-stories" icon={FiFileText} label="Stories" active={path === '/my-stories'} onClick={onClose} />
        <NavItem to="/stats" icon={FiBarChart2} label="Stats" active={path === '/stats'} onClick={onClose} />
        <NavItem to="/about-developer" icon={FiCode} label="About Developer" active={path === '/about-developer'} onClick={onClose} />

        <div className="my-2 border-t border-medium-border dark:border-gray-700 mx-2" />

        <NavItem to="/following" icon={FiUserPlus} label="Following" active={path === '/following'} onClick={onClose} />

        <div className="mt-1 px-3">
          <p className="text-xs text-medium-gray dark:text-gray-500 leading-relaxed">
            Find writers and publications to follow.
          </p>
          <Link to="/following" onClick={onClose}
            className="text-xs text-medium-gray dark:text-gray-500 hover:text-medium-black dark:hover:text-gray-200 underline mt-1 block">
            See suggestions
          </Link>
        </div>

        <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100 transition mt-1">
          <FiPlus className="text-xl flex-shrink-0" />
          <span>New list</span>
        </button>
      </nav>

      <div className="px-3 py-4 border-t border-medium-border dark:border-gray-700">
        <Link to="/write" onClick={onClose}
          className="flex items-center gap-3 text-sm text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100 transition px-3 py-2">
          <FiEdit className="text-xl flex-shrink-0" />
          <span>Write a story</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">

      {/* ── Top Navbar ── */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-medium-border dark:border-gray-700 h-14 flex items-center px-4 gap-3">

        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleHamburger}
            className="p-1.5 text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100 transition rounded-sm"
            aria-label="Toggle sidebar"
          >
            <FiMenu className="text-[22px]" />
          </button>
          <Link to="/" className="font-bold font-serif text-medium-black dark:text-gray-100 text-lg leading-none whitespace-nowrap">
            Just Like Medium
          </Link>
        </div>

        {/* Center: search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xs mx-auto hidden sm:block">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-medium-gray dark:text-gray-500 text-sm pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full bg-gray-100 dark:bg-gray-800 text-medium-black dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:bg-gray-200 dark:focus:bg-gray-700 transition"
            />
          </div>
        </form>

        {/* Right: Write, Theme toggle, Bell, Avatar */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">

          {/* Mobile search toggle */}
          <button className="sm:hidden p-1.5 text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100 transition"
            onClick={() => navigate('/?search=')}>
            <FiSearch className="text-xl" />
          </button>

          <Link to="/write"
            className="hidden sm:flex items-center gap-1.5 text-sm text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100 transition px-2 py-1.5 whitespace-nowrap">
            <FiEdit className="text-base" />
            <span>Write</span>
          </Link>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100 transition rounded-sm"
            aria-label="Toggle dark mode"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <FiSun className="text-xl" /> : <FiMoon className="text-xl" />}
          </button>

          {/* Notifications — navigate to dedicated page */}
          <Link to="/notifications"
            className="relative p-1.5 text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100 transition"
            aria-label="Notifications">
            <FiBell className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Avatar dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(v => !v)}>
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=random`}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover cursor-pointer"
              />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-medium-border dark:border-gray-700 rounded shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-medium-border dark:border-gray-700">
                  <p className="text-sm font-medium text-medium-black dark:text-gray-100 truncate">{user?.name}</p>
                  <p className="text-xs text-medium-gray dark:text-gray-400 truncate">{user?.email}</p>
                </div>
                <Link to={`/profile/${user?._id}`} onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Profile</Link>
                <Link to="/library" onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Library</Link>
                <Link to="/my-stories" onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Stories</Link>
                <Link to="/stats" onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Stats</Link>
                <Link to="/about-developer" onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">About Developer</Link>
                <Link to="/appeals" onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Appeals</Link>
                <Link to="/write" onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 sm:hidden">Write</Link>
                {user?.isAdmin && (
                  <Link to="/admin" onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Admin Dashboard</Link>
                )}
                <div className="border-t border-medium-border dark:border-gray-700 mt-1 pt-1">
                  <button
                    onClick={() => { logout(); setDropdownOpen(false); navigate('/'); }}
                    className="block w-full text-left px-4 py-2 text-sm text-medium-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >Sign out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Body: sidebar + content ── */}
      <div className="flex flex-1 min-h-0">

        {/* Desktop persistent sidebar */}
        {desktopOpen && (
          <aside className="hidden md:flex flex-col w-56 lg:w-64 border-r border-medium-border dark:border-gray-700 flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto bg-white dark:bg-gray-900">
            <SidebarContent onClose={undefined} />
          </aside>
        )}

        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="w-64 bg-white dark:bg-gray-900 border-r border-medium-border dark:border-gray-700 h-full shadow-2xl flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between px-4 h-14 border-b border-medium-border dark:border-gray-700 flex-shrink-0">
                <Link to="/" onClick={() => setMobileOpen(false)}
                  className="font-bold font-serif text-medium-black dark:text-gray-100 text-lg">
                  Just Like Medium
                </Link>
                <button onClick={() => setMobileOpen(false)}
                  className="p-1.5 text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100 transition">
                  <FiX className="text-xl" />
                </button>
              </div>
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </div>
            <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-x-clip">
          {user?.banned && (
            <div className="bg-red-600 text-white px-4 py-2.5 text-sm flex items-center justify-between gap-3">
              <span>
                <strong>Your account has been banned.</strong> You cannot post or comment.{' '}
                <Link to="/appeals" className="underline hover:no-underline font-medium">Submit an appeal →</Link>
              </span>
            </div>
          )}
          {!user?.banned && user?.isSuspended && user?.suspendedUntil && new Date(user.suspendedUntil) > new Date() && (
            <div className="bg-orange-500 text-white px-4 py-2.5 text-sm flex items-center justify-between gap-3">
              <span>
                <strong>Your account is suspended</strong> until {new Date(user.suspendedUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
                You cannot post or comment.{' '}
                <Link to="/appeals" className="underline hover:no-underline font-medium">Appeal →</Link>
              </span>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

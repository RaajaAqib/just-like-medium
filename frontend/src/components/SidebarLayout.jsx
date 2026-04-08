import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import {
  FiHome, FiBookmark, FiUser, FiFileText, FiBarChart2,
  FiUserPlus, FiEdit, FiBell, FiSearch, FiMenu, FiX,
  FiHeart, FiMessageCircle, FiPlus
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const NavItem = ({ to, icon: Icon, label, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors w-full ${
      active
        ? 'text-medium-black font-semibold'
        : 'text-medium-gray hover:text-medium-black'
    }`}
  >
    <Icon className={`text-xl flex-shrink-0 ${active ? 'text-medium-black' : 'text-medium-gray'}`} />
    <span>{label}</span>
  </Link>
);

export default function SidebarLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Desktop: sidebar open by default; mobile: closed by default
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);
  const dropdownRef = useRef(null);

  const path = location.pathname;

  // Lock body scroll on mobile overlay
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
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

  const fetchNotifications = async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch {
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleBellClick = () => {
    const next = !notifOpen;
    setNotifOpen(next);
    setDropdownOpen(false);
    if (next) fetchNotifications();
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Hamburger handler: mobile opens overlay, desktop toggles persistent sidebar
  const handleHamburger = () => {
    // Check screen width to determine behavior
    if (window.innerWidth < 768) {
      setMobileOpen(true);
    } else {
      setDesktopOpen(prev => !prev);
    }
  };

  const SidebarContent = ({ onClose }) => (
    <div className="flex flex-col h-full">
      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-2 pt-4 flex-1">
        <NavItem to="/" icon={FiHome} label="Home" active={path === '/'} onClick={onClose} />
        <NavItem to="/library" icon={FiBookmark} label="Library" active={path === '/library'} onClick={onClose} />
        <NavItem to={`/profile/${user?._id}`} icon={FiUser} label="Profile" active={path.startsWith('/profile')} onClick={onClose} />
        <NavItem to="/my-stories" icon={FiFileText} label="Stories" active={path === '/my-stories'} onClick={onClose} />
        <NavItem to="/stats" icon={FiBarChart2} label="Stats" active={path === '/stats'} onClick={onClose} />

        <div className="my-2 border-t border-medium-border mx-2" />

        <NavItem to="/following" icon={FiUserPlus} label="Following" active={path === '/following'} onClick={onClose} />

        <div className="mt-1 px-3">
          <p className="text-xs text-medium-gray leading-relaxed">
            Find writers and publications to follow.
          </p>
          <Link to="/following" onClick={onClose}
            className="text-xs text-medium-gray hover:text-medium-black underline mt-1 block">
            See suggestions
          </Link>
        </div>

        <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-medium-gray hover:text-medium-black transition mt-1">
          <FiPlus className="text-xl flex-shrink-0" />
          <span>New list</span>
        </button>
      </nav>

      {/* Write */}
      <div className="px-3 py-4 border-t border-medium-border">
        <Link to="/write" onClick={onClose}
          className="flex items-center gap-3 text-sm text-medium-gray hover:text-medium-black transition px-3 py-2">
          <FiEdit className="text-xl flex-shrink-0" />
          <span>Write a story</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Top Navbar ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-medium-border h-14 flex items-center px-4 gap-3">

        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleHamburger}
            className="p-1.5 text-medium-gray hover:text-medium-black transition rounded-sm"
            aria-label="Toggle sidebar"
          >
            <FiMenu className="text-[22px]" />
          </button>
          <Link to="/" className="font-bold font-serif text-medium-black text-lg leading-none whitespace-nowrap">
            Just Like Medium
          </Link>
        </div>

        {/* Center: search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xs mx-auto hidden sm:block">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-medium-gray text-sm pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full bg-gray-100 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:bg-gray-200 transition"
            />
          </div>
        </form>

        {/* Right: Write, Bell, Avatar */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">

          {/* Mobile search toggle */}
          <button className="sm:hidden p-1.5 text-medium-gray hover:text-medium-black transition"
            onClick={() => navigate('/?search=')}>
            <FiSearch className="text-xl" />
          </button>

          <Link to="/write"
            className="hidden sm:flex items-center gap-1.5 text-sm text-medium-gray hover:text-medium-black transition px-2 py-1.5 whitespace-nowrap">
            <FiEdit className="text-base" />
            <span>Write</span>
          </Link>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button onClick={handleBellClick}
              className="relative p-1.5 text-medium-gray hover:text-medium-black transition"
              aria-label="Notifications">
              <FiBell className="text-xl" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-medium-border rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-medium-border">
                  <h3 className="font-semibold text-medium-black text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-medium-green hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifLoading ? (
                    <div className="px-4 py-8 text-center text-medium-gray text-sm">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-medium-gray text-sm">No notifications yet.</div>
                  ) : (
                    notifications.map(n => (
                      <Link key={n._id}
                        to={n.postSlug ? `/article/${n.postSlug}` : '#'}
                        onClick={() => setNotifOpen(false)}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-medium-border last:border-0 ${!n.read ? 'bg-blue-50/40' : ''}`}>
                        <div className="mt-0.5 flex-shrink-0">
                          {n.type === 'like'
                            ? <FiHeart className="text-red-500 text-base" />
                            : <FiMessageCircle className="text-medium-green text-base" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-medium-black leading-snug">
                            <span className="font-medium">{n.fromUser?.name || 'Someone'}</span>
                            {' '}{n.type === 'like' ? 'liked' : 'commented on'}{' '}
                            <span className="font-medium">"{n.postTitle}"</span>
                          </p>
                          <p className="text-xs text-medium-gray mt-0.5">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-medium-green mt-1.5 flex-shrink-0" />}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Avatar dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}>
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=random`}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover cursor-pointer"
              />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-medium-border rounded shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-medium-border">
                  <p className="text-sm font-medium text-medium-black truncate">{user?.name}</p>
                  <p className="text-xs text-medium-gray truncate">{user?.email}</p>
                </div>
                <Link to={`/profile/${user?._id}`} onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-medium-black hover:bg-gray-50">Profile</Link>
                <Link to="/library" onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-medium-black hover:bg-gray-50">Library</Link>
                <Link to="/my-stories" onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-medium-black hover:bg-gray-50">Stories</Link>
                <Link to="/stats" onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-medium-black hover:bg-gray-50">Stats</Link>
                <Link to="/write" onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-medium-black hover:bg-gray-50 sm:hidden">Write</Link>
                {user?.isAdmin && (
                  <Link to="/admin" onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-medium-black hover:bg-gray-50">Admin Dashboard</Link>
                )}
                <div className="border-t border-medium-border mt-1 pt-1">
                  <button
                    onClick={() => { logout(); setDropdownOpen(false); navigate('/'); }}
                    className="block w-full text-left px-4 py-2 text-sm text-medium-gray hover:bg-gray-50"
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
          <aside className="hidden md:flex flex-col w-56 lg:w-64 border-r border-medium-border flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
            <SidebarContent onClose={undefined} />
          </aside>
        )}

        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="w-64 bg-white border-r border-medium-border h-full shadow-2xl flex flex-col overflow-y-auto">
              {/* Mobile header */}
              <div className="flex items-center justify-between px-4 h-14 border-b border-medium-border flex-shrink-0">
                <Link to="/" onClick={() => setMobileOpen(false)}
                  className="font-bold font-serif text-medium-black text-lg">
                  Just Like Medium
                </Link>
                <button onClick={() => setMobileOpen(false)}
                  className="p-1.5 text-medium-gray hover:text-medium-black transition">
                  <FiX className="text-xl" />
                </button>
              </div>
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </div>
            <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

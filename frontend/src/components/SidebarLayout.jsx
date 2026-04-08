import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import {
  FiHome, FiBookmark, FiUser, FiFileText, FiBarChart2,
  FiUserPlus, FiEdit, FiBell, FiSearch, FiMenu, FiX,
  FiChevronLeft, FiChevronRight, FiHeart, FiMessageCircle
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const NavItem = ({ to, icon: Icon, label, active, collapsed }) => (
  <Link
    to={to}
    title={collapsed ? label : undefined}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors w-full ${
      active ? 'text-medium-black font-semibold' : 'text-medium-gray hover:text-medium-black'
    } ${collapsed ? 'justify-center px-2' : ''}`}
  >
    <Icon className={`text-lg flex-shrink-0 ${active ? 'text-medium-black' : 'text-medium-gray'}`} />
    {!collapsed && <span>{label}</span>}
  </Link>
);

export default function SidebarLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);
  const dropdownRef = useRef(null);

  const path = location.pathname;

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/?search=${encodeURIComponent(search.trim())}`);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    if (next) fetchNotifications();
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const DesktopSidebar = () => (
    <div className={`flex flex-col h-full bg-white transition-all duration-200 ${collapsed ? 'px-2 py-6' : 'px-4 py-6'}`}>
      {/* Logo / collapse toggle */}
      <div className={`flex items-center mb-8 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <Link to="/" className="text-xl font-bold font-serif text-medium-black leading-tight">
            Just Like<br />Medium
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-medium-gray hover:text-medium-black hover:bg-gray-100 transition"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <FiChevronRight className="text-lg" /> : <FiChevronLeft className="text-lg" />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1">
        <NavItem to="/" icon={FiHome} label="Home" active={path === '/'} collapsed={collapsed} />
        <NavItem to="/library" icon={FiBookmark} label="Library" active={path === '/library'} collapsed={collapsed} />
        <NavItem to={`/profile/${user?._id}`} icon={FiUser} label="Profile" active={path.startsWith('/profile')} collapsed={collapsed} />
        <NavItem to="/my-stories" icon={FiFileText} label="Stories" active={path === '/my-stories'} collapsed={collapsed} />
        <NavItem to="/stats" icon={FiBarChart2} label="Stats" active={path === '/stats'} collapsed={collapsed} />

        <div className="my-3 border-t border-medium-border" />

        <NavItem to="/following" icon={FiUserPlus} label="Following" active={path === '/following'} collapsed={collapsed} />

        {!collapsed && (
          <div className="mt-2 px-3">
            <p className="text-xs text-medium-gray leading-relaxed">
              Find writers and publications to follow.
            </p>
            <Link to="/following" className="text-xs text-medium-gray hover:text-medium-black underline mt-1 block">
              See suggestions
            </Link>
          </div>
        )}
      </nav>

      {/* Write button */}
      <div className="mt-6 pt-4 border-t border-medium-border">
        <Link
          to="/write"
          title={collapsed ? 'Write a story' : undefined}
          className={`flex items-center gap-2 text-sm text-medium-gray hover:text-medium-black transition ${collapsed ? 'justify-center' : ''}`}
        >
          <FiEdit className="text-base flex-shrink-0" />
          {!collapsed && <span>Write a story</span>}
        </Link>
      </div>
    </div>
  );

  const MobileSidebar = () => (
    <div className="flex flex-col h-full bg-white p-4">
      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="text-xl font-bold font-serif text-medium-black leading-tight">
          Just Like<br />Medium
        </Link>
        <button onClick={() => setSidebarOpen(false)}>
          <FiX className="text-xl text-medium-gray" />
        </button>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        <NavItem to="/" icon={FiHome} label="Home" active={path === '/'} />
        <NavItem to="/library" icon={FiBookmark} label="Library" active={path === '/library'} />
        <NavItem to={`/profile/${user?._id}`} icon={FiUser} label="Profile" active={path.startsWith('/profile')} />
        <NavItem to="/my-stories" icon={FiFileText} label="Stories" active={path === '/my-stories'} />
        <NavItem to="/stats" icon={FiBarChart2} label="Stats" active={path === '/stats'} />
        <div className="my-3 border-t border-medium-border" />
        <NavItem to="/following" icon={FiUserPlus} label="Following" active={path === '/following'} />
      </nav>
      <div className="mt-6 pt-4 border-t border-medium-border">
        <Link to="/write" className="flex items-center gap-2 text-sm text-medium-gray hover:text-medium-black transition">
          <FiEdit className="text-base" />
          <span>Write a story</span>
        </Link>
      </div>
    </div>
  );

  const sidebarWidth = collapsed ? 'w-16' : 'w-56 lg:w-64';
  const contentMargin = collapsed ? 'md:ml-16' : 'md:ml-56 lg:ml-64';

  return (
    <div className="min-h-screen bg-white flex">
      {/* Fixed left sidebar (desktop) */}
      <aside className={`hidden md:flex flex-col ${sidebarWidth} border-r border-medium-border fixed left-0 top-0 h-full z-40 transition-all duration-200`}>
        <DesktopSidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-white border-r border-medium-border h-full shadow-xl">
            <MobileSidebar />
          </div>
          <div className="flex-1 bg-black/30" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 ${contentMargin} flex flex-col min-h-screen transition-all duration-200`}>
        {/* Top navbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-medium-border">
          <div className="flex items-center justify-between px-4 md:px-8 h-14 gap-4">
            {/* Left: hamburger (mobile only) */}
            <button
              className="md:hidden text-medium-gray hover:text-medium-black"
              onClick={() => setSidebarOpen(true)}
            >
              <FiMenu className="text-xl" />
            </button>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xs">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-medium-gray text-sm" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search"
                  className="w-full bg-gray-100 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:bg-gray-200 transition"
                />
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <Link
                to="/write"
                className="hidden sm:flex items-center gap-1.5 text-sm text-medium-gray hover:text-medium-black transition"
              >
                <FiEdit className="text-base" />
                <span>Write</span>
              </Link>

              {/* Notifications bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={handleBellClick}
                  className="relative hidden sm:block text-medium-gray hover:text-medium-black transition"
                >
                  <FiBell className="text-xl" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
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
                        <div className="px-4 py-8 text-center text-medium-gray text-sm">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map(n => (
                          <Link
                            key={n._id}
                            to={n.postSlug ? `/article/${n.postSlug}` : '#'}
                            onClick={() => setNotifOpen(false)}
                            className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-medium-border last:border-0 ${!n.read ? 'bg-blue-50/40' : ''}`}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              {n.type === 'like' ? (
                                <FiHeart className="text-red-500 text-base" />
                              ) : (
                                <FiMessageCircle className="text-medium-green text-base" />
                              )}
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
                <button onClick={() => setDropdownOpen(!dropdownOpen)}>
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
                    <Link to="/my-stories" onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-medium-black hover:bg-gray-50">Stories</Link>
                    <Link to="/stats" onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-medium-black hover:bg-gray-50">Stats</Link>
                    <Link to="/library" onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-medium-black hover:bg-gray-50">Library</Link>
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
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

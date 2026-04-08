import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiBookmark, FiUser, FiFileText, FiBarChart2,
  FiUserPlus, FiEdit, FiBell, FiSearch, FiMenu, FiX, FiPlus
} from 'react-icons/fi';

const NavItem = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors w-full ${
      active
        ? 'text-medium-black font-semibold'
        : 'text-medium-gray hover:text-medium-black'
    }`}
  >
    <Icon className={`text-lg flex-shrink-0 ${active ? 'text-medium-black' : 'text-medium-gray'}`} />
    <span>{label}</span>
  </Link>
);

export default function SidebarLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const path = location.pathname;

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/?search=${encodeURIComponent(search.trim())}`);
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full bg-white ${mobile ? 'p-4' : 'px-4 py-6'}`}>
      {/* Logo */}
      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="text-2xl font-bold font-serif text-medium-black">
          Just Like<br />Medium
        </Link>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)}>
            <FiX className="text-xl text-medium-gray" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1">
        <NavItem to="/" icon={FiHome} label="Home" active={path === '/'} />
        <NavItem to="/library" icon={FiBookmark} label="Library" active={path === '/library'} />
        <NavItem to={`/profile/${user?._id}`} icon={FiUser} label="Profile" active={path.startsWith('/profile')} />
        <NavItem to="/my-stories" icon={FiFileText} label="Stories" active={path === '/my-stories'} />
        <NavItem to="/stats" icon={FiBarChart2} label="Stats" active={path === '/stats'} />

        <div className="my-3 border-t border-medium-border" />

        <NavItem to="/following" icon={FiUserPlus} label="Following" active={path === '/following'} />

        <div className="mt-2 px-3">
          <p className="text-xs text-medium-gray leading-relaxed">
            Find writers and publications to follow.
          </p>
          <Link to="/following" className="text-xs text-medium-gray hover:text-medium-black underline mt-1 block">
            See suggestions
          </Link>
        </div>
      </nav>

      {/* Write button */}
      <div className="mt-6 pt-4 border-t border-medium-border">
        <Link
          to="/write"
          className="flex items-center gap-2 text-sm text-medium-gray hover:text-medium-black transition"
        >
          <FiEdit className="text-base" />
          <span>Write a story</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex">
      {/* Fixed left sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-56 lg:w-64 border-r border-medium-border fixed left-0 top-0 h-full z-40">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-white border-r border-medium-border h-full shadow-xl">
            <Sidebar mobile />
          </div>
          <div className="flex-1 bg-black/30" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-56 lg:ml-64 flex flex-col min-h-screen">
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

              <FiBell className="text-xl text-medium-gray hover:text-medium-black cursor-pointer transition hidden sm:block" />

              {/* Avatar dropdown */}
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)}>
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=random`}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full object-cover cursor-pointer"
                  />
                </button>
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white border border-medium-border rounded shadow-lg py-1 z-50"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
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

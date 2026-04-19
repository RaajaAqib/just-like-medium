import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiEdit, FiSearch, FiSun, FiMoon } from 'react-icons/fi';

export default function Navbar({ variant = 'default' }) {
  const { user, logout } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchOpen(false);
    }
  };

  if (variant === 'hero') {
    return (
      <nav className="border-b border-medium-black bg-cream dark:bg-gray-900 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="text-xl sm:text-3xl font-bold font-serif text-medium-black dark:text-gray-100 tracking-tight">
            Dynamic Lab
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/our-story" className="text-sm text-medium-black dark:text-gray-300 hover:text-medium-gray hidden md:block transition">Our story</Link>
            <Link to="/our-story" className="text-sm text-medium-black dark:text-gray-300 hover:text-medium-gray hidden md:block transition">Membership</Link>
            <button onClick={toggleTheme} className="p-1.5 text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100 transition" aria-label="Toggle theme">
              {dark ? <FiSun className="text-lg" /> : <FiMoon className="text-lg" />}
            </button>
            {user ? (
              <>
                <Link to="/write" className="text-sm text-medium-black dark:text-gray-300 hover:text-medium-gray transition hidden sm:block">Write</Link>
                <Link to="/" className="btn-black text-sm px-4 py-2">Start reading</Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-medium-black dark:text-gray-300 hover:text-medium-gray transition">Sign in</Link>
                <Link to="/register" className="btn-black text-sm px-4 py-2">Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-medium-border dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="text-2xl font-bold font-serif text-medium-black dark:text-gray-100 tracking-tight flex-shrink-0">
          Dynamic Lab
        </Link>

        <div className="flex-1 max-w-xs hidden md:block">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex">
              <input autoFocus type="text" value={searchVal} onChange={e => setSearchVal(e.target.value)}
                onBlur={() => !searchVal && setSearchOpen(false)} placeholder="Search..."
                className="w-full bg-gray-100 dark:bg-gray-800 text-medium-black dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-full px-4 py-1.5 text-sm focus:outline-none" />
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 text-sm text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100 transition">
              <FiSearch /><span>Search</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-1.5 text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100 transition" aria-label="Toggle theme">
            {dark ? <FiSun className="text-lg" /> : <FiMoon className="text-lg" />}
          </button>
          {user ? (
            <>
              <Link to="/write" className="hidden sm:flex items-center gap-1.5 text-sm text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100 transition">
                <FiEdit /><span>Write</span>
              </Link>
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="focus:outline-none">
                  <img src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                    alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 rounded shadow-lg border border-medium-border dark:border-gray-700 py-2 z-50"
                    onMouseLeave={() => setDropdownOpen(false)}>
                    <div className="px-4 py-2 border-b border-medium-border dark:border-gray-700 mb-1">
                      <p className="text-sm font-medium text-medium-black dark:text-gray-100 truncate">{user.name}</p>
                      <p className="text-xs text-medium-gray dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link to={`/profile/${user._id}`} onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Profile</Link>
                    <Link to="/write" onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 sm:hidden">Write a story</Link>
                    {user.isAdmin && (
                      <Link to="/admin" onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Admin Dashboard</Link>
                    )}
                    <div className="border-t border-medium-border dark:border-gray-700 mt-1 pt-1">
                      <button onClick={() => { logout(); setDropdownOpen(false); navigate('/'); }}
                        className="block w-full text-left px-4 py-2 text-sm text-medium-gray dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">Sign out</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-medium-black dark:text-gray-300 hover:text-medium-gray transition">Sign in</Link>
              <Link to="/register" className="btn-black">Get started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

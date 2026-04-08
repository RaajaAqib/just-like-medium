import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiEdit, FiSearch } from 'react-icons/fi';

export default function Navbar({ variant = 'default' }) {
  const { user, logout } = useAuth();
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

  // Hero variant (landing page) — cream background, bordered bottom
  if (variant === 'hero') {
    return (
      <nav className="border-b border-medium-black bg-cream">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-3xl font-bold font-serif text-medium-black tracking-tight">
            Just Like Medium
          </Link>
          <div className="flex items-center gap-5">
            <Link to="/" className="text-sm text-medium-black hover:text-medium-gray hidden md:block transition">Our story</Link>
            <Link to="/" className="text-sm text-medium-black hover:text-medium-gray hidden md:block transition">Membership</Link>
            {user ? (
              <>
                <Link to="/write" className="text-sm text-medium-black hover:text-medium-gray transition">Write</Link>
                <Link to="/" className="btn-black text-sm">Start reading</Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-medium-black hover:text-medium-gray transition">Sign in</Link>
                <Link to="/register" className="btn-black">Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    );
  }

  // Default variant — white background for inner pages
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-medium-border">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold font-serif text-medium-black tracking-tight flex-shrink-0">
          Just Like Medium
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-xs hidden md:block">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex">
              <input
                autoFocus
                type="text"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                onBlur={() => !searchVal && setSearchOpen(false)}
                placeholder="Search..."
                className="w-full bg-gray-100 rounded-full px-4 py-1.5 text-sm focus:outline-none"
              />
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 text-sm text-medium-gray hover:text-medium-black transition"
            >
              <FiSearch />
              <span>Search</span>
            </button>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/write" className="hidden sm:flex items-center gap-1.5 text-sm text-medium-gray hover:text-medium-black transition">
                <FiEdit />
                <span>Write</span>
              </Link>

              {/* Avatar + dropdown */}
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="focus:outline-none">
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-3 w-56 bg-white rounded shadow-lg border border-medium-border py-2 z-50"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-medium-border mb-1">
                      <p className="text-sm font-medium text-medium-black truncate">{user.name}</p>
                      <p className="text-xs text-medium-gray truncate">{user.email}</p>
                    </div>
                    <Link to={`/profile/${user._id}`} onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-medium-black hover:bg-gray-50">
                      Profile
                    </Link>
                    <Link to="/write" onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-medium-black hover:bg-gray-50 sm:hidden">
                      Write a story
                    </Link>
                    {user.isAdmin && (
                      <Link to="/admin" onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-medium-black hover:bg-gray-50">
                        Admin Dashboard
                      </Link>
                    )}
                    <div className="border-t border-medium-border mt-1 pt-1">
                      <button
                        onClick={() => { logout(); setDropdownOpen(false); navigate('/'); }}
                        className="block w-full text-left px-4 py-2 text-sm text-medium-gray hover:bg-gray-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-medium-black hover:text-medium-gray transition">Sign in</Link>
              <Link to="/register" className="btn-black">Get started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

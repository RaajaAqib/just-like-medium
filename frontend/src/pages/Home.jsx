import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import SidebarLayout from '../components/SidebarLayout';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/axios';

const TAGS = ['Technology', 'Programming', 'Design', 'Science', 'Culture', 'AI', 'Startup', 'Health', 'Travel', 'Food'];

// SVG Illustration for hero
const HeroIllustration = () => (
  <svg viewBox="0 0 400 300" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="280" cy="80" r="70" fill="#1a8917" opacity="0.9"/>
    <circle cx="340" cy="60" r="45" fill="#1a8917" opacity="0.7"/>
    <circle cx="230" cy="50" r="30" fill="#1a8917" opacity="0.5"/>
    <rect x="180" y="160" width="180" height="120" fill="#1a8917" opacity="0.85" rx="2"/>
    <line x1="180" y1="200" x2="360" y2="130" stroke="#242424" strokeWidth="1.5"/>
    <line x1="180" y1="220" x2="360" y2="150" stroke="#242424" strokeWidth="1"/>
    <circle cx="360" cy="130" r="4" fill="#242424"/>
    <circle cx="180" cy="200" r="4" fill="#242424"/>
    <rect x="50" y="180" width="100" height="8" fill="#242424" opacity="0.15" rx="4"/>
    <rect x="50" y="196" width="75" height="6" fill="#242424" opacity="0.1" rx="3"/>
    <rect x="50" y="210" width="88" height="6" fill="#242424" opacity="0.1" rx="3"/>
    <circle cx="80" cy="240" r="20" fill="#242424" opacity="0.08"/>
    <text x="220" y="215" fill="white" fontSize="12" fontFamily="Georgia" fontWeight="bold">Stories</text>
    <text x="210" y="235" fill="white" fontSize="10" fontFamily="Georgia">&amp; Ideas</text>
  </svg>
);

// Trending section for landing
function TrendingFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/posts?limit=6').then(r => setPosts(r.data.posts || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="py-12"><LoadingSpinner /></div>;
  if (!posts.length) return null;
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center gap-2 mb-8">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
        </svg>
        <span className="text-sm font-bold text-medium-black uppercase tracking-widest">Trending on Just Like Medium</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post, i) => (
          <Link to={`/article/${post.slug}`} key={post._id} className="flex gap-4 group">
            <span className="text-3xl font-bold text-gray-200 leading-none select-none w-8 flex-shrink-0 mt-1">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <img src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name||'A')}&background=random&size=20`}
                  alt={post.author?.name} className="w-5 h-5 rounded-full object-cover"/>
                <span className="text-xs font-medium text-medium-black">{post.author?.name}</span>
              </div>
              <h3 className="text-sm font-bold text-medium-black leading-snug line-clamp-2 group-hover:underline decoration-1 underline-offset-2">
                {post.title}
              </h3>
              <p className="text-xs text-medium-gray mt-1">{post.readTime} min read · {post.views} views</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Guest landing page
function LandingPage() {
  return (
    <div className="bg-cream min-h-screen flex flex-col">
      <Navbar variant="hero" />
      <div className="border-b border-medium-black flex-1">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 md:py-24 flex items-center justify-between gap-8">
          <div className="flex-1 max-w-2xl">
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold font-serif text-medium-black leading-none mb-6 md:mb-8 tracking-tight">
              Human<br />stories &amp;<br />ideas
            </h1>
            <p className="text-base sm:text-xl text-medium-black mb-8">A place to read, write, and deepen your understanding.</p>
            <Link to="/register" className="inline-block bg-medium-black text-white text-sm sm:text-base px-6 sm:px-8 py-2.5 sm:py-3 rounded-full hover:bg-gray-700 transition-colors">
              Start reading
            </Link>
          </div>
          <div className="hidden md:flex flex-1 max-w-lg h-64 md:h-80 items-center justify-center">
            <HeroIllustration />
          </div>
        </div>
      </div>
      <TrendingFeed />
      <footer className="border-t border-medium-border py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap gap-4 text-xs text-medium-gray">
          {['Help','Status','About','Careers','Blog','Privacy','Terms'].map(l => (
            <Link key={l} to="/our-story" className="hover:text-medium-black transition">{l}</Link>
          ))}
          <span>Text to speech</span>
        </div>
      </footer>
    </div>
  );
}

// Logged-in feed
function LoggedInFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('foryou');
  const [savedPostIds, setSavedPostIds] = useState(new Set());
  const [searchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const tag = searchParams.get('tag') || '';

  // Fetch user's saved post IDs once
  useEffect(() => {
    if (!user) return;
    api.get('/users/me/saved')
      .then(res => {
        const ids = (res.data.savedPosts || []).map(p => p._id);
        setSavedPostIds(new Set(ids));
      })
      .catch(() => {});
  }, [user]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set('search', search);
      if (tag) params.set('tag', tag);
      const res = await api.get(`/posts?${params}`);
      setPosts(res.data.posts);
      setTotalPages(res.data.totalPages);
    } catch { setPosts([]); } finally { setLoading(false); }
  }, [page, search, tag]);

  useEffect(() => { setPage(1); }, [search, tag]);
  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  return (
    <SidebarLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 flex gap-10">
        {/* Feed */}
        <div className="flex-1 min-w-0 max-w-2xl">
          {/* Tabs */}
          {!search && !tag && (
            <div className="flex items-center gap-6 border-b border-medium-border mb-2 -mx-1 px-1">
              {[['foryou','For you'],['following','Following']].map(([val, label]) => (
                <button key={val} onClick={() => setActiveTab(val)}
                  className={`pb-3 text-sm font-medium transition border-b-2 -mb-px ${activeTab === val ? 'border-medium-black text-medium-black' : 'border-transparent text-medium-gray hover:text-medium-black'}`}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Tag strip */}
          <div className="flex items-center gap-1 overflow-x-auto py-3 mb-2 border-b border-medium-border">
            <Link to="/" className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-full transition whitespace-nowrap ${!tag && !search ? 'bg-medium-black text-white' : 'text-medium-gray hover:bg-gray-100 hover:text-medium-black'}`}>
              All
            </Link>
            {TAGS.map(t => (
              <Link key={t} to={`/?tag=${t.toLowerCase()}`}
                className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-full transition whitespace-nowrap ${tag === t.toLowerCase() ? 'bg-medium-black text-white' : 'text-medium-gray hover:bg-gray-100 hover:text-medium-black'}`}>
                {t}
              </Link>
            ))}
          </div>

          {(search || tag) && (
            <div className="flex items-center gap-2 mb-4 mt-2">
              <span className="text-sm text-medium-gray">{search ? `Results for "${search}"` : `Topic: ${tag}`}</span>
              <Link to="/" className="text-xs text-medium-gray hover:text-medium-black underline">Clear</Link>
            </div>
          )}

          {loading ? <LoadingSpinner /> : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-medium-gray text-lg mb-3">No stories found</p>
              <Link to="/" className="text-medium-green hover:underline text-sm">Browse all stories</Link>
            </div>
          ) : (
            <>
              {posts.map(post => <PostCard key={post._id} post={post} initialSaved={savedPostIds.has(post._id)} />)}
              {totalPages > 1 && (
                <div className="flex justify-center gap-3 mt-10 pt-6 border-t border-medium-border">
                  <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                    className="px-4 py-2 text-sm border border-medium-border rounded-full disabled:opacity-40 hover:border-medium-black transition">← Previous</button>
                  <span className="px-4 py-2 text-sm text-medium-gray">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                    className="px-4 py-2 text-sm border border-medium-border rounded-full disabled:opacity-40 hover:border-medium-black transition">Next →</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-24 space-y-8">
            {/* Staff picks style */}
            <div>
              <h3 className="text-sm font-semibold text-medium-black mb-4">Staff Picks</h3>
              {loading ? null : posts.slice(0, 3).map(post => (
                <Link key={post._id} to={`/article/${post.slug}`} className="flex items-start gap-3 mb-4 group">
                  <img src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name||'A')}&background=random&size=32`}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt={post.author?.name}/>
                  <div>
                    <p className="text-xs text-medium-black font-medium">{post.author?.name}</p>
                    <p className="text-sm font-bold text-medium-black leading-snug line-clamp-2 group-hover:underline">{post.title}</p>
                    <p className="text-xs text-medium-gray mt-0.5">{post.readTime} min read</p>
                  </div>
                </Link>
              ))}
              {posts.length > 3 && <Link to="/" className="text-sm text-medium-green hover:underline">See the full list</Link>}
            </div>

            {/* Recommended topics */}
            <div className="border-t border-medium-border pt-6">
              <h3 className="text-sm font-semibold text-medium-black mb-4">Recommended topics</h3>
              <div className="flex flex-wrap gap-2">
                {TAGS.map(t => (
                  <Link key={t} to={`/?tag=${t.toLowerCase()}`}
                    className={`text-sm px-4 py-2 rounded-full transition ${tag===t.toLowerCase() ? 'bg-medium-black text-white' : 'bg-gray-100 text-medium-black hover:bg-gray-200'}`}>
                    {t}
                  </Link>
                ))}
              </div>
            </div>

            {/* Writing on Medium box */}
            <div className="border-t border-medium-border pt-6">
              <div className="bg-blue-50 rounded-lg p-5">
                <h3 className="font-semibold text-medium-black mb-3">Writing on Just Like Medium</h3>
                <ul className="space-y-2 mb-4">
                  <li className="text-sm text-medium-black hover:underline cursor-pointer">New writer FAQ</li>
                  <li className="text-sm text-medium-black hover:underline cursor-pointer">Expert writing advice</li>
                  <li className="text-sm text-medium-black hover:underline cursor-pointer">Grow your readership</li>
                </ul>
                <Link to="/write" className="btn-black text-sm px-5 py-2 inline-block">Start writing</Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </SidebarLayout>
  );
}

export default function Home() {
  const { user } = useAuth();
  if (user) return <LoggedInFeed />;
  return <LandingPage />;
}

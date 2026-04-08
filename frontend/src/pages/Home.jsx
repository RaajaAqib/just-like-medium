import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/axios';

const TAGS = ['Technology', 'Programming', 'Design', 'Science', 'Culture', 'AI', 'Startup', 'Health', 'Travel', 'Food'];

// Medium-style hero illustration (SVG)
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
    <circle cx="120" cy="255" r="12" fill="#242424" opacity="0.05"/>
    <text x="220" y="215" fill="white" fontSize="12" fontFamily="Georgia" fontWeight="bold">Stories</text>
    <text x="210" y="235" fill="white" fontSize="10" fontFamily="Georgia">&amp; Ideas</text>
    <circle cx="355" cy="240" r="15" fill="#242424" opacity="0.06"/>
    <circle cx="375" cy="255" r="8" fill="#242424" opacity="0.04"/>
  </svg>
);

// Landing page for guests
function LandingHero() {
  const navigate = useNavigate();
  return (
    <div className="bg-cream min-h-screen flex flex-col">
      <Navbar variant="hero" />

      {/* Hero */}
      <div className="border-b border-medium-black">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 flex items-center justify-between gap-12">
          <div className="flex-1 max-w-2xl">
            <h1 className="text-6xl md:text-8xl font-bold font-serif text-medium-black leading-none mb-8 tracking-tight">
              Human<br />stories &amp;<br />ideas
            </h1>
            <p className="text-xl text-medium-black mb-10">
              A place to read, write, and deepen your understanding.
            </p>
            <Link to="/register" className="inline-block bg-medium-black text-white text-base px-8 py-3 rounded-full hover:bg-gray-700 transition-colors">
              Start reading
            </Link>
          </div>
          <div className="hidden md:flex flex-1 max-w-lg h-64 md:h-80 items-center justify-center">
            <HeroIllustration />
          </div>
        </div>
      </div>

      {/* Trending section */}
      <TrendingFeed />

      {/* Footer */}
      <footer className="border-t border-medium-border mt-auto py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap gap-4 text-xs text-medium-gray">
          {['Help', 'Status', 'About', 'Careers', 'Blog', 'Privacy', 'Terms', 'Text to speech'].map(l => (
            <span key={l} className="hover:text-medium-black cursor-pointer transition">{l}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}

// Trending posts for landing page
function TrendingFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/posts?limit=6')
      .then(r => setPosts(r.data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20"><LoadingSpinner /></div>;
  if (!posts.length) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center gap-2 mb-8">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
        <span className="text-sm font-bold text-medium-black uppercase tracking-wide">Trending on Just Like Medium</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post, i) => (
          <Link to={`/article/${post.slug}`} key={post._id} className="flex gap-4 group">
            <span className="text-3xl font-bold text-gray-200 leading-none select-none w-8 flex-shrink-0">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <img
                  src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'A')}&background=random&size=20`}
                  alt={post.author?.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-xs font-medium text-medium-black">{post.author?.name}</span>
              </div>
              <h3 className="text-sm font-bold text-medium-black leading-snug line-clamp-2 group-hover:underline decoration-1 underline-offset-2">
                {post.title}
              </h3>
              <p className="text-xs text-medium-gray mt-1">{post.readTime} min read</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Main feed for logged-in users
function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const tag = searchParams.get('tag') || '';

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set('search', search);
      if (tag) params.set('tag', tag);
      const res = await api.get(`/posts?${params}`);
      setPosts(res.data.posts);
      setTotalPages(res.data.totalPages);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, tag]);

  useEffect(() => { setPage(1); }, [search, tag]);
  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />

      {/* Tag strip */}
      <div className="border-b border-medium-border sticky top-14 z-40 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
            <Link to="/" className={`flex-shrink-0 px-3 py-2 text-sm rounded-full transition whitespace-nowrap ${!tag && !search ? 'text-medium-black font-medium border-b-2 border-medium-black rounded-none' : 'text-medium-gray hover:text-medium-black hover:bg-gray-100 rounded-full'}`}>
              For you
            </Link>
            {TAGS.map(t => (
              <Link
                key={t}
                to={`/?tag=${t.toLowerCase()}`}
                className={`flex-shrink-0 px-3 py-2 text-sm transition whitespace-nowrap ${tag === t.toLowerCase() ? 'text-medium-black font-medium border-b-2 border-medium-black rounded-none' : 'text-medium-gray hover:text-medium-black hover:bg-gray-100 rounded-full'}`}
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 w-full flex gap-12">
        {/* Main feed */}
        <main className="flex-1 min-w-0 max-w-2xl">
          {(search || tag) && (
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-medium-gray">
                {search ? `Results for "${search}"` : `Topic: ${tag}`}
              </span>
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
              {posts.map(post => <PostCard key={post._id} post={post} />)}
              {totalPages > 1 && (
                <div className="flex justify-center gap-3 mt-10 pt-6 border-t border-medium-border">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-4 py-2 text-sm text-medium-black border border-medium-border rounded-full disabled:opacity-40 hover:border-medium-black transition">
                    ← Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-medium-gray">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-4 py-2 text-sm text-medium-black border border-medium-border rounded-full disabled:opacity-40 hover:border-medium-black transition">
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {/* Sidebar */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-32">
            <h3 className="text-xs font-medium text-medium-black mb-4">Recommended topics</h3>
            <div className="flex flex-wrap gap-2 mb-8">
              {TAGS.map(t => (
                <Link key={t} to={`/?tag=${t.toLowerCase()}`}
                  className={`text-sm px-4 py-2 rounded-full transition ${tag === t.toLowerCase() ? 'bg-medium-black text-white' : 'bg-gray-100 text-medium-black hover:bg-gray-200'}`}>
                  {t}
                </Link>
              ))}
            </div>

            <div className="border-t border-medium-border pt-6">
              <h3 className="text-xs font-medium text-medium-black mb-4">Who to follow</h3>
              <p className="text-xs text-medium-gray leading-relaxed">
                Just Like Medium is a place to read, write, and deepen your understanding of the topics that matter most to you.
              </p>
              <Link to="/register" className="mt-4 inline-block text-sm text-medium-green hover:underline">
                See more suggestions
              </Link>
            </div>

            <div className="border-t border-medium-border mt-6 pt-4">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {['Help', 'Status', 'About', 'Privacy', 'Terms'].map(l => (
                  <span key={l} className="text-xs text-medium-gray hover:text-medium-black cursor-pointer">{l}</span>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Show feed for logged-in users OR when searching/filtering
  if (user || searchParams.get('search') || searchParams.get('tag')) {
    return <Feed />;
  }

  return <LandingHero />;
}

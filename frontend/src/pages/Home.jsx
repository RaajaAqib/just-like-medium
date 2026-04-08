import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/axios';

const POPULAR_TAGS = ['technology', 'programming', 'design', 'life', 'startup', 'ai', 'javascript', 'python'];

export default function Home() {
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

  useEffect(() => {
    setPage(1);
  }, [search, tag]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
      {/* Main feed */}
      <main className="flex-1 min-w-0">
        {/* Active filter banner */}
        {(search || tag) && (
          <div className="mb-6 flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {search ? `Results for "${search}"` : `Posts tagged "${tag}"`}
            </span>
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-700 underline">Clear</Link>
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-3">No posts found</p>
            <Link to="/" className="text-green-600 hover:underline text-sm">Browse all posts</Link>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-full disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-500">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-full disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-20">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Recommended Topics
          </h3>
          <div className="flex flex-wrap gap-2 mb-8">
            {POPULAR_TAGS.map((t) => (
              <Link
                key={t}
                to={`/?tag=${t}`}
                className={`text-sm px-3 py-1.5 rounded-full transition ${
                  tag === t
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t}
              </Link>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-6">
            <p className="text-xs text-gray-400 leading-relaxed">
              Just Like Medium is a place to read, write, and deepen your understanding of topics that matter to you.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

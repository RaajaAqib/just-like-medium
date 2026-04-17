import { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { FiBookmark, FiClock, FiPlus, FiLock, FiMessageCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';

const TABS = [
  { key: 'lists',    label: 'Your lists' },
  { key: 'saved',    label: 'Saved lists' },
  { key: 'history',  label: 'Reading history' },
  { key: 'responses',label: 'Responses' },
];

// Small cover collage from an array of cover images (up to 3)
function CoverCollage({ images }) {
  const imgs = images.filter(Boolean).slice(0, 3);
  if (imgs.length === 0) {
    return (
      <div className="w-24 h-16 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
        <FiBookmark className="text-gray-400 dark:text-gray-600 text-xl" />
      </div>
    );
  }
  if (imgs.length === 1) {
    return (
      <img src={imgs[0]} alt="" className="w-24 h-16 object-cover rounded flex-shrink-0" />
    );
  }
  return (
    <div className="w-24 h-16 rounded overflow-hidden flex gap-0.5 flex-shrink-0">
      <img src={imgs[0]} alt="" className="flex-1 h-full object-cover" />
      <div className="flex flex-col gap-0.5 w-1/2">
        {imgs.slice(1).map((src, i) => (
          <img key={i} src={src} alt="" className="flex-1 w-full object-cover" />
        ))}
      </div>
    </div>
  );
}

export default function Library() {
  const [savedPosts, setSavedPosts]       = useState([]);
  const [history, setHistory]             = useState([]);
  const [responses, setResponses]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [historyLoading, setHistoryLoading]   = useState(false);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [activeTab, setActiveTab]         = useState('lists');

  // Always load saved posts (needed for "Your lists" card too)
  useEffect(() => {
    api.get('/users/me/saved')
      .then(res => setSavedPosts(res.data.savedPosts || []))
      .catch(() => toast.error('Failed to load library'))
      .finally(() => setLoading(false));
  }, []);

  // Lazy-load history on first visit to that tab
  useEffect(() => {
    if (activeTab !== 'history' || history.length > 0) return;
    setHistoryLoading(true);
    api.get('/users/me/history')
      .then(res => setHistory(res.data.history || []))
      .catch(() => toast.error('Failed to load reading history'))
      .finally(() => setHistoryLoading(false));
  }, [activeTab]);

  // Lazy-load responses on first visit to that tab
  useEffect(() => {
    if (activeTab !== 'responses' || responses.length > 0) return;
    setResponsesLoading(true);
    api.get('/users/me/responses')
      .then(res => setResponses(res.data.responses || []))
      .catch(() => toast.error('Failed to load responses'))
      .finally(() => setResponsesLoading(false));
  }, [activeTab]);

  const handleUnsave = async (postId) => {
    try {
      await api.post(`/users/save-post/${postId}`);
      setSavedPosts(savedPosts.filter(p => p._id !== postId));
      toast.success('Removed from library');
    } catch { toast.error('Failed to unsave'); }
  };

  // Cover images from saved posts for the reading list card collage
  const savedCovers = savedPosts.map(p => p.coverImage).filter(Boolean);

  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold font-serif text-medium-black dark:text-gray-100">Your library</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-medium-border dark:border-gray-700 mb-8 overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`pb-3 px-1 mr-6 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap flex-shrink-0 ${
                activeTab === t.key
                  ? 'border-medium-black dark:border-gray-200 text-medium-black dark:text-gray-100'
                  : 'border-transparent text-medium-gray dark:text-gray-500 hover:text-medium-black dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            {/* ── Your lists ── */}
            {activeTab === 'lists' && (
              <div className="space-y-4">

                {/* Create a list CTA */}
                <div className="border border-dashed border-medium-border dark:border-gray-600 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <FiPlus className="text-green-600 dark:text-green-400 text-xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-medium-black dark:text-gray-100 group-hover:underline">
                      Create a new list
                    </p>
                    <p className="text-sm text-medium-gray dark:text-gray-400 mt-0.5">
                      Save and organise stories on any topic.
                    </p>
                  </div>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
                    New list
                  </span>
                </div>

                {/* Reading list card */}
                <div className="border border-medium-border dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-sm transition">
                  <div className="flex gap-4 p-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FiLock className="text-medium-gray dark:text-gray-500 text-sm" />
                        <span className="text-xs text-medium-gray dark:text-gray-500">Private</span>
                      </div>
                      <Link to="#" onClick={() => setActiveTab('saved')}
                        className="font-bold text-xl text-medium-black dark:text-gray-100 hover:underline block leading-snug mb-1">
                        Reading list
                      </Link>
                      <p className="text-sm text-medium-gray dark:text-gray-400">
                        {savedPosts.length} {savedPosts.length === 1 ? 'story' : 'stories'}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <CoverCollage images={savedCovers} />
                    </div>
                  </div>
                  <div className="border-t border-medium-border dark:border-gray-700 px-5 py-3 flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab('saved')}
                      className="text-sm text-medium-black dark:text-gray-200 font-medium hover:underline"
                    >
                      View list
                    </button>
                    <span className="text-medium-border dark:text-gray-600">·</span>
                    <span className="text-xs text-medium-gray dark:text-gray-500">
                      Last updated {savedPosts.length > 0
                        ? formatDistanceToNow(new Date(savedPosts[savedPosts.length - 1]?.createdAt || Date.now()), { addSuffix: true })
                        : 'never'}
                    </span>
                  </div>
                </div>

              </div>
            )}

            {/* ── Saved lists (reading list items) ── */}
            {activeTab === 'saved' && (
              savedPosts.length === 0 ? (
                <div className="text-center py-20 border-t border-medium-border dark:border-gray-700">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <FiBookmark className="text-medium-gray dark:text-gray-500 text-2xl" />
                  </div>
                  <p className="text-medium-black dark:text-gray-200 font-medium mb-2">Your reading list is empty</p>
                  <p className="text-medium-gray dark:text-gray-500 text-sm mb-6">
                    Click the bookmark icon on any story to save it here for later.
                  </p>
                  <Link to="/" className="btn-black px-6 py-2 text-sm">Browse stories</Link>
                </div>
              ) : (
                <div className="divide-y divide-medium-border dark:divide-gray-700">
                  {savedPosts.map(post => (
                    <div key={post._id} className="flex gap-4 py-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <img
                            src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'U')}&background=random`}
                            className="w-5 h-5 rounded-full object-cover" alt={post.author?.name} />
                          <span className="text-xs text-medium-gray dark:text-gray-500">{post.author?.name}</span>
                        </div>
                        <Link to={`/article/${post.slug}`}
                          className="font-bold text-medium-black dark:text-gray-100 hover:underline text-base line-clamp-2 leading-snug">
                          {post.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-xs text-medium-gray dark:text-gray-500 flex items-center gap-1">
                            <FiClock className="text-xs" />{post.readTime || 1} min read
                          </span>
                          <span className="text-xs text-medium-gray dark:text-gray-500">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                          </span>
                          <button onClick={() => handleUnsave(post._id)}
                            className="text-xs text-medium-gray dark:text-gray-500 hover:text-red-500 transition ml-auto flex items-center gap-1">
                            <FiBookmark className="text-sm fill-current" />Remove
                          </button>
                        </div>
                      </div>
                      {post.coverImage && (
                        <Link to={`/article/${post.slug}`} className="flex-shrink-0">
                          <img src={post.coverImage} alt={post.title} className="w-24 h-16 object-cover rounded" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── Reading history ── */}
            {activeTab === 'history' && (
              historyLoading ? <LoadingSpinner /> :
              history.length === 0 ? (
                <div className="text-center py-20 border-t border-medium-border dark:border-gray-700">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <FiClock className="text-medium-gray dark:text-gray-500 text-2xl" />
                  </div>
                  <p className="text-medium-black dark:text-gray-200 font-medium mb-2">No reading history yet</p>
                  <p className="text-medium-gray dark:text-gray-500 text-sm mb-6">
                    Stories you open will appear here.
                  </p>
                  <Link to="/" className="btn-black px-6 py-2 text-sm">Browse stories</Link>
                </div>
              ) : (
                <div className="divide-y divide-medium-border dark:divide-gray-700">
                  {history.map(post => (
                    <div key={post._id + post.readAt} className="flex gap-4 py-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <img
                            src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'U')}&background=random`}
                            className="w-5 h-5 rounded-full object-cover" alt={post.author?.name} />
                          <span className="text-xs text-medium-gray dark:text-gray-500">{post.author?.name}</span>
                        </div>
                        <Link to={`/article/${post.slug}`}
                          className="font-bold text-medium-black dark:text-gray-100 hover:underline text-base line-clamp-2 leading-snug">
                          {post.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-medium-gray dark:text-gray-500 flex items-center gap-1">
                            <FiClock className="text-xs" />{post.readTime || 1} min read
                          </span>
                          <span className="text-xs text-medium-gray dark:text-gray-500">
                            Read {formatDistanceToNow(new Date(post.readAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      {post.coverImage && (
                        <Link to={`/article/${post.slug}`} className="flex-shrink-0">
                          <img src={post.coverImage} alt={post.title} className="w-24 h-16 object-cover rounded" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── Responses ── */}
            {activeTab === 'responses' && (
              responsesLoading ? <LoadingSpinner /> :
              responses.length === 0 ? (
                <div className="text-center py-20 border-t border-medium-border dark:border-gray-700">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <FiMessageCircle className="text-medium-gray dark:text-gray-500 text-2xl" />
                  </div>
                  <p className="text-medium-black dark:text-gray-200 font-medium mb-2">No responses yet</p>
                  <p className="text-medium-gray dark:text-gray-500 text-sm mb-6">
                    When you respond to a story, it will show up here.
                  </p>
                  <Link to="/" className="btn-black px-6 py-2 text-sm">Browse stories</Link>
                </div>
              ) : (
                <div className="divide-y divide-medium-border dark:divide-gray-700">
                  {responses.map(comment => (
                    <div key={comment._id} className="py-5">
                      {/* Story this response belongs to */}
                      {comment.post && (
                        <Link to={`/article/${comment.post.slug}`}
                          className="text-xs text-medium-gray dark:text-gray-500 hover:text-medium-black dark:hover:text-gray-300 transition flex items-center gap-1.5 mb-2 group">
                          <FiMessageCircle className="text-xs flex-shrink-0" />
                          <span className="line-clamp-1 group-hover:underline">
                            In response to: <span className="font-medium">{comment.post.title}</span>
                          </span>
                        </Link>
                      )}
                      {/* Comment content */}
                      <p className="text-sm text-medium-black dark:text-gray-200 leading-relaxed line-clamp-3">
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-medium-gray dark:text-gray-500">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                        {comment.likes?.length > 0 && (
                          <span className="text-xs text-medium-gray dark:text-gray-500">
                            {comment.likes.length} {comment.likes.length === 1 ? 'like' : 'likes'}
                          </span>
                        )}
                        {comment.post && (
                          <Link to={`/article/${comment.post.slug}`}
                            className="text-xs text-medium-gray dark:text-gray-500 hover:text-medium-black dark:hover:text-gray-300 underline ml-auto">
                            View
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </SidebarLayout>
  );
}

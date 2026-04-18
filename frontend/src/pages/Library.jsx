import { useState, useEffect, useRef } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { FiBookmark, FiClock, FiPlus, FiLock, FiGlobe, FiMessageCircle, FiTrash2, FiX } from 'react-icons/fi';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';

const TABS = [
  { key: 'lists',     label: 'Your lists' },
  { key: 'saved',     label: 'Saved lists' },
  { key: 'history',   label: 'Reading history' },
  { key: 'responses', label: 'Responses' },
];

// Cover collage from up to 3 images
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
      <div className="w-24 h-16 rounded overflow-hidden bg-white dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
        <img src={imgs[0]} alt="" className="max-w-full max-h-full object-contain block" />
      </div>
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

// Create list modal
function CreateListModal({ onClose, onCreate }) {
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate]     = useState(true);
  const [saving, setSaving]           = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Please enter a list name');
    setSaving(true);
    try {
      const res = await api.post('/lists', { name: name.trim(), description: description.trim(), isPrivate });
      onCreate(res.data.list);
      toast.success('List created!');
      onClose();
    } catch {
      toast.error('Failed to create list');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6 border border-medium-border dark:border-gray-700">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-medium-black dark:text-gray-100 font-serif">Create a new list</h2>
          <button onClick={onClose} className="p-1 text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100 transition">
            <FiX className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-medium-black dark:text-gray-200 mb-1.5">
              List name <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              placeholder="e.g. Design inspiration"
              className="w-full border border-medium-border dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-medium-black dark:text-gray-100 bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-medium-black dark:focus:ring-gray-400 transition"
            />
            <p className="text-xs text-medium-gray dark:text-gray-500 mt-1 text-right">{name.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-medium-black dark:text-gray-200 mb-1.5">
              Description <span className="text-medium-gray dark:text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={280}
              rows={3}
              placeholder="What is this list about?"
              className="w-full border border-medium-border dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-medium-black dark:text-gray-100 bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-medium-black dark:focus:ring-gray-400 transition resize-none"
            />
            <p className="text-xs text-medium-gray dark:text-gray-500 mt-1 text-right">{description.length}/280</p>
          </div>

          {/* Privacy toggle */}
          <div className="flex items-center justify-between py-2 border-t border-medium-border dark:border-gray-700">
            <div className="flex items-center gap-2">
              {isPrivate
                ? <FiLock className="text-medium-gray dark:text-gray-400 text-sm" />
                : <FiGlobe className="text-medium-gray dark:text-gray-400 text-sm" />}
              <div>
                <p className="text-sm font-medium text-medium-black dark:text-gray-200">
                  {isPrivate ? 'Private' : 'Public'}
                </p>
                <p className="text-xs text-medium-gray dark:text-gray-500">
                  {isPrivate ? 'Only you can see this list' : 'Anyone can see this list'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(p => !p)}
              className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${
                isPrivate ? 'bg-gray-300 dark:bg-gray-600' : 'bg-medium-black dark:bg-gray-200'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                isPrivate ? 'translate-x-0' : 'translate-x-5'
              }`} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium border border-medium-border dark:border-gray-600 rounded-full text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving || !name.trim()}
              className="flex-1 px-4 py-2.5 text-sm font-medium bg-medium-black dark:bg-gray-100 text-white dark:text-gray-900 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Creating…' : 'Create list'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Library() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const VALID_TABS = TABS.map(t => t.key);
  const tabParam = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'lists';
  const setActiveTab = (key) => setSearchParams({ tab: key }, { replace: true });

  const [savedPosts, setSavedPosts]           = useState([]);
  const [lists, setLists]                     = useState([]);
  const [savedLists, setSavedLists]           = useState([]);
  const [history, setHistory]                 = useState([]);
  const [responses, setResponses]             = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [listsLoading, setListsLoading]       = useState(false);
  const [historyLoading, setHistoryLoading]   = useState(false);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load saved posts + own lists + saved lists on mount
  useEffect(() => {
    Promise.all([
      api.get('/users/me/saved'),
      api.get('/lists/me'),
      api.get('/lists/me/saved'),
    ]).then(([savedRes, listsRes, savedListsRes]) => {
      setSavedPosts(savedRes.data.savedPosts || []);
      setLists(listsRes.data.lists || []);
      setSavedLists(savedListsRes.data.lists || []);
    }).catch(() => toast.error('Failed to load library'))
      .finally(() => setLoading(false));
  }, []);

  // Lazy-load history
  useEffect(() => {
    if (activeTab !== 'history' || history.length > 0) return;
    setHistoryLoading(true);
    api.get('/users/me/history')
      .then(res => setHistory(res.data.history || []))
      .catch(() => toast.error('Failed to load reading history'))
      .finally(() => setHistoryLoading(false));
  }, [activeTab]);

  // Lazy-load responses
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
      setSavedPosts(prev => prev.filter(p => p._id !== postId));
      toast.success('Removed from library');
    } catch { toast.error('Failed to unsave'); }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Delete this list? This cannot be undone.')) return;
    try {
      await api.delete(`/lists/${listId}`);
      setLists(prev => prev.filter(l => l._id !== listId));
      toast.success('List deleted');
    } catch { toast.error('Failed to delete list'); }
  };

  const handleUnsaveList = async (listId) => {
    try {
      await api.post(`/lists/${listId}/save`);
      setSavedLists(prev => prev.filter(l => l._id !== listId));
      toast.success('List removed from library');
    } catch { toast.error('Failed to unsave list'); }
  };

  const savedCovers = savedPosts.map(p => p.coverImage).filter(Boolean);

  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold font-serif text-medium-black dark:text-gray-100">Your library</h1>
          {activeTab === 'lists' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-white bg-medium-green hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 px-4 py-2 rounded-full transition"
            >
              <FiPlus className="text-base" />
              New list
            </button>
          )}
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

                {/* Create a list CTA (always shown) */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full border border-dashed border-medium-border dark:border-gray-600 rounded-xl p-5 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition group text-left"
                >
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
                </button>

                {/* Reading list card (built-in) */}
                <div className="border border-medium-border dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-sm transition">
                  <div className="flex gap-4 p-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FiLock className="text-medium-gray dark:text-gray-500 text-xs" />
                        <span className="text-xs text-medium-gray dark:text-gray-500">Private</span>
                      </div>
                      <p className="font-bold text-xl text-medium-black dark:text-gray-100 leading-snug mb-1">
                        Reading list
                      </p>
                      <p className="text-sm text-medium-gray dark:text-gray-400">
                        {savedPosts.length} {savedPosts.length === 1 ? 'story' : 'stories'}
                      </p>
                    </div>
                    <CoverCollage images={savedCovers} />
                  </div>
                  <div className="border-t border-medium-border dark:border-gray-700 px-5 py-3 flex items-center gap-3">
                    <button onClick={() => setActiveTab('saved')}
                      className="text-sm text-medium-black dark:text-gray-200 font-medium hover:underline">
                      View list
                    </button>
                    <span className="text-medium-border dark:text-gray-600">·</span>
                    <span className="text-xs text-medium-gray dark:text-gray-500">
                      {savedPosts.length > 0
                        ? `Last updated ${formatDistanceToNow(new Date(savedPosts[0]?.createdAt || Date.now()), { addSuffix: true })}`
                        : 'Empty'}
                    </span>
                  </div>
                </div>

                {/* User-created lists */}
                {lists.map(list => {
                  const covers = (list.posts || []).map(p => p.coverImage).filter(Boolean);
                  return (
                    <div key={list._id} className="border border-medium-border dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-sm transition">
                      <div className="flex gap-4 p-5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {list.isPrivate
                              ? <FiLock className="text-medium-gray dark:text-gray-500 text-xs" />
                              : <FiGlobe className="text-medium-gray dark:text-gray-500 text-xs" />}
                            <span className="text-xs text-medium-gray dark:text-gray-500">
                              {list.isPrivate ? 'Private' : 'Public'}
                            </span>
                          </div>
                          <p className="font-bold text-xl text-medium-black dark:text-gray-100 leading-snug mb-1">
                            {list.name}
                          </p>
                          {list.description && (
                            <p className="text-sm text-medium-gray dark:text-gray-400 line-clamp-2 mb-1">
                              {list.description}
                            </p>
                          )}
                          <p className="text-sm text-medium-gray dark:text-gray-400">
                            {list.posts?.length || 0} {(list.posts?.length || 0) === 1 ? 'story' : 'stories'}
                          </p>
                        </div>
                        <CoverCollage images={covers} />
                      </div>
                      <div className="border-t border-medium-border dark:border-gray-700 px-5 py-3 flex items-center gap-3">
                        <button
                          onClick={() => navigate(`/list/${list._id}`)}
                          className="text-sm text-medium-black dark:text-gray-200 font-medium hover:underline"
                        >
                          View list
                        </button>
                        <span className="text-medium-border dark:text-gray-600">·</span>
                        <span className="text-xs text-medium-gray dark:text-gray-500">
                          Updated {formatDistanceToNow(new Date(list.updatedAt), { addSuffix: true })}
                        </span>
                        <button
                          onClick={() => handleDeleteList(list._id)}
                          className="ml-auto flex items-center gap-1 text-xs text-medium-gray dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition"
                        >
                          <FiTrash2 className="text-sm" />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Lists saved from other users */}
                {savedLists.length > 0 && (
                  <>
                    <div className="pt-4 pb-2">
                      <h2 className="text-lg font-semibold text-medium-black dark:text-gray-100">Lists you've saved</h2>
                      <p className="text-sm text-medium-gray dark:text-gray-500 mt-0.5">Lists from other writers you've saved to your library.</p>
                    </div>
                    {savedLists.map(list => {
                      const covers = (list.posts || []).map(p => p.coverImage).filter(Boolean);
                      return (
                        <div key={list._id} className="border border-medium-border dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-sm transition">
                          <div className="flex gap-4 p-5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {list.owner && (
                                  <>
                                    <img
                                      src={list.owner.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(list.owner.name || 'U')}&background=random`}
                                      className="w-4 h-4 rounded-full object-cover"
                                      alt={list.owner.name}
                                    />
                                    <span className="text-xs text-medium-gray dark:text-gray-500">{list.owner.name}</span>
                                  </>
                                )}
                                <span className="text-xs text-medium-gray dark:text-gray-500">·</span>
                                <FiGlobe className="text-medium-gray dark:text-gray-500 text-xs" />
                                <span className="text-xs text-medium-gray dark:text-gray-500">Public</span>
                              </div>
                              <p className="font-bold text-xl text-medium-black dark:text-gray-100 leading-snug mb-1">
                                {list.name}
                              </p>
                              {list.description && (
                                <p className="text-sm text-medium-gray dark:text-gray-400 line-clamp-2 mb-1">
                                  {list.description}
                                </p>
                              )}
                              <p className="text-sm text-medium-gray dark:text-gray-400">
                                {list.posts?.length || 0} {(list.posts?.length || 0) === 1 ? 'story' : 'stories'}
                              </p>
                            </div>
                            <CoverCollage images={covers} />
                          </div>
                          <div className="border-t border-medium-border dark:border-gray-700 px-5 py-3 flex items-center gap-3">
                            <button
                              onClick={() => navigate(`/list/${list._id}`)}
                              className="text-sm text-medium-black dark:text-gray-200 font-medium hover:underline"
                            >
                              View list
                            </button>
                            <span className="text-medium-border dark:text-gray-600">·</span>
                            <span className="text-xs text-medium-gray dark:text-gray-500">
                              Updated {formatDistanceToNow(new Date(list.updatedAt), { addSuffix: true })}
                            </span>
                            <button
                              onClick={() => handleUnsaveList(list._id)}
                              className="ml-auto flex items-center gap-1 text-xs text-medium-gray dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition"
                            >
                              <FiBookmark className="text-sm fill-current" />
                              Unsave
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {/* ── Saved lists ── */}
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
                          <div className="w-24 h-16 rounded overflow-hidden bg-white dark:bg-gray-800 flex items-center justify-center">
                            <img src={post.coverImage} alt={post.title} className="max-w-full max-h-full object-contain block" />
                          </div>
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
                          <div className="w-24 h-16 rounded overflow-hidden bg-white dark:bg-gray-800 flex items-center justify-center">
                            <img src={post.coverImage} alt={post.title} className="max-w-full max-h-full object-contain block" />
                          </div>
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
                      {comment.post && (
                        <Link to={`/article/${comment.post.slug}`}
                          className="text-xs text-medium-gray dark:text-gray-500 hover:text-medium-black dark:hover:text-gray-300 transition flex items-center gap-1.5 mb-2 group">
                          <FiMessageCircle className="text-xs flex-shrink-0" />
                          <span className="line-clamp-1 group-hover:underline">
                            In response to: <span className="font-medium">{comment.post.title}</span>
                          </span>
                        </Link>
                      )}
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

      {/* Create list modal */}
      {showCreateModal && (
        <CreateListModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(newList) => setLists(prev => [newList, ...prev])}
        />
      )}
    </SidebarLayout>
  );
}

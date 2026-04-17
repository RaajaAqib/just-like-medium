import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  FiMoreHorizontal, FiX, FiLink, FiEdit2, FiTrash2,
  FiEye, FiEyeOff, FiMessageSquare,
} from 'react-icons/fi';
import SidebarLayout from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

// ── Three-dot story menu ──────────────────────────────────────────────────────
function StoryMenu({ post, onClose, onDelete, onTogglePublish, onEdit }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const copyLink = () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}article/${post.slug}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied'));
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-9 z-30 bg-white dark:bg-gray-800 border border-medium-border dark:border-gray-700 rounded-xl shadow-xl py-1.5 w-52"
    >
      <button onClick={copyLink}
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
        <FiLink className="text-base flex-shrink-0 text-medium-gray dark:text-gray-400" />
        Copy link
      </button>
      <button onClick={() => { onEdit(); onClose(); }}
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
        <FiEdit2 className="text-base flex-shrink-0 text-medium-gray dark:text-gray-400" />
        Edit story
      </button>
      <button onClick={() => { onTogglePublish(); onClose(); }}
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
        {post.published
          ? <FiEyeOff className="text-base flex-shrink-0 text-medium-gray dark:text-gray-400" />
          : <FiEye    className="text-base flex-shrink-0 text-medium-gray dark:text-gray-400" />}
        {post.published ? 'Unpublish story' : 'Publish story'}
      </button>
      <div className="my-1 border-t border-medium-border dark:border-gray-700" />
      <button onClick={() => { onDelete(); onClose(); }}
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
        <FiTrash2 className="text-base flex-shrink-0" />
        Delete story
      </button>
    </div>
  );
}

// ── Story row ─────────────────────────────────────────────────────────────────
function StoryRow({ post, onDelete, onTogglePublish }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const wordCount = post.wordCount || (post.readTime ? post.readTime * 200 : 0);

  return (
    <div className="flex items-center gap-4 py-5 border-b border-medium-border dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition px-1 group">

      {/* Thumbnail */}
      <div className="w-16 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
        {post.coverImage
          ? <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <span className="text-[10px] text-medium-gray dark:text-gray-500 text-center px-1 leading-tight">No image</span>
            </div>
        }
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <Link
          to={post.published ? `/article/${post.slug}` : `/edit/${post._id}`}
          className="font-bold text-medium-black dark:text-gray-100 hover:underline text-sm sm:text-base line-clamp-1 leading-snug"
        >
          {post.title || 'Untitled story'}
        </Link>
        <p className="text-xs text-medium-gray dark:text-gray-500 mt-0.5">
          {post.readTime} min read{wordCount > 0 ? ` (${wordCount.toLocaleString()} words)` : ''}{' '}
          · Updated {formatDistanceToNow(new Date(post.updatedAt || post.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Publication column */}
      <div className="hidden md:block w-28 text-xs text-medium-gray dark:text-gray-500 text-center flex-shrink-0">
        —
      </div>

      {/* Status column */}
      <div className="hidden sm:block w-24 text-right flex-shrink-0">
        {post.published ? (
          <span className="text-xs text-green-700 dark:text-green-400 font-medium">Published</span>
        ) : (
          <span className="text-xs text-medium-gray dark:text-gray-500">Draft</span>
        )}
      </div>

      {/* Three-dot menu */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="p-1.5 text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100 transition rounded"
        >
          <FiMoreHorizontal className="text-lg" />
        </button>
        {menuOpen && (
          <StoryMenu
            post={post}
            onClose={() => setMenuOpen(false)}
            onEdit={() => navigate(`/edit/${post._id}`)}
            onDelete={onDelete}
            onTogglePublish={onTogglePublish}
          />
        )}
      </div>
    </div>
  );
}

// ── Response row ──────────────────────────────────────────────────────────────
function ResponseRow({ response }) {
  return (
    <div className="flex items-start gap-4 py-5 border-b border-medium-border dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition px-1">
      <div className="w-8 h-8 flex-shrink-0 mt-0.5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <FiMessageSquare className="text-sm text-medium-gray dark:text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        {/* Response text */}
        <p className="text-sm text-medium-black dark:text-gray-200 line-clamp-2 leading-relaxed">
          {response.content}
        </p>
        {/* Story it was left on */}
        {response.post && (
          <p className="text-xs text-medium-gray dark:text-gray-500 mt-1">
            In response to{' '}
            <Link
              to={`/article/${response.post.slug}`}
              className="hover:underline text-medium-black dark:text-gray-300"
            >
              {response.post.title}
            </Link>
          </p>
        )}
        <p className="text-xs text-medium-gray dark:text-gray-500 mt-0.5">
          {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

// ── Import modal ──────────────────────────────────────────────────────────────
function ImportModal({ onClose }) {
  const navigate = useNavigate();
  const [title, setTitle]     = useState('');
  const [text, setText]       = useState('');
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (!title.trim()) return toast.error('Please enter a title');
    if (!text.trim())  return toast.error('Please paste some content');
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', `<p>${text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`);
      formData.append('published', 'false');
      const res = await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Story imported as draft!');
      onClose();
      navigate(`/edit/${res.data.post._id}`);
    } catch { toast.error('Failed to import'); }
    finally { setImporting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-medium-black dark:text-gray-100">Import a story</h2>
          <button onClick={onClose} className="text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100">
            <FiX className="text-xl" />
          </button>
        </div>
        <p className="text-sm text-medium-gray dark:text-gray-400 mb-4">
          Paste your story text below. It will be saved as a draft that you can edit and publish.
        </p>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Story title"
          className="w-full border border-medium-border dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-medium-black dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-medium-black dark:focus:ring-gray-400 mb-3" />
        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder="Paste your story content here..." rows={8}
          className="w-full border border-medium-border dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-medium-black dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-medium-black dark:focus:ring-gray-400 mb-4 resize-none" />
        <div className="flex justify-end gap-3">
          <button onClick={onClose}
            className="px-5 py-2 text-sm border border-medium-border dark:border-gray-600 rounded-full text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            Cancel
          </button>
          <button onClick={handleImport} disabled={importing}
            className="px-5 py-2 text-sm bg-medium-black dark:bg-gray-100 text-white dark:text-gray-900 rounded-full hover:opacity-90 disabled:opacity-50 transition">
            {importing ? 'Importing…' : 'Import as draft'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyStories() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts]           = useState([]);
  const [responses, setResponses]   = useState([]);
  const [loadingPosts, setLoadingPosts]         = useState(true);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [responsesLoaded, setResponsesLoaded]   = useState(false);
  const [showImport, setShowImport] = useState(false);

  const activeTab = searchParams.get('tab') || 'drafts';

  const setTab = (key) => setSearchParams({ tab: key }, { replace: true });

  useEffect(() => {
    if (!user) return;
    api.get('/users/me/posts')
      .then(res => setPosts(res.data.posts || []))
      .catch(() => toast.error('Failed to load stories'))
      .finally(() => setLoadingPosts(false));
  }, [user]);

  // Lazy-load responses only when that tab is first visited
  useEffect(() => {
    if (activeTab !== 'responses' || responsesLoaded || !user) return;
    setLoadingResponses(true);
    api.get('/users/me/responses')
      .then(res => setResponses(res.data.responses || []))
      .catch(() => toast.error('Failed to load responses'))
      .finally(() => { setLoadingResponses(false); setResponsesLoaded(true); });
  }, [activeTab, responsesLoaded, user]);

  const drafts    = posts.filter(p => !p.published);
  const published = posts.filter(p =>  p.published);

  const TABS = [
    { key: 'drafts',      label: 'Drafts',      count: drafts.length },
    { key: 'published',   label: 'Published',   count: null },
    { key: 'responses',   label: 'Responses',   count: null },
    { key: 'scheduled',   label: 'Scheduled',   count: null },
    { key: 'submissions', label: 'Submissions', count: null },
  ];

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this story? This cannot be undone.')) return;
    try {
      await api.delete(`/posts/${id}`);
      setPosts(prev => prev.filter(p => p._id !== id));
      toast.success('Story deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleTogglePublish = async (post) => {
    try {
      const res = await api.patch(`/posts/${post._id}/toggle-publish`);
      setPosts(prev => prev.map(p =>
        p._id === post._id ? { ...p, published: res.data.published } : p
      ));
      toast.success(res.data.published ? 'Story published' : 'Story moved to drafts');
    } catch { toast.error('Failed to update story'); }
  };

  // ── Render tab content ──────────────────────────────────────────────────────
  const renderContent = () => {
    if (loadingPosts && (activeTab === 'drafts' || activeTab === 'published')) {
      return <div className="py-16"><LoadingSpinner /></div>;
    }

    // Responses tab
    if (activeTab === 'responses') {
      if (loadingResponses) return <div className="py-16"><LoadingSpinner /></div>;
      if (responses.length === 0) {
        return (
          <div className="text-center py-20 border-t border-medium-border dark:border-gray-700">
            <p className="text-medium-gray dark:text-gray-500 text-sm">No responses yet.</p>
            <p className="text-medium-gray dark:text-gray-500 text-xs mt-1">Responses you leave on stories will appear here.</p>
          </div>
        );
      }
      return (
        <div>
          {responses.map(r => <ResponseRow key={r._id} response={r} />)}
        </div>
      );
    }

    // Scheduled tab
    if (activeTab === 'scheduled') {
      return (
        <div className="text-center py-20 border-t border-medium-border dark:border-gray-700">
          <p className="text-medium-gray dark:text-gray-500 text-sm">No scheduled stories.</p>
          <p className="text-medium-gray dark:text-gray-500 text-xs mt-1">Scheduling is not available yet.</p>
        </div>
      );
    }

    // Submissions tab
    if (activeTab === 'submissions') {
      return (
        <div className="text-center py-20 border-t border-medium-border dark:border-gray-700">
          <p className="text-medium-gray dark:text-gray-500 text-sm">No submissions.</p>
          <p className="text-medium-gray dark:text-gray-500 text-xs mt-1">Publication submissions will appear here.</p>
        </div>
      );
    }

    // Drafts / Published
    const list = activeTab === 'drafts' ? drafts : published;

    if (list.length === 0) {
      return (
        <div className="text-center py-20 border-t border-medium-border dark:border-gray-700">
          <p className="text-medium-gray dark:text-gray-500 mb-4 text-sm">
            {activeTab === 'drafts' ? 'No drafts yet.' : 'No published stories yet.'}
          </p>
          <Link to="/write" className="btn-black px-6 py-2 text-sm">Write a story</Link>
        </div>
      );
    }

    return (
      <>
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[1fr_7rem_6rem_2rem] items-center text-xs text-medium-gray dark:text-gray-500 font-medium border-b border-medium-border dark:border-gray-700 py-3 px-1 gap-4">
          <span>Latest</span>
          <span className="hidden md:block text-center">Publication</span>
          <span className="hidden sm:block text-right">Status</span>
          <span />
        </div>
        <div>
          {list.map(post => (
            <StoryRow
              key={post._id}
              post={post}
              onDelete={() => handleDelete(post._id)}
              onTogglePublish={() => handleTogglePublish(post)}
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-3">
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-medium-black dark:text-gray-100">Stories</h1>
          <button
            onClick={() => setShowImport(true)}
            className="text-sm px-4 py-2 border border-medium-border dark:border-gray-600 rounded-full text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex-shrink-0"
          >
            Import a story
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-medium-border dark:border-gray-700 mb-0 overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`pb-3 px-1 mr-6 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap flex-shrink-0 ${
                activeTab === t.key
                  ? 'border-medium-black dark:border-gray-200 text-medium-black dark:text-gray-100'
                  : 'border-transparent text-medium-gray dark:text-gray-500 hover:text-medium-black dark:hover:text-gray-200'
              }`}
            >
              {t.label}{t.count !== null && t.count > 0 ? ` ${t.count}` : ''}
            </button>
          ))}
        </div>

        {renderContent()}
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </SidebarLayout>
  );
}

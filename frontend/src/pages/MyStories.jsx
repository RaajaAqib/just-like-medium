import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import {
  FiMoreHorizontal, FiX, FiLink, FiEdit2, FiTrash2,
  FiEye, FiEyeOff, FiClock, FiSend, FiSlash,
} from 'react-icons/fi';
import SidebarLayout from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

// ── Submission status badge ───────────────────────────────────────────────────
const STATUS_META = {
  pending:          { label: 'Pending review',   cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  'in-review':      { label: 'In review',         cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  'edits-requested':{ label: 'Edits requested',   cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  approved:         { label: 'Approved',           cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  withdrawn:        { label: 'Withdrawn',          cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
  declined:         { label: 'Declined',           cls: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

// ── Schedule picker modal ─────────────────────────────────────────────────────
function ScheduleModal({ post, onClose, onScheduled }) {
  const minDate = new Date(Date.now() + 5 * 60 * 1000); // at least 5 min from now
  const toLocal = (d) => {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const [value, setValue] = useState(toLocal(minDate));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const date = new Date(value);
    if (date <= new Date()) return toast.error('Please choose a future date and time');
    setSaving(true);
    try {
      await api.patch(`/posts/${post._id}/schedule`, { scheduledAt: date.toISOString() });
      toast.success('Story scheduled');
      onScheduled(date.toISOString());
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-medium-black dark:text-gray-100">Schedule story</h2>
          <button onClick={onClose} className="text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100">
            <FiX className="text-xl" />
          </button>
        </div>
        <p className="text-sm text-medium-gray dark:text-gray-400 mb-4">
          Choose when this story will be automatically published.
        </p>
        <input
          type="datetime-local"
          value={value}
          min={toLocal(minDate)}
          onChange={e => setValue(e.target.value)}
          className="w-full border border-medium-border dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-medium-black dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-medium-black dark:focus:ring-gray-400 mb-4"
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose}
            className="px-5 py-2 text-sm border border-medium-border dark:border-gray-600 rounded-full text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm bg-medium-black dark:bg-gray-100 text-white dark:text-gray-900 rounded-full hover:opacity-90 disabled:opacity-50 transition">
            {saving ? 'Scheduling…' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Three-dot story menu ──────────────────────────────────────────────────────
function StoryMenu({ post, onClose, onDelete, onEdit, onSubmit, onWithdraw, onUnschedule, onOpenSchedule }) {
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

  const isPending   = post.submissionStatus === 'pending';
  const isInReview  = post.submissionStatus === 'in-review';
  const isActive    = isPending || isInReview;
  const isScheduled = !!post.scheduledAt && !post.published;
  const canSubmit   = !post.published && !isActive && !isScheduled;
  const canSchedule = !post.published && !isActive && !isScheduled;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-9 z-30 bg-white dark:bg-gray-800 border border-medium-border dark:border-gray-700 rounded-xl shadow-xl py-1.5 w-56"
    >
      {post.published && (
        <button onClick={copyLink}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <FiLink className="text-base flex-shrink-0 text-medium-gray dark:text-gray-400" />
          Copy link
        </button>
      )}
      <button onClick={() => { onEdit(); onClose(); }}
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
        <FiEdit2 className="text-base flex-shrink-0 text-medium-gray dark:text-gray-400" />
        Edit story
      </button>

      {/* Publish actions */}
      {post.published ? (
        <button onClick={() => { onWithdraw('unpublish'); onClose(); }}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <FiEyeOff className="text-base flex-shrink-0 text-medium-gray dark:text-gray-400" />
          Unpublish story
        </button>
      ) : (
        <>
          {canSubmit && (
            <button onClick={() => { onSubmit(); onClose(); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <FiSend className="text-base flex-shrink-0 text-medium-gray dark:text-gray-400" />
              Submit for review
            </button>
          )}
          {canSchedule && (
            <button onClick={() => { onOpenSchedule(); onClose(); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <FiClock className="text-base flex-shrink-0 text-medium-gray dark:text-gray-400" />
              Schedule story
            </button>
          )}
          {isActive && (
            <button onClick={() => { onWithdraw('submission'); onClose(); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <FiSlash className="text-base flex-shrink-0 text-medium-gray dark:text-gray-400" />
              Withdraw submission
            </button>
          )}
          {isScheduled && (
            <button onClick={() => { onUnschedule(); onClose(); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <FiClock className="text-base flex-shrink-0 text-medium-gray dark:text-gray-400" />
              Cancel schedule
            </button>
          )}
        </>
      )}

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
function StoryRow({ post, onDelete, onUpdate }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const wordCount = post.wordCount || 0;

  const handleSubmit = async () => {
    try {
      await api.patch(`/posts/${post._id}/submit`);
      onUpdate({ ...post, submissionStatus: 'pending' });
      toast.success('Story submitted for review');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    }
  };

  const handleWithdraw = async (type) => {
    try {
      if (type === 'unpublish') {
        await api.patch(`/posts/${post._id}/toggle-publish`);
        onUpdate({ ...post, published: false });
        toast.success('Story moved to drafts');
      } else {
        await api.patch(`/posts/${post._id}/withdraw`);
        onUpdate({ ...post, submissionStatus: 'withdrawn' });
        toast.success('Submission withdrawn');
      }
    } catch { toast.error('Failed'); }
  };

  const handleUnschedule = async () => {
    try {
      await api.patch(`/posts/${post._id}/unschedule`);
      onUpdate({ ...post, scheduledAt: null });
      toast.success('Schedule cancelled');
    } catch { toast.error('Failed to cancel schedule'); }
  };

  const isScheduled = !!post.scheduledAt && !post.published;
  const hasSubmission = post.submissionStatus && post.submissionStatus !== 'none';

  return (
    <>
      <div className="flex items-center gap-4 py-5 border-b border-medium-border dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition px-1 group">

        {/* Thumbnail */}
        <div className="w-16 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          {post.coverImage
            ? <img src={post.coverImage} alt="" className="max-w-full max-h-full object-contain block" />
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
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <p className="text-xs text-medium-gray dark:text-gray-500">
              {post.readTime} min read{wordCount > 0 ? ` (${wordCount.toLocaleString()} words)` : ''}{' '}
              · Updated {formatDistanceToNow(new Date(post.updatedAt || post.createdAt), { addSuffix: true })}
            </p>
            {isScheduled && (
              <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <FiClock className="text-xs" />
                {format(new Date(post.scheduledAt), 'MMM d, yyyy h:mm a')}
              </span>
            )}
          </div>
          {hasSubmission && (
            <div className="mt-1.5">
              <StatusBadge status={post.submissionStatus} />
              {post.submissionNote && (
                <p className="text-xs text-medium-gray dark:text-gray-500 mt-1 italic">Note: {post.submissionNote}</p>
              )}
            </div>
          )}
        </div>

        {/* Publication column */}
        <div className="hidden md:block w-28 text-xs text-medium-gray dark:text-gray-500 text-center flex-shrink-0">
          —
        </div>

        {/* Status column */}
        <div className="hidden sm:block w-24 text-right flex-shrink-0">
          {post.published ? (
            <span className="text-xs text-green-700 dark:text-green-400 font-medium">Published</span>
          ) : isScheduled ? (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Scheduled</span>
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
              onSubmit={handleSubmit}
              onWithdraw={handleWithdraw}
              onUnschedule={handleUnschedule}
              onOpenSchedule={() => setScheduleOpen(true)}
            />
          )}
        </div>
      </div>

      {scheduleOpen && (
        <ScheduleModal
          post={post}
          onClose={() => setScheduleOpen(false)}
          onScheduled={(scheduledAt) => onUpdate({ ...post, scheduledAt })}
        />
      )}
    </>
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

// ── Submissions filter dropdown ───────────────────────────────────────────────
const SUBMISSION_FILTERS = [
  { key: 'pending',           label: 'Pending review',   cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  { key: 'in-review',         label: 'In review',         cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { key: 'edits-requested',   label: 'Edits requested',   cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  { key: 'approved',          label: 'Approved',           cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  { key: 'withdrawn',         label: 'Withdrawn',          cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
  { key: 'declined',          label: 'Declined',           cls: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' },
];

function SubmissionsFilterDropdown({ selected, onToggle, onClear, onApply, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute right-0 top-8 z-20 bg-white dark:bg-gray-800 border border-medium-border dark:border-gray-700 rounded-xl shadow-xl py-3 px-3 w-56">
      <p className="text-xs font-semibold text-medium-gray dark:text-gray-400 uppercase tracking-wider mb-2 px-1">Filter</p>
      <div className="space-y-1.5 mb-3">
        {SUBMISSION_FILTERS.map(f => (
          <label key={f.key} className="flex items-center gap-2.5 cursor-pointer px-1">
            <input
              type="checkbox"
              checked={selected.includes(f.key)}
              onChange={() => onToggle(f.key)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${f.cls}`}>{f.label}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-medium-border dark:border-gray-700">
        <button onClick={onClear} className="text-xs text-medium-gray hover:text-medium-black dark:text-gray-400 dark:hover:text-gray-200 transition">Clear all</button>
        <button onClick={() => { onApply(); onClose(); }} className="text-xs px-3 py-1.5 bg-medium-black dark:bg-gray-100 text-white dark:text-gray-900 rounded-full hover:opacity-90 transition">Apply</button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyStories() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showImport, setShowImport] = useState(false);

  // Submission filter state
  const [filterOpen, setFilterOpen]   = useState(false);
  const [filterDraft, setFilterDraft] = useState([]);   // pending selection
  const [filterApplied, setFilterApplied] = useState([]); // applied

  const activeTab = searchParams.get('tab') || 'drafts';
  const setTab = (key) => setSearchParams({ tab: key }, { replace: true });

  useEffect(() => {
    if (!user) return;
    api.get('/users/me/posts')
      .then(res => setPosts(res.data.posts || []))
      .catch(() => toast.error('Failed to load stories'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleUpdate = (updated) => {
    setPosts(prev => prev.map(p => p._id === updated._id ? updated : p));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this story? This cannot be undone.')) return;
    try {
      await api.delete(`/posts/${id}`);
      setPosts(prev => prev.filter(p => p._id !== id));
      toast.success('Story deleted');
    } catch { toast.error('Failed to delete'); }
  };

  // Tab lists
  const drafts      = posts.filter(p => !p.published && !p.scheduledAt);
  const scheduled   = posts.filter(p => !p.published && !!p.scheduledAt);
  const published   = posts.filter(p =>  p.published);
  const unlisted    = []; // placeholder
  const submissions = posts.filter(p => p.submissionStatus && p.submissionStatus !== 'none');

  // Apply filter to submissions tab
  const visibleSubmissions = filterApplied.length > 0
    ? submissions.filter(p => filterApplied.includes(p.submissionStatus))
    : submissions;

  const TABS = [
    { key: 'drafts',      label: 'Drafts',      count: drafts.length },
    { key: 'scheduled',   label: 'Scheduled',   count: null },
    { key: 'published',   label: 'Published',   count: null },
    { key: 'unlisted',    label: 'Unlisted',    count: null },
    { key: 'submissions', label: 'Submissions', count: null },
  ];

  const renderStoryList = (list) => {
    if (list.length === 0) return null;
    return (
      <>
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
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      </>
    );
  };

  const renderContent = () => {
    if (loading) return <div className="py-16"><LoadingSpinner /></div>;

    if (activeTab === 'drafts') {
      return drafts.length === 0
        ? <EmptyState tab="drafts" />
        : renderStoryList(drafts);
    }

    if (activeTab === 'scheduled') {
      return scheduled.length === 0
        ? (
          <div className="text-center py-20 border-t border-medium-border dark:border-gray-700">
            <p className="text-medium-gray dark:text-gray-500 text-sm mb-1">No scheduled stories.</p>
            <p className="text-xs text-medium-gray dark:text-gray-500">Use the three-dot menu on any draft to schedule it.</p>
          </div>
        )
        : renderStoryList(scheduled);
    }

    if (activeTab === 'published') {
      return published.length === 0
        ? <EmptyState tab="published" />
        : renderStoryList(published);
    }

    if (activeTab === 'unlisted') {
      return (
        <div className="text-center py-20 border-t border-medium-border dark:border-gray-700">
          <p className="text-medium-gray dark:text-gray-500 text-sm">No unlisted stories.</p>
        </div>
      );
    }

    if (activeTab === 'submissions') {
      return (
        <>
          {/* Column headers with Status filter */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[1fr_7rem_6rem_2rem] items-center text-xs text-medium-gray dark:text-gray-500 font-medium border-b border-medium-border dark:border-gray-700 py-3 px-1 gap-4">
            <span>Latest</span>
            <span className="hidden md:block text-center">Publication</span>
            {/* Status filter button */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => { setFilterDraft(filterApplied); setFilterOpen(v => !v); }}
                className="flex items-center gap-1 text-xs font-medium text-medium-gray dark:text-gray-500 hover:text-medium-black dark:hover:text-gray-200 transition"
              >
                Status {filterApplied.length > 0 ? `(${filterApplied.length})` : ''} <span className="text-[10px]">▾</span>
              </button>
              {filterOpen && (
                <SubmissionsFilterDropdown
                  selected={filterDraft}
                  onToggle={k => setFilterDraft(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])}
                  onClear={() => setFilterDraft([])}
                  onApply={() => setFilterApplied(filterDraft)}
                  onClose={() => setFilterOpen(false)}
                />
              )}
            </div>
            <span />
          </div>
          {visibleSubmissions.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-medium-gray dark:text-gray-500 text-sm mb-1">No submissions yet.</p>
              <p className="text-xs text-medium-gray dark:text-gray-500">Submit a draft for review using the three-dot menu.</p>
            </div>
          ) : (
            <div>
              {visibleSubmissions.map(post => (
                <StoryRow
                  key={post._id}
                  post={post}
                  onDelete={() => handleDelete(post._id)}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          )}
        </>
      );
    }

    return null;
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

function EmptyState({ tab }) {
  return (
    <div className="text-center py-20 border-t border-medium-border dark:border-gray-700">
      <p className="text-medium-gray dark:text-gray-500 mb-4 text-sm">
        {tab === 'drafts' ? 'No drafts yet.' : 'No published stories yet.'}
      </p>
      <Link to="/write" className="btn-black px-6 py-2 text-sm">Write a story</Link>
    </div>
  );
}

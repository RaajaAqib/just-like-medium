import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiHeart, FiX, FiMessageSquare, FiChevronDown, FiChevronUp, FiMoreHorizontal } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import UserBadges from './UserBadges';

const avatarUrl = (u, size = 36) =>
  u?.avatar ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || 'U')}&background=random&size=${size}`;

const REPORT_REASONS = [
  'Harassment or bullying',
  'Spam or advertising',
  'Misinformation',
  'Hate speech',
  'Irrelevant or off-topic',
  'Other',
];

function ReportDialog({ onConfirm, onCancel }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Report this response</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select a reason for reporting:</p>
        <div className="space-y-2 mb-5">
          {REPORT_REASONS.map(r => (
            <label key={r} className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="reason" value={r} checked={reason === r}
                onChange={() => setReason(r)} className="accent-medium-green" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{r}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition">Cancel</button>
          <button onClick={() => onConfirm(reason)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-full hover:bg-red-600 transition">Submit report</button>
        </div>
      </div>
    </div>
  );
}

function ThreeDotMenu({ commentId, commentAuthorId, user, postAuthorId, isReply, parentId, onDelete, onReport }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!user) return null;

  const isOwnComment = user._id === commentAuthorId;
  const canDelete    = isOwnComment || user._id === postAuthorId || user.isAdmin;
  const canReport    = !isOwnComment;

  if (!canDelete && !canReport) return null;

  return (
    <div ref={ref} className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-1 rounded text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="More options"
      >
        <FiMoreHorizontal className="text-base" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 w-44 min-w-max">
          {canDelete && (
            <button onClick={() => { setOpen(false); onDelete(commentId, isReply, parentId); }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              Delete response
            </button>
          )}
          {canReport && (
            <button onClick={() => { setOpen(false); onReport(commentId); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              Report response
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ReplyBox({ replyingToName, onSubmit, onCancel }) {
  const [text, setText]      = useState('');
  const [submitting, setSub] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSub(true);
    try { await onSubmit(text.trim()); setText(''); }
    finally { setSub(false); }
  };

  return (
    <div className="mt-2 ml-12" onClick={e => e.stopPropagation()}>
      <textarea value={text} onChange={e => setText(e.target.value)}
        placeholder={`Reply to ${replyingToName}…`} rows={2} autoFocus
        className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors" />
      <div className="flex gap-2 justify-end mt-1.5">
        <button onClick={onCancel} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-1 transition">Cancel</button>
        <button onClick={handleSubmit} disabled={!text.trim() || submitting} className="btn-green text-xs px-4 py-1.5 disabled:opacity-40">
          {submitting ? 'Posting…' : 'Respond'}
        </button>
      </div>
    </div>
  );
}

function CommentItem({ comment, user, postAuthorId, isReply, parentId, expandedReplies, onLike, onDelete, onReport, onReplySubmit, onToggleReplies, onOpenPanel }) {
  const [showReply, setShowReply] = useState(false);

  const isLiked    = comment.likes?.some(id => id === user?._id || id?._id === user?._id);
  const isExpanded = !isReply && expandedReplies?.has(comment._id);
  const hasReplies = !isReply && (comment.replies?.length || 0) > 0;
  const replyParentId = isReply ? parentId : comment._id;

  return (
    <div className={isReply ? 'ml-11 pl-4 border-l-2 border-gray-100 dark:border-gray-700 mt-3' : 'mt-1'}>
      <div
        className={`group flex gap-3 rounded-lg px-2 py-2 transition-colors
          ${!isReply ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60' : 'hover:bg-gray-50/60 dark:hover:bg-gray-800/40'}`}
        onClick={() => !isReply && onOpenPanel?.()}
      >
        <Link to={`/profile/${comment.author?._id}`} onClick={e => e.stopPropagation()} className="flex-shrink-0 mt-0.5">
          <img src={avatarUrl(comment.author)} alt={comment.author?.name} className="w-9 h-9 rounded-full object-cover" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <Link to={`/profile/${comment.author?._id}`} onClick={e => e.stopPropagation()}
                className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:underline leading-none truncate">
                {comment.author?.name}
              </Link>
              <UserBadges user={comment.author} size="sm" />
              <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            <ThreeDotMenu commentId={comment._id} commentAuthorId={comment.author?._id} user={user}
              postAuthorId={postAuthorId} isReply={isReply} parentId={parentId} onDelete={onDelete} onReport={onReport} />
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>

          <div className="flex items-center gap-4 mt-2" onClick={e => e.stopPropagation()}>
            <button onClick={() => onLike(comment._id, isReply, parentId)}
              className={`flex items-center gap-1 text-xs transition ${isLiked ? 'text-red-500' : 'text-gray-400 dark:text-gray-500 hover:text-red-400'}`}>
              <FiHeart className={`text-xs ${isLiked ? 'fill-current' : ''}`} />
              <span>{comment.likes?.length || 0}</span>
            </button>

            {user && (
              <button onClick={() => setShowReply(v => !v)}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
                {showReply ? 'Cancel' : 'Reply'}
              </button>
            )}

            {hasReplies && (
              <button onClick={() => onToggleReplies(comment._id)}
                className="flex items-center gap-0.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition">
                {isExpanded
                  ? <><FiChevronUp className="text-[11px]" /> Hide replies</>
                  : <><FiChevronDown className="text-[11px]" /> {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</>
                }
              </button>
            )}
          </div>
        </div>
      </div>

      {showReply && (
        <ReplyBox replyingToName={comment.author?.name}
          onSubmit={async text => { await onReplySubmit(replyParentId, text); setShowReply(false); }}
          onCancel={() => setShowReply(false)} />
      )}

      {hasReplies && isExpanded && comment.replies.map(reply => (
        <CommentItem key={reply._id} comment={reply} user={user} postAuthorId={postAuthorId} isReply
          parentId={comment._id} expandedReplies={new Set()} onLike={onLike} onDelete={onDelete}
          onReport={onReport} onReplySubmit={onReplySubmit} onToggleReplies={() => {}} onOpenPanel={null} />
      ))}
    </div>
  );
}

function ResponseInput({ user, onSubmit }) {
  const [text, setText]      = useState('');
  const [submitting, setSub] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSub(true);
    try { await onSubmit(text.trim()); setText(''); }
    finally { setSub(false); }
  };

  return (
    <div className="flex items-start gap-3">
      <img src={avatarUrl(user)} alt={user.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5">{user.name}</p>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="What are your thoughts?" rows={3}
          className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm resize-none
            focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors bg-white dark:bg-gray-800 dark:text-gray-100" />
        {text.trim() && (
          <div className="flex gap-2 justify-end mt-1.5">
            <button onClick={() => setText('')} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-1 transition">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-green text-xs px-4 py-1.5 disabled:opacity-40">
              {submitting ? 'Posting…' : 'Respond'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({ postId, postAuthorId }) {
  const { user } = useAuth();
  const [comments, setComments]               = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [panelOpen, setPanelOpen]             = useState(false);
  const [reportTarget, setReportTarget]       = useState(null);

  const totalCount = comments.reduce((s, c) => s + 1 + (c.replies?.length || 0), 0);

  useEffect(() => { fetchComments(); }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/comments/${postId}`);
      setComments(res.data.comments || []);
    } catch { toast.error('Failed to load responses'); }
    finally { setLoading(false); }
  };

  const submitComment = async (text) => {
    const res = await api.post(`/comments/${postId}`, { content: text });
    setComments(prev => [...prev, { ...res.data.comment, replies: [] }]);
    toast.success('Response posted!');
  };

  const handleReplySubmit = async (parentId, text) => {
    const res = await api.post(`/comments/${postId}`, { content: text, parentComment: parentId });
    setComments(prev => prev.map(c => c._id === parentId ? { ...c, replies: [...(c.replies || []), res.data.comment] } : c));
    setExpandedReplies(prev => new Set([...prev, parentId]));
    toast.success('Reply posted!');
  };

  const handleLike = async (commentId, isReply, parentId) => {
    if (!user) return toast.error('Please login to like');
    try {
      const res = await api.post(`/comments/${commentId}/like`);
      const update = c => ({ ...c, likes: res.data.liked ? [...(c.likes || []), user._id] : (c.likes || []).filter(id => id !== user._id) });
      setComments(prev => prev.map(c => {
        if (!isReply && c._id === commentId) return update(c);
        if (isReply && c._id === parentId) return { ...c, replies: c.replies.map(r => r._id === commentId ? update(r) : r) };
        return c;
      }));
    } catch { toast.error('Failed to like'); }
  };

  const handleDelete = async (commentId, isReply, parentId) => {
    if (!window.confirm('Delete this comment? Replies will also be removed.')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      if (isReply) {
        setComments(prev => prev.map(c => c._id === parentId ? { ...c, replies: c.replies.filter(r => r._id !== commentId) } : c));
      } else {
        setComments(prev => prev.filter(c => c._id !== commentId));
      }
      toast.success('Comment deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleReport   = (commentId) => setReportTarget(commentId);
  const confirmReport  = async (reason) => {
    try {
      await api.post(`/comments/${reportTarget}/report`, { reason });
      toast.success('Response reported — our team will review it');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to report'); }
    finally { setReportTarget(null); }
  };

  const toggleReplies = commentId => {
    setExpandedReplies(prev => { const n = new Set(prev); n.has(commentId) ? n.delete(commentId) : n.add(commentId); return n; });
  };

  const itemProps = { user, postAuthorId, expandedReplies, onLike: handleLike, onDelete: handleDelete, onReport: handleReport, onReplySubmit: handleReplySubmit, onToggleReplies: toggleReplies };
  const commentListJSX = (inPanel) => comments.map(c => (
    <CommentItem key={c._id} comment={c} isReply={false} parentId={null}
      onOpenPanel={inPanel ? null : () => setPanelOpen(true)} {...itemProps} />
  ));

  return (
    <section className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setPanelOpen(true)} className="flex items-center gap-2 group">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Responses ({totalCount})</h3>
          <FiMessageSquare className="text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition text-base" />
        </button>
      </div>

      {user ? (
        <div className="mb-8 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <ResponseInput user={user} onSubmit={submitComment} />
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          <Link to="/login" className="text-medium-green hover:underline">Sign in</Link> to leave a response.
        </p>
      )}

      {loading ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm">Loading responses…</p>
      ) : comments.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm">No responses yet. Be the first!</p>
      ) : (
        <>
          <div className="space-y-1">
            {comments.slice(0, 3).map(c => (
              <CommentItem key={c._id} comment={c} isReply={false} parentId={null}
                onOpenPanel={() => setPanelOpen(true)} {...itemProps} />
            ))}
          </div>
          {comments.length > 3 && (
            <button onClick={() => setPanelOpen(true)}
              className="mt-6 w-full py-2.5 border border-gray-300 dark:border-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:border-gray-500 dark:hover:border-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-medium">
              See all responses ({totalCount})
            </button>
          )}
        </>
      )}

      {panelOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/25" onClick={() => setPanelOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[420px] bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 responses-panel flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Responses ({totalCount})</h2>
              <button onClick={() => setPanelOpen(false)}
                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                <FiX className="text-lg" />
              </button>
            </div>

            {user ? (
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                <ResponseInput user={user} onSubmit={submitComment} />
              </div>
            ) : (
              <p className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                <Link to="/login" className="text-medium-green hover:underline">Sign in</Link> to respond.
              </p>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loading ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">No responses yet. Be the first!</p>
              ) : (
                <div className="space-y-1">{commentListJSX(true)}</div>
              )}
            </div>
          </div>
        </>
      )}

      {reportTarget && (
        <ReportDialog onConfirm={confirmReport} onCancel={() => setReportTarget(null)} />
      )}
    </section>
  );
}

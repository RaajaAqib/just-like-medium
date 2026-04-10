import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiTrash2, FiHeart, FiX, FiMessageSquare, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';

// ─── Avatar helper ────────────────────────────────────────────────────────────
const avatarUrl = (u, size = 36) =>
  u?.avatar ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || 'U')}&background=random&size=${size}`;

// ─── CommentItem — module-level, local state for reply box ───────────────────
// MUST stay at module level. Defining it inside CommentSection would cause
// React to see a new component type on every parent re-render and remount it,
// destroying textarea focus on every keystroke.
function CommentItem({
  comment,
  user,
  isReply,
  parentId,
  expandedReplies,
  onLike,
  onDelete,
  onReplySubmit,
  onToggleReplies,
  onOpenPanel,
}) {
  // Reply box lives here — typing ONLY re-renders this one item
  const [showReply, setShowReply]     = useState(false);
  const [replyText, setReplyText]     = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const isLiked    = comment.likes?.some((id) => id === user?._id || id?._id === user?._id);
  const canDelete  = user?._id === comment.author?._id || user?.isAdmin;
  const isExpanded = !isReply && expandedReplies?.has(comment._id);
  const hasReplies = !isReply && (comment.replies?.length || 0) > 0;

  const submitReply = async () => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onReplySubmit(comment._id, replyText.trim());
      setReplyText('');
      setShowReply(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={isReply ? 'ml-11 pl-4 border-l-2 border-gray-100 mt-3' : 'mt-1'}>
      {/* Row */}
      <div
        className={`group flex gap-3 rounded-lg px-2 py-2 transition-colors ${!isReply ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={() => !isReply && onOpenPanel?.()}
      >
        <Link to={`/profile/${comment.author?._id}`} onClick={e => e.stopPropagation()} className="flex-shrink-0 mt-0.5">
          <img src={avatarUrl(comment.author)} alt={comment.author?.name} className="w-9 h-9 rounded-full object-cover" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link to={`/profile/${comment.author?._id}`} onClick={e => e.stopPropagation()}
              className="text-sm font-semibold text-gray-900 hover:underline leading-none">
              {comment.author?.name}
            </Link>
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>

          <div className="flex items-center gap-4 mt-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onLike(comment._id, isReply, parentId)}
              className={`flex items-center gap-1 text-xs transition ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
            >
              <FiHeart className={`text-xs ${isLiked ? 'fill-current' : ''}`} />
              <span>{comment.likes?.length || 0}</span>
            </button>

            {!isReply && user && (
              <button
                onClick={() => setShowReply(v => !v)}
                className="text-xs text-gray-400 hover:text-gray-700 transition"
              >
                {showReply ? 'Cancel' : 'Reply'}
              </button>
            )}

            {hasReplies && (
              <button onClick={() => onToggleReplies(comment._id)}
                className="flex items-center gap-0.5 text-xs text-gray-500 hover:text-gray-800 transition">
                {isExpanded
                  ? <><FiChevronUp className="text-[11px]" /> Hide replies</>
                  : <><FiChevronDown className="text-[11px]" /> {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</>
                }
              </button>
            )}

            {canDelete && (
              <button onClick={() => onDelete(comment._id, isReply, parentId)}
                className="ml-auto text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                <FiTrash2 className="text-xs" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reply box — local state only, parent never re-renders this */}
      {showReply && (
        <div className="ml-12 mt-2" onClick={e => e.stopPropagation()}>
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder={`Reply to ${comment.author?.name}…`}
            rows={2}
            autoFocus
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400 transition-colors"
          />
          <div className="flex gap-2 justify-end mt-1.5">
            <button onClick={() => { setShowReply(false); setReplyText(''); }}
              className="text-xs text-gray-400 hover:text-gray-700 px-3 py-1 transition">
              Cancel
            </button>
            <button onClick={submitReply} disabled={!replyText.trim() || submitting}
              className="btn-green text-xs px-4 py-1.5 disabled:opacity-40">
              {submitting ? 'Posting…' : 'Respond'}
            </button>
          </div>
        </div>
      )}

      {/* Nested replies */}
      {hasReplies && isExpanded && comment.replies.map(reply => (
        <CommentItem key={reply._id} comment={reply} user={user} isReply parentId={comment._id}
          expandedReplies={new Set()} onLike={onLike} onDelete={onDelete}
          onReplySubmit={onReplySubmit} onToggleReplies={() => {}} onOpenPanel={null} />
      ))}
    </div>
  );
}

// ─── Response input — module-level, manages its OWN text state ───────────────
// Keeping text state local means typing ONLY re-renders this one component,
// never the parent CommentSection or anything else in the tree.
function ResponseInput({ user, onSubmit }) {
  const [text, setText]           = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-start gap-3">
      <img src={avatarUrl(user)} alt={user.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 mb-1.5">{user.name}</p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="What are your thoughts?"
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400 transition-colors bg-white"
        />
        {text.trim() && (
          <div className="flex gap-2 justify-end mt-1.5">
            <button onClick={() => setText('')} className="text-xs text-gray-400 hover:text-gray-700 px-3 py-1 transition">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="btn-green text-xs px-4 py-1.5 disabled:opacity-40">
              {submitting ? 'Posting…' : 'Respond'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CommentSection({ postId }) {
  const { user } = useAuth();

  const [comments, setComments]               = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [panelOpen, setPanelOpen]             = useState(false);

  const totalCount = comments.reduce((s, c) => s + 1 + (c.replies?.length || 0), 0);

  useEffect(() => { fetchComments(); }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/comments/${postId}`);
      setComments(res.data.comments || []);
    } catch {
      toast.error('Failed to load responses');
    } finally {
      setLoading(false);
    }
  };

  // Called by ResponseInput with the trimmed text — no state here
  const submitComment = async (text) => {
    const res = await api.post(`/comments/${postId}`, { content: text });
    setComments(prev => [...prev, { ...res.data.comment, replies: [] }]);
    toast.success('Response posted!');
  };

  const handleReplySubmit = async (parentId, text) => {
    const res = await api.post(`/comments/${postId}`, { content: text, parentComment: parentId });
    setComments(prev =>
      prev.map(c => c._id === parentId ? { ...c, replies: [...(c.replies || []), res.data.comment] } : c)
    );
    setExpandedReplies(prev => new Set([...prev, parentId]));
    toast.success('Reply posted!');
  };

  const handleLike = async (commentId, isReply, parentId) => {
    if (!user) return toast.error('Please login to like');
    try {
      const res = await api.post(`/comments/${commentId}/like`);
      const update = c => ({
        ...c,
        likes: res.data.liked
          ? [...(c.likes || []), user._id]
          : (c.likes || []).filter(id => id !== user._id),
      });
      setComments(prev => prev.map(c => {
        if (!isReply && c._id === commentId) return update(c);
        if (isReply && c._id === parentId) return { ...c, replies: c.replies.map(r => r._id === commentId ? update(r) : r) };
        return c;
      }));
    } catch { toast.error('Failed to like'); }
  };

  const handleDelete = async (commentId, isReply, parentId) => {
    if (!window.confirm('Delete this comment?')) return;
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

  const toggleReplies = commentId => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      next.has(commentId) ? next.delete(commentId) : next.add(commentId);
      return next;
    });
  };

  // Shared props for every CommentItem
  const itemProps = {
    user, expandedReplies,
    onLike: handleLike,
    onDelete: handleDelete,
    onReplySubmit: handleReplySubmit,
    onToggleReplies: toggleReplies,
  };

  // Inline comment list JSX (not a component — avoids remount on state change)
  const commentListJSX = (inPanel) => comments.map(c => (
    <CommentItem key={c._id} comment={c} isReply={false} parentId={null}
      onOpenPanel={inPanel ? null : () => setPanelOpen(true)}
      {...itemProps} />
  ));

  return (
    <section className="mt-12">
      {/* Heading */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setPanelOpen(true)} className="flex items-center gap-2 group">
          <h3 className="text-xl font-bold text-gray-900">Responses ({totalCount})</h3>
          <FiMessageSquare className="text-gray-400 group-hover:text-gray-700 transition text-base" />
        </button>
      </div>

      {/* Inline input */}
      {user ? (
        <div className="mb-8 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <ResponseInput user={user} onSubmit={submitComment} />
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-8">
          <Link to="/login" className="text-medium-green hover:underline">Sign in</Link> to leave a response.
        </p>
      )}

      {/* Inline list — show first 3 only */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading responses…</p>
      ) : comments.length === 0 ? (
        <p className="text-gray-400 text-sm">No responses yet. Be the first!</p>
      ) : (
        <>
          <div className="space-y-1">
            {comments.slice(0, 3).map(c => (
              <CommentItem key={c._id} comment={c} isReply={false} parentId={null}
                onOpenPanel={() => setPanelOpen(true)}
                {...itemProps} />
            ))}
          </div>
          {comments.length > 3 && (
            <button
              onClick={() => setPanelOpen(true)}
              className="mt-6 w-full py-2.5 border border-gray-300 rounded-full text-sm text-gray-700
                hover:border-gray-500 hover:text-gray-900 transition-colors font-medium"
            >
              See all responses ({totalCount})
            </button>
          )}
        </>
      )}

      {/* Side panel */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/25" onClick={() => setPanelOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[420px] bg-white shadow-2xl border-l border-gray-200 responses-panel flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-semibold text-gray-900">Responses ({totalCount})</h2>
              <button onClick={() => setPanelOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition">
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Panel input */}
            {user ? (
              <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <ResponseInput user={user} onSubmit={submitComment} />
              </div>
            ) : (
              <p className="px-6 py-4 text-sm text-gray-500 border-b border-gray-100 flex-shrink-0">
                <Link to="/login" className="text-medium-green hover:underline">Sign in</Link> to respond.
              </p>
            )}

            {/* Panel list */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loading ? (
                <p className="text-sm text-gray-400">Loading…</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-gray-400">No responses yet. Be the first!</p>
              ) : (
                <div className="space-y-1">{commentListJSX(true)}</div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

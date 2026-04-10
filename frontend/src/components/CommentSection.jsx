import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiTrash2, FiHeart, FiX, FiMessageSquare, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';

// ─── Avatar helper ────────────────────────────────────────────────────────────
const avatar = (user, size = 36) =>
  user?.avatar ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=random&size=${size}`;

// ─── Single comment card — defined at MODULE level to avoid reconciliation ────
function CommentItem({
  comment,
  user,
  isReply,
  parentId,
  replyingTo,
  replyText,
  expandedReplies,
  onLike,
  onDelete,
  onReplyToggle,
  onReplyChange,
  onReplySubmit,
  onToggleReplies,
  onOpenPanel,
}) {
  const isLiked    = comment.likes?.some((id) => id === user?._id || id?._id === user?._id);
  const canDelete  = user?._id === comment.author?._id || user?.isAdmin;
  const isExpanded = !isReply && expandedReplies?.has(comment._id);
  const hasReplies = !isReply && (comment.replies?.length || 0) > 0;
  const isReplying = !isReply && replyingTo === comment._id;

  return (
    <div className={isReply ? 'ml-11 pl-4 border-l-2 border-gray-100 mt-3' : 'mt-1'}>
      {/* Comment row */}
      <div
        className={`group flex gap-3 rounded-lg px-2 py-2 transition-colors
          ${!isReply ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={() => !isReply && onOpenPanel && onOpenPanel()}
      >
        {/* Avatar */}
        <Link
          to={`/profile/${comment.author?._id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 mt-0.5"
        >
          <img
            src={avatar(comment.author, 36)}
            alt={comment.author?.name}
            className="w-9 h-9 rounded-full object-cover"
          />
        </Link>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link
              to={`/profile/${comment.author?._id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-semibold text-gray-900 hover:underline leading-none"
            >
              {comment.author?.name}
            </Link>
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* Actions */}
          <div
            className="flex items-center gap-4 mt-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Like */}
            <button
              onClick={() => onLike(comment._id, isReply, parentId)}
              className={`flex items-center gap-1 text-xs transition ${
                isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
              }`}
            >
              <FiHeart className={`text-xs ${isLiked ? 'fill-current' : ''}`} />
              <span>{comment.likes?.length || 0}</span>
            </button>

            {/* Reply (top-level only, logged-in only) */}
            {!isReply && user && (
              <button
                onClick={() => { onReplyToggle(comment._id); onOpenPanel && onOpenPanel(); }}
                className="text-xs text-gray-400 hover:text-gray-700 transition"
              >
                Reply
              </button>
            )}

            {/* Show / hide replies */}
            {hasReplies && (
              <button
                onClick={() => onToggleReplies(comment._id)}
                className="flex items-center gap-0.5 text-xs text-gray-500 hover:text-gray-800 transition"
              >
                {isExpanded ? (
                  <><FiChevronUp className="text-[11px]" /> Hide replies</>
                ) : (
                  <><FiChevronDown className="text-[11px]" />
                    {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                  </>
                )}
              </button>
            )}

            {/* Delete */}
            {canDelete && (
              <button
                onClick={() => onDelete(comment._id, isReply, parentId)}
                className="ml-auto text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
              >
                <FiTrash2 className="text-xs" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reply input */}
      {isReplying && (
        <div className="ml-12 mt-2" onClick={(e) => e.stopPropagation()}>
          <textarea
            value={replyText}
            onChange={(e) => onReplyChange(e.target.value)}
            placeholder={`Reply to ${comment.author?.name}…`}
            rows={2}
            autoFocus
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none
              focus:outline-none focus:border-gray-400 transition-colors"
          />
          <div className="flex gap-2 justify-end mt-1.5">
            <button
              onClick={() => { onReplyToggle(null); onReplyChange(''); }}
              className="text-xs text-gray-400 hover:text-gray-700 px-3 py-1 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => onReplySubmit(comment._id)}
              disabled={!replyText.trim()}
              className="btn-green text-xs px-4 py-1.5 disabled:opacity-40"
            >
              Respond
            </button>
          </div>
        </div>
      )}

      {/* Nested replies */}
      {hasReplies && isExpanded &&
        comment.replies.map((reply) => (
          <CommentItem
            key={reply._id}
            comment={reply}
            user={user}
            isReply
            parentId={comment._id}
            replyingTo={null}
            replyText=""
            expandedReplies={new Set()}
            onLike={onLike}
            onDelete={onDelete}
            onReplyToggle={() => {}}
            onReplyChange={() => {}}
            onReplySubmit={() => {}}
            onToggleReplies={() => {}}
            onOpenPanel={null}
          />
        ))}
    </div>
  );
}

// ─── Comment input box (shared between inline + panel) ────────────────────────
function CommentInput({ user, value, onChange, onSubmit, submitting, placeholder = 'What are your thoughts?' }) {
  if (!user) return null;
  return (
    <div className="flex items-start gap-3">
      <img src={avatar(user, 36)} alt={user.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 mb-1.5">{user.name}</p>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none
            focus:outline-none focus:border-gray-400 transition-colors bg-white"
        />
        {value.trim() && (
          <div className="flex gap-2 justify-end mt-1.5">
            <button onClick={() => onChange('')} className="text-xs text-gray-400 hover:text-gray-700 px-3 py-1 transition">
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={submitting || !value.trim()}
              className="btn-green text-xs px-4 py-1.5 disabled:opacity-40"
            >
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

  const [comments, setComments]             = useState([]);
  const [loading, setLoading]               = useState(false);
  const [newComment, setNewComment]         = useState('');
  const [submitting, setSubmitting]         = useState(false);
  const [replyingTo, setReplyingTo]         = useState(null);   // commentId | null
  const [replyText, setReplyText]           = useState('');
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [panelOpen, setPanelOpen]           = useState(false);

  const totalCount = comments.reduce((s, c) => s + 1 + (c.replies?.length || 0), 0);

  // ── Fetch ────────────────────────────────────────────────────────────────────
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

  // ── Submit top-level comment ─────────────────────────────────────────────────
  const submitComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/comments/${postId}`, { content: newComment });
      // Oldest-first → append at end
      setComments((prev) => [...prev, { ...res.data.comment, replies: [] }]);
      setNewComment('');
      toast.success('Response posted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Submit reply ──────────────────────────────────────────────────────────────
  const handleReplySubmit = async (parentId) => {
    if (!replyText.trim()) return;
    try {
      const res = await api.post(`/comments/${postId}`, {
        content: replyText,
        parentComment: parentId,
      });
      setComments((prev) =>
        prev.map((c) =>
          c._id === parentId
            ? { ...c, replies: [...(c.replies || []), res.data.comment] }
            : c
        )
      );
      setReplyText('');
      setReplyingTo(null);
      // Auto-expand replies so new reply is visible
      setExpandedReplies((prev) => new Set([...prev, parentId]));
      toast.success('Reply posted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post reply');
    }
  };

  // ── Like (works for both top-level and replies) ───────────────────────────────
  const handleLike = async (commentId, isReply, parentId) => {
    if (!user) return toast.error('Please login to like');
    try {
      const res = await api.post(`/comments/${commentId}/like`);
      const updateLikes = (c) => ({
        ...c,
        likes: res.data.liked
          ? [...(c.likes || []), user._id]
          : (c.likes || []).filter((id) => id !== user._id),
      });

      setComments((prev) =>
        prev.map((c) => {
          if (!isReply && c._id === commentId) return updateLikes(c);
          if (isReply && c._id === parentId) {
            return { ...c, replies: c.replies.map((r) => r._id === commentId ? updateLikes(r) : r) };
          }
          return c;
        })
      );
    } catch {
      toast.error('Failed to like');
    }
  };

  // ── Delete (also removes replies for top-level comments) ─────────────────────
  const handleDelete = async (commentId, isReply, parentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      if (isReply) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === parentId
              ? { ...c, replies: c.replies.filter((r) => r._id !== commentId) }
              : c
          )
        );
      } else {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      }
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  // ── Toggle reply input ────────────────────────────────────────────────────────
  const toggleReplyInput = (commentId) => {
    setReplyingTo((prev) => (prev === commentId ? null : commentId));
    setReplyText('');
  };

  // ── Toggle expanded replies ───────────────────────────────────────────────────
  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      next.has(commentId) ? next.delete(commentId) : next.add(commentId);
      return next;
    });
  };

  // ── Shared item props (avoids repetition) ────────────────────────────────────
  const itemProps = {
    user,
    replyingTo,
    replyText,
    expandedReplies,
    onLike: handleLike,
    onDelete: handleDelete,
    onReplyToggle: toggleReplyInput,
    onReplyChange: setReplyText,
    onReplySubmit: handleReplySubmit,
    onToggleReplies: toggleReplies,
  };

  // ── Comment list (reused in both inline + panel) ─────────────────────────────
  const CommentList = ({ inPanel }) => (
    <div className="space-y-1">
      {comments.map((c) => (
        <CommentItem
          key={c._id}
          comment={c}
          isReply={false}
          parentId={null}
          onOpenPanel={inPanel ? null : () => setPanelOpen(true)}
          {...itemProps}
        />
      ))}
    </div>
  );

  // ── Panel body ────────────────────────────────────────────────────────────────
  const PanelContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <h2 className="font-semibold text-gray-900">
          Responses ({totalCount})
        </h2>
        <button
          onClick={() => setPanelOpen(false)}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
        >
          <FiX className="text-lg" />
        </button>
      </div>

      {/* Comment input */}
      {user ? (
        <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <CommentInput
            user={user}
            value={newComment}
            onChange={setNewComment}
            onSubmit={submitComment}
            submitting={submitting}
          />
        </div>
      ) : (
        <p className="px-6 py-4 text-sm text-gray-500 border-b border-gray-100 flex-shrink-0">
          <Link to="/login" className="text-medium-green hover:underline">Sign in</Link> to respond.
        </p>
      )}

      {/* Responses */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-400">No responses yet. Be the first!</p>
        ) : (
          <CommentList inPanel />
        )}
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <section className="mt-12">
      {/* Section heading */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setPanelOpen(true)}
          className="flex items-center gap-2 group"
        >
          <h3 className="text-xl font-bold text-gray-900">
            Responses ({totalCount})
          </h3>
          <FiMessageSquare className="text-gray-400 group-hover:text-gray-700 transition text-base" />
        </button>
      </div>

      {/* Inline comment input */}
      {user ? (
        <div className="mb-8 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <CommentInput
            user={user}
            value={newComment}
            onChange={setNewComment}
            onSubmit={submitComment}
            submitting={submitting}
          />
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-8">
          <Link to="/login" className="text-medium-green hover:underline">Sign in</Link> to leave a response.
        </p>
      )}

      {/* Inline comment list */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading responses…</p>
      ) : comments.length === 0 ? (
        <p className="text-gray-400 text-sm">No responses yet. Be the first!</p>
      ) : (
        <CommentList inPanel={false} />
      )}

      {/* ── Side panel ── */}
      {panelOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/25"
            onClick={() => setPanelOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[420px] bg-white shadow-2xl border-l border-gray-200 responses-panel">
            <PanelContent />
          </div>
        </>
      )}
    </section>
  );
}

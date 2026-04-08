import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiTrash2, FiHeart } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';

export default function CommentSection({ postId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/comments/${postId}`);
      setComments(res.data.comments);
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/comments/${postId}`, { content: newComment });
      setComments([res.data.comment, ...comments]);
      setNewComment('');
      toast.success('Comment added!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(comments.filter((c) => c._id !== commentId));
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleLike = async (commentId) => {
    if (!user) return toast.error('Please login to like');
    try {
      const res = await api.post(`/comments/${commentId}/like`);
      setComments(
        comments.map((c) =>
          c._id === commentId ? { ...c, likes: res.data.liked ? [...c.likes, user._id] : c.likes.filter((id) => id !== user._id) } : c
        )
      );
    } catch {
      toast.error('Failed to like comment');
    }
  };

  return (
    <section className="mt-12">
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        Responses ({comments.length})
      </h3>

      {/* Add comment */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="What are your thoughts?"
                rows={3}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="btn-green text-xs px-4 py-1.5"
                >
                  {submitting ? 'Posting...' : 'Respond'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <p className="text-sm text-gray-500 mb-8">
          <Link to="/login" className="text-green-600 hover:underline">Sign in</Link> to leave a response.
        </p>
      )}

      {/* Comment list */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading responses...</p>
      ) : comments.length === 0 ? (
        <p className="text-gray-400 text-sm">No responses yet. Be the first!</p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment._id} className="flex gap-3">
              <Link to={`/profile/${comment.author?._id}`}>
                <img
                  src={comment.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author?.name || 'A')}&background=random`}
                  alt={comment.author?.name}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                />
              </Link>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <Link to={`/profile/${comment.author?._id}`} className="text-sm font-semibold text-gray-900 hover:underline">
                      {comment.author?.name}
                    </Link>
                    <span className="text-xs text-gray-400 ml-2">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLike(comment._id)}
                      className={`flex items-center gap-1 text-xs transition ${
                        comment.likes?.includes(user?._id) ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
                      }`}
                    >
                      <FiHeart className="text-xs" />
                      <span>{comment.likes?.length || 0}</span>
                    </button>
                    {(user?._id === comment.author?._id || user?.isAdmin) && (
                      <button
                        onClick={() => handleDelete(comment._id)}
                        className="text-gray-300 hover:text-red-500 transition"
                      >
                        <FiTrash2 className="text-xs" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

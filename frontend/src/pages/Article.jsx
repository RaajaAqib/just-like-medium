import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  FiHeart, FiEdit2, FiTrash2, FiClock, FiEye, FiBookmark,
  FiMoreHorizontal, FiFlag, FiX
} from 'react-icons/fi';
import { MdOutlineWavingHand } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { useSavedPosts } from '../context/SavedPostsContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import CommentSection from '../components/CommentSection';

const REPORT_REASONS = [
  'Spam or misleading content',
  'Harassment or bullying',
  'Hate speech',
  'Misinformation',
  'Copyright infringement',
  'Graphic or violent content',
  'Privacy violation (doxing)',
  'Other',
];

function ReportStoryDialog({ onConfirm, onCancel }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Report this story</h3>
          <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <FiX />
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select a reason for reporting:</p>
        <div className="space-y-2 mb-5">
          {REPORT_REASONS.map(r => (
            <label key={r} className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="story-reason" value={r} checked={reason === r}
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

export default function Article() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isSaved, toggleSave } = useSavedPosts();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [claps, setClaps] = useState(0);
  const [clapCooldown, setClapCooldown] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => { fetchPost(); }, [slug]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/posts/${slug}`);
      const p = res.data.post;
      setPost(p);
      setLikesCount(p.likes?.length || 0);
      setClaps(p.claps || 0);
      if (user) {
        setLiked(p.likes?.includes(user._id));
        // Record in reading history (fire-and-forget)
        api.post(`/users/history/${p._id}`).catch(() => {});
      }
    } catch {
      toast.error('Post not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) return toast.error('Please login to like');
    try {
      const res = await api.post(`/posts/${post._id}/like`);
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to like post'); }
  };

  const handleClap = async () => {
    if (!user) return toast.error('Please login to clap');
    if (clapCooldown) return;
    setClapCooldown(true);
    setTimeout(() => setClapCooldown(false), 800);
    try {
      const res = await api.post(`/posts/${post._id}/clap`);
      setClaps(res.data.claps);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to clap'); }
  };

  const handleSave = async () => {
    if (!user) return toast.error('Please login to save');
    const result = await toggleSave(post._id);
    if (result !== null) toast.success(result ? 'Saved to library' : 'Removed from library');
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${post._id}`);
      toast.success('Post deleted');
      navigate('/');
    } catch { toast.error('Failed to delete post'); }
  };

  const handleReport = async (reason) => {
    try {
      await api.post(`/posts/${post._id}/report`, { reason });
      toast.success('Story reported — our team will review it');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to report'); }
    finally { setShowReport(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!post) return null;

  const isAuthor  = user?._id === post.author?._id;
  const canReport = user && !isAuthor;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Cover image */}
      {post.coverImage && (
        <img src={post.coverImage} alt={post.title}
          className="w-full h-auto max-h-[600px] object-contain bg-gray-50 dark:bg-gray-800 rounded-2xl mb-8" />
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map(tag => (
            <Link key={tag} to={`/?tag=${tag}`}
              className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full transition">
              {tag}
            </Link>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight font-serif mb-4">{post.title}</h1>

      {/* Author info & meta */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-6 mb-8">
        <Link to={`/profile/${post.author?._id}`} className="flex items-center gap-3">
          <img
            src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'A')}&background=random`}
            alt={post.author?.name} className="w-11 h-11 rounded-full object-cover" />
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{post.author?.name}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><FiClock /> {post.readTime} min read</span>
              <span>·</span>
              <span className="flex items-center gap-1"><FiEye /> {post.views}</span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          {/* Save button — always visible for logged-in users */}
          {user && (
            <button onClick={handleSave}
              className={`p-2 transition ${isSaved(post?._id) ? 'text-medium-black dark:text-gray-100' : 'text-gray-300 dark:text-gray-600 hover:text-medium-black dark:hover:text-gray-200'}`}
              title={isSaved(post?._id) ? 'Remove from library' : 'Save to library'}>
              <FiBookmark className={isSaved(post?._id) ? 'fill-current' : ''} />
            </button>
          )}

          {isAuthor ? (
            <>
              <Link to={`/edit/${post._id}`} className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
                <FiEdit2 />
              </Link>
              <button onClick={handleDelete} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 transition">
                <FiTrash2 />
              </button>
            </>
          ) : canReport && (
            <div ref={menuRef} className="relative">
              <button onClick={() => setMenuOpen(v => !v)}
                className="p-2 text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 transition rounded" title="More options">
                <FiMoreHorizontal />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-9 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 w-44">
                  <button onClick={() => { setMenuOpen(false); setShowReport(true); }}
                    className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <FiFlag className="text-sm" /> Report story
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="article-content" dangerouslySetInnerHTML={{ __html: post.content }} />

      {/* Like / Clap bar */}
      <div className="flex items-center gap-6 mt-12 pt-6 border-t border-gray-100 dark:border-gray-700">
        <button onClick={handleLike}
          className={`flex items-center gap-2 text-sm transition ${liked ? 'text-red-500' : 'text-gray-400 dark:text-gray-500 hover:text-red-400'}`}>
          <FiHeart className={`text-xl ${liked ? 'fill-current' : ''}`} />
          <span>{likesCount}</span>
        </button>

        <button onClick={handleClap}
          className={`flex items-center gap-2 text-sm transition ${clapCooldown ? 'text-yellow-500 scale-110' : 'text-gray-400 dark:text-gray-500 hover:text-yellow-500'}`}>
          <MdOutlineWavingHand className="text-xl" />
          <span>{claps}</span>
        </button>

        <button onClick={handleSave}
          className={`ml-auto flex items-center gap-2 text-sm transition ${isSaved(post?._id) ? 'text-medium-black dark:text-gray-100' : 'text-gray-400 dark:text-gray-500 hover:text-medium-black dark:hover:text-gray-200'}`}
          title={isSaved(post?._id) ? 'Remove from library' : 'Save to library'}>
          <FiBookmark className={`text-xl ${isSaved(post?._id) ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Author bio card */}
      <div className="mt-10 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-start gap-4">
        <Link to={`/profile/${post.author?._id}`}>
          <img
            src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'A')}&background=random`}
            alt={post.author?.name} className="w-14 h-14 rounded-full object-cover" />
        </Link>
        <div>
          <Link to={`/profile/${post.author?._id}`} className="font-semibold text-gray-900 dark:text-gray-100 hover:underline">
            {post.author?.name}
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
            {post.author?.bio || 'No bio available.'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {post.author?.followers?.length || 0} followers
          </p>
        </div>
      </div>

      <CommentSection postId={post._id} postAuthorId={post.author?._id} />

      {showReport && (
        <ReportStoryDialog onConfirm={handleReport} onCancel={() => setShowReport(false)} />
      )}
    </div>
  );
}

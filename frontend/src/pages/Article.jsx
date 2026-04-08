import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiHeart, FiEdit2, FiTrash2, FiClock, FiEye } from 'react-icons/fi';
import { MdOutlineWavingHand } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import CommentSection from '../components/CommentSection';

export default function Article() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [claps, setClaps] = useState(0);
  const [clapCooldown, setClapCooldown] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/posts/${slug}`);
      const p = res.data.post;
      setPost(p);
      setLikesCount(p.likes?.length || 0);
      setClaps(p.claps || 0);
      if (user) setLiked(p.likes?.includes(user._id));
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
    } catch {
      toast.error('Failed to like post');
    }
  };

  const handleClap = async () => {
    if (!user) return toast.error('Please login to clap');
    if (clapCooldown) return;
    setClapCooldown(true);
    setTimeout(() => setClapCooldown(false), 800);
    try {
      const res = await api.post(`/posts/${post._id}/clap`);
      setClaps(res.data.claps);
    } catch {
      toast.error('Failed to clap');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${post._id}`);
      toast.success('Post deleted');
      navigate('/');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!post) return null;

  const isAuthor = user?._id === post.author?._id;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Cover image */}
      {post.coverImage && (
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-72 object-cover rounded-2xl mb-8"
        />
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              to={`/?tag=${tag}`}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full transition"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-4xl font-bold text-gray-900 leading-tight font-serif mb-4">{post.title}</h1>

      {/* Author info & meta */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-8">
        <Link to={`/profile/${post.author?._id}`} className="flex items-center gap-3">
          <img
            src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'A')}&background=random`}
            alt={post.author?.name}
            className="w-11 h-11 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-sm text-gray-900">{post.author?.name}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><FiClock /> {post.readTime} min read</span>
              <span>·</span>
              <span className="flex items-center gap-1"><FiEye /> {post.views}</span>
            </div>
          </div>
        </Link>

        {/* Author actions */}
        {isAuthor && (
          <div className="flex items-center gap-2">
            <Link to={`/edit/${post._id}`} className="p-2 text-gray-400 hover:text-gray-700 transition">
              <FiEdit2 />
            </Link>
            <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-500 transition">
              <FiTrash2 />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Like / Clap bar */}
      <div className="flex items-center gap-6 mt-12 pt-6 border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 text-sm transition ${
            liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
          }`}
        >
          <FiHeart className={`text-xl ${liked ? 'fill-current' : ''}`} />
          <span>{likesCount}</span>
        </button>

        <button
          onClick={handleClap}
          className={`flex items-center gap-2 text-sm transition ${
            clapCooldown ? 'text-yellow-500 scale-110' : 'text-gray-400 hover:text-yellow-500'
          }`}
        >
          <MdOutlineWavingHand className="text-xl" />
          <span>{claps}</span>
        </button>
      </div>

      {/* Author bio card */}
      <div className="mt-10 p-6 bg-gray-50 rounded-2xl flex items-start gap-4">
        <Link to={`/profile/${post.author?._id}`}>
          <img
            src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'A')}&background=random`}
            alt={post.author?.name}
            className="w-14 h-14 rounded-full object-cover"
          />
        </Link>
        <div>
          <Link to={`/profile/${post.author?._id}`} className="font-semibold text-gray-900 hover:underline">
            {post.author?.name}
          </Link>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            {post.author?.bio || 'No bio available.'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {post.author?.followers?.length || 0} followers
          </p>
        </div>
      </div>

      {/* Comments */}
      <CommentSection postId={post._id} />
    </div>
  );
}

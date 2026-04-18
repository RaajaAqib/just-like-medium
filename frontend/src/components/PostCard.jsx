import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiBookmark } from 'react-icons/fi';
import { MdOutlineWavingHand } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { useSavedPosts } from '../context/SavedPostsContext';
import SaveToListDropdown from './SaveToListDropdown';
import UserBadges from './UserBadges';
import toast from 'react-hot-toast';

export default function PostCard({ post }) {
  const { user } = useAuth();
  const { isSaved } = useSavedPosts();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const saved = isSaved(post._id);
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  const handleSaveClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to save stories');
      navigate('/login');
      return;
    }
    setShowDropdown(v => !v);
  };

  return (
    <article className="py-6 sm:py-8 border-b border-medium-border dark:border-gray-700 group">
      {/* Author row */}
      <Link to={`/profile/${post.author?._id}`} className="flex items-center gap-2 mb-3">
        <img
          src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'A')}&background=random&size=24`}
          alt={post.author?.name}
          className="w-6 h-6 rounded-full object-cover"
        />
        <span className="text-sm text-medium-black dark:text-gray-300 hover:underline">{post.author?.name}</span>
        <UserBadges user={post.author} size="sm" />
      </Link>

      {/* Content row */}
      <div className="flex gap-4 sm:gap-8 items-start">
        <div className="flex-1 min-w-0">
          <Link to={`/article/${post.slug}`}>
            <h2 className="text-base sm:text-xl font-bold text-medium-black dark:text-gray-100 leading-snug mb-1 line-clamp-2 group-hover:underline decoration-1 underline-offset-2">
              {post.title}
            </h2>
            <p className="text-medium-gray dark:text-gray-400 text-sm leading-relaxed line-clamp-2 hidden sm:block">
              {post.excerpt}
            </p>
          </Link>

          {/* Meta row */}
          <div className="flex items-center justify-between mt-3 sm:mt-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-xs text-medium-gray dark:text-gray-500">{timeAgo}</span>
              {post.tags?.slice(0, 1).map(tag => (
                <Link key={tag} to={`/?tag=${tag}`}
                  className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-medium-black dark:text-gray-300 px-2.5 sm:px-3 py-1 rounded-full transition">
                  {tag}
                </Link>
              ))}
              <span className="text-xs text-medium-gray dark:text-gray-500">{post.readTime} min read</span>
              {post.likes?.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-medium-gray dark:text-gray-500">
                  <MdOutlineWavingHand className="text-xs" />
                  {post.likes.length}
                </span>
              )}
            </div>

            {/* Save button + dropdown */}
            <div className="relative flex-shrink-0">
              <button
                onClick={handleSaveClick}
                title={saved ? 'Saved to a list' : 'Save to list'}
                className={`p-1.5 rounded-full transition ${
                  saved
                    ? 'text-medium-black dark:text-gray-100'
                    : 'text-medium-gray dark:text-gray-500 hover:text-medium-black dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FiBookmark className={`text-base ${saved ? 'fill-current' : ''}`} />
              </button>

              {showDropdown && user && (
                <SaveToListDropdown
                  postId={post._id}
                  onClose={() => setShowDropdown(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Cover image */}
        {post.coverImage && (
          <Link to={`/article/${post.slug}`} className="flex-shrink-0">
            <img
              src={post.coverImage}
              alt={post.title}
              className="rounded object-cover"
              style={{ width: '112px', height: '80px', minWidth: '112px' }}
            />
          </Link>
        )}
      </div>
    </article>
  );
}

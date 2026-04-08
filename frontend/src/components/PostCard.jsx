import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiClock, FiHeart } from 'react-icons/fi';

export default function PostCard({ post }) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <article className="flex flex-col sm:flex-row gap-4 py-8 border-b border-gray-100 group">
      <div className="flex-1 min-w-0">
        {/* Author */}
        <Link to={`/profile/${post.author?._id}`} className="flex items-center gap-2 mb-2">
          <img
            src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'A')}&background=random&size=32`}
            alt={post.author?.name}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-sm font-medium text-gray-800 hover:text-gray-600">{post.author?.name}</span>
        </Link>

        {/* Title & Excerpt */}
        <Link to={`/article/${post.slug}`}>
          <h2 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-gray-600 transition line-clamp-2 mb-1">
            {post.title}
          </h2>
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{post.excerpt}</p>
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <span className="text-xs text-gray-400">{timeAgo}</span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <FiClock className="text-xs" /> {post.readTime} min read
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <FiHeart className="text-xs" /> {post.likes?.length || 0}
          </span>
          <div className="flex flex-wrap gap-1">
            {post.tags?.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                to={`/?tag=${tag}`}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full transition"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Cover image */}
      {post.coverImage && (
        <Link to={`/article/${post.slug}`} className="flex-shrink-0">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full sm:w-32 h-28 sm:h-24 object-cover rounded-lg"
          />
        </Link>
      )}
    </article>
  );
}

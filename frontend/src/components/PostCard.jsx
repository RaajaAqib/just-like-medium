import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiBookmark } from 'react-icons/fi';
import { MdOutlineWavingHand } from 'react-icons/md';

export default function PostCard({ post }) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <article className="py-8 border-b border-medium-border group">
      {/* Author row */}
      <Link to={`/profile/${post.author?._id}`} className="flex items-center gap-2 mb-3">
        <img
          src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'A')}&background=random&size=24`}
          alt={post.author?.name}
          className="w-6 h-6 rounded-full object-cover"
        />
        <span className="text-sm text-medium-black hover:underline">{post.author?.name}</span>
      </Link>

      {/* Content row */}
      <div className="flex gap-8 items-start">
        <div className="flex-1 min-w-0">
          <Link to={`/article/${post.slug}`}>
            <h2 className="text-xl font-bold text-medium-black leading-snug mb-1 line-clamp-2 group-hover:underline decoration-1 underline-offset-2">
              {post.title}
            </h2>
            <p className="text-medium-gray text-sm leading-relaxed line-clamp-2 hidden sm:block">
              {post.excerpt}
            </p>
          </Link>

          {/* Meta row */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-medium-gray">{timeAgo}</span>
              {post.tags?.slice(0, 1).map(tag => (
                <Link key={tag} to={`/?tag=${tag}`}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-medium-black px-3 py-1 rounded-full transition">
                  {tag}
                </Link>
              ))}
              <span className="text-xs text-medium-gray">{post.readTime} min read</span>
              {post.likes?.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-medium-gray">
                  <MdOutlineWavingHand className="text-xs" />
                  {post.likes.length}
                </span>
              )}
            </div>
            <button className="p-1 text-medium-gray hover:text-medium-black transition flex-shrink-0">
              <FiBookmark className="text-base" />
            </button>
          </div>
        </div>

        {/* Cover image */}
        {post.coverImage && (
          <Link to={`/article/${post.slug}`} className="flex-shrink-0">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-28 h-20 sm:w-36 sm:h-24 object-cover rounded-sm"
            />
          </Link>
        )}
      </div>
    </article>
  );
}

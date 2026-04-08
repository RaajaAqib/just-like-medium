import { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { FiBookmark, FiClock } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';

export default function Library() {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('saved');

  useEffect(() => {
    api.get('/users/me/saved')
      .then(res => setSavedPosts(res.data.savedPosts || []))
      .catch(() => toast.error('Failed to load library'))
      .finally(() => setLoading(false));
  }, []);

  const handleUnsave = async (postId) => {
    try {
      await api.post(`/users/save-post/${postId}`);
      setSavedPosts(savedPosts.filter(p => p._id !== postId));
      toast.success('Removed from library');
    } catch {
      toast.error('Failed to unsave');
    }
  };

  const tabs = [
    { key: 'saved', label: 'Reading list' },
    { key: 'history', label: 'Reading history' },
  ];

  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold font-serif text-medium-black">Your library</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-medium-border mb-8">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition ${activeTab === t.key ? 'border-medium-black text-medium-black' : 'border-transparent text-medium-gray hover:text-medium-black'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            {activeTab === 'saved' && (
              savedPosts.length === 0 ? (
                <div className="text-center py-20 border-t border-medium-border">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <FiBookmark className="text-medium-gray text-2xl" />
                  </div>
                  <p className="text-medium-black font-medium mb-2">Your reading list is empty</p>
                  <p className="text-medium-gray text-sm mb-6">
                    Click the bookmark icon on any story to save it here for later.
                  </p>
                  <Link to="/" className="btn-black px-6 py-2 text-sm">Browse stories</Link>
                </div>
              ) : (
                <div className="space-y-0 divide-y divide-medium-border">
                  {savedPosts.map(post => (
                    <div key={post._id} className="flex gap-4 py-5">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <img
                            src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'U')}&background=random`}
                            className="w-5 h-5 rounded-full object-cover"
                            alt={post.author?.name}
                          />
                          <span className="text-xs text-medium-gray">{post.author?.name}</span>
                        </div>
                        <Link to={`/article/${post.slug}`}
                          className="font-bold text-medium-black hover:underline text-base line-clamp-2 leading-snug">
                          {post.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-medium-gray flex items-center gap-1">
                            <FiClock className="text-xs" />
                            {post.readTime || 1} min read
                          </span>
                          <span className="text-xs text-medium-gray">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                          </span>
                          <button
                            onClick={() => handleUnsave(post._id)}
                            className="text-xs text-medium-gray hover:text-red-500 transition ml-auto flex items-center gap-1"
                          >
                            <FiBookmark className="text-sm fill-current" />
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Cover */}
                      {post.coverImage && (
                        <Link to={`/article/${post.slug}`} className="flex-shrink-0">
                          <img src={post.coverImage} alt={post.title}
                            className="w-24 h-16 object-cover rounded" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'history' && (
              <div className="text-center py-20 text-medium-gray">
                <p className="text-sm">Reading history coming soon.</p>
              </div>
            )}
          </>
        )}
      </div>
    </SidebarLayout>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiEdit2, FiTrash2, FiMoreHorizontal } from 'react-icons/fi';
import SidebarLayout from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function MyStories() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('published');
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.get(`/users/${user._id}`)
      .then(res => setPosts(res.data.posts || []))
      .catch(() => toast.error('Failed to load stories'))
      .finally(() => setLoading(false));
  }, [user]);

  const published = posts.filter(p => p.published);
  const drafts = posts.filter(p => !p.published);
  const displayed = activeTab === 'published' ? published : drafts;

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this story?')) return;
    try {
      await api.delete(`/posts/${id}`);
      setPosts(posts.filter(p => p._id !== id));
      toast.success('Story deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const tabs = [
    { key: 'drafts', label: `Drafts ${drafts.length}` },
    { key: 'published', label: 'Published' },
    { key: 'unlisted', label: 'Unlisted' },
  ];

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold font-serif text-medium-black">Stories</h1>
          <Link to="/write" className="btn-black-outline text-sm px-5 py-2">Import a story</Link>
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

        {loading ? <LoadingSpinner /> : displayed.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-medium-gray mb-4">No stories yet.</p>
            <Link to="/write" className="btn-black px-6 py-2 text-sm">Write a story</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 text-xs text-medium-gray font-medium border-b border-medium-border pb-2 mb-2 px-1">
              <span>Latest</span>
              <span className="text-center">Publication</span>
              <span className="text-right">Status</span>
            </div>
            <div className="space-y-1">
              {displayed.map(post => (
                <div key={post._id} className="flex items-center gap-4 py-4 border-b border-medium-border hover:bg-gray-50 px-1 rounded group relative">
                  {/* Thumbnail */}
                  <div className="w-16 h-12 flex-shrink-0">
                    {post.coverImage
                      ? <img src={post.coverImage} alt="" className="w-full h-full object-cover rounded" />
                      : <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-xs text-medium-gray">No img</span>
                        </div>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/article/${post.slug}`} className="font-bold text-medium-black hover:underline text-sm line-clamp-1">
                      {post.title}
                    </Link>
                    <p className="text-xs text-medium-gray mt-0.5">
                      {post.readTime} min read ({post.content?.replace(/<[^>]+>/g,'').split(/\s+/).length || 0} words) ·
                      Updated {formatDistanceToNow(new Date(post.updatedAt || post.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Publication */}
                  <div className="hidden md:block w-32 text-xs text-medium-gray text-center">—</div>

                  {/* Status */}
                  <div className="hidden md:block w-20 text-xs text-right">
                    <span className={`px-2 py-0.5 rounded-full ${post.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-medium-gray'}`}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  {/* Actions menu */}
                  <div className="relative">
                    <button onClick={() => setOpenMenu(openMenu === post._id ? null : post._id)}
                      className="p-1.5 text-medium-gray hover:text-medium-black opacity-0 group-hover:opacity-100 transition">
                      <FiMoreHorizontal />
                    </button>
                    {openMenu === post._id && (
                      <div className="absolute right-0 top-8 bg-white border border-medium-border rounded shadow-lg py-1 z-10 w-36"
                        onMouseLeave={() => setOpenMenu(null)}>
                        <Link to={`/edit/${post._id}`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-medium-black hover:bg-gray-50">
                          <FiEdit2 className="text-xs" /> Edit story
                        </Link>
                        <button onClick={() => handleDelete(post._id)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                          <FiTrash2 className="text-xs" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  );
}

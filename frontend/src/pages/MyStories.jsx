import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiEdit2, FiTrash2, FiMoreHorizontal, FiX } from 'react-icons/fi';
import SidebarLayout from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function MyStories() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('published');
  const [openMenu, setOpenMenu] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get('/users/me/posts')
      .then(res => setPosts(res.data.posts || []))
      .catch(() => toast.error('Failed to load stories'))
      .finally(() => setLoading(false));
  }, [user]);

  const published = posts.filter(p => p.published);
  const drafts    = posts.filter(p => !p.published);
  const displayed = activeTab === 'published' ? published : drafts;

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this story?')) return;
    try {
      await api.delete(`/posts/${id}`);
      setPosts(posts.filter(p => p._id !== id));
      toast.success('Story deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleImport = async () => {
    if (!importTitle.trim()) return toast.error('Please enter a title');
    if (!importText.trim()) return toast.error('Please paste some content');
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('title', importTitle.trim());
      formData.append('content', `<p>${importText.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`);
      formData.append('published', 'false');
      const res = await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Story imported as draft!');
      setImportOpen(false); setImportText(''); setImportTitle('');
      navigate(`/edit/${res.data.post._id}`);
    } catch { toast.error('Failed to import'); }
    finally { setImporting(false); }
  };

  const tabs = [
    { key: 'drafts',    label: `Drafts ${drafts.length}` },
    { key: 'published', label: 'Published' },
    { key: 'unlisted',  label: 'Unlisted' },
  ];

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-medium-black dark:text-gray-100">Stories</h1>
          <button onClick={() => setImportOpen(true)} className="btn-black-outline text-xs sm:text-sm px-3 sm:px-5 py-2 flex-shrink-0">Import a story</button>
        </div>

        <div className="flex gap-6 border-b border-medium-border dark:border-gray-700 mb-8">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition ${activeTab === t.key ? 'border-medium-black dark:border-gray-200 text-medium-black dark:text-gray-100' : 'border-transparent text-medium-gray dark:text-gray-500 hover:text-medium-black dark:hover:text-gray-200'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : displayed.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-medium-gray dark:text-gray-500 mb-4">No stories yet.</p>
            <Link to="/write" className="btn-black px-6 py-2 text-sm">Write a story</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 text-xs text-medium-gray dark:text-gray-500 font-medium border-b border-medium-border dark:border-gray-700 pb-2 mb-2 px-1">
              <span>Latest</span>
              <span className="text-center">Publication</span>
              <span className="text-right">Status</span>
            </div>
            <div className="space-y-1">
              {displayed.map(post => (
                <div key={post._id} className="flex items-center gap-4 py-4 border-b border-medium-border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 px-1 rounded group relative">
                  <div className="w-16 h-12 flex-shrink-0">
                    {post.coverImage
                      ? <img src={post.coverImage} alt="" className="w-full h-full object-cover rounded" />
                      : <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                          <span className="text-xs text-medium-gray dark:text-gray-500">No img</span>
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/article/${post.slug}`} className="font-bold text-medium-black dark:text-gray-100 hover:underline text-sm line-clamp-1">
                      {post.title}
                    </Link>
                    <p className="text-xs text-medium-gray dark:text-gray-500 mt-0.5">
                      {post.readTime} min read · Updated {formatDistanceToNow(new Date(post.updatedAt || post.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="hidden md:block w-32 text-xs text-medium-gray dark:text-gray-500 text-center">—</div>
                  <div className="hidden md:block w-20 text-xs text-right">
                    <span className={`px-2 py-0.5 rounded-full ${post.published ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-medium-gray dark:text-gray-400'}`}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="relative">
                    <button onClick={() => setOpenMenu(openMenu === post._id ? null : post._id)}
                      className="p-1.5 text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100 opacity-0 group-hover:opacity-100 transition">
                      <FiMoreHorizontal />
                    </button>
                    {openMenu === post._id && (
                      <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-medium-border dark:border-gray-700 rounded shadow-lg py-1 z-10 w-36"
                        onMouseLeave={() => setOpenMenu(null)}>
                        <Link to={`/edit/${post._id}`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <FiEdit2 className="text-xs" /> Edit story
                        </Link>
                        <button onClick={() => handleDelete(post._id)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700">
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

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-medium-black dark:text-gray-100">Import a story</h2>
              <button onClick={() => setImportOpen(false)} className="text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100">
                <FiX className="text-xl" />
              </button>
            </div>
            <p className="text-sm text-medium-gray dark:text-gray-400 mb-4">
              Paste your story text below. It will be saved as a draft that you can edit and publish.
            </p>
            <input type="text" value={importTitle} onChange={e => setImportTitle(e.target.value)}
              placeholder="Story title" className="input-field mb-3" />
            <textarea value={importText} onChange={e => setImportText(e.target.value)}
              placeholder="Paste your story content here..." rows={8}
              className="input-field mb-4 resize-none" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setImportOpen(false)} className="btn-black-outline text-sm px-5 py-2">Cancel</button>
              <button onClick={handleImport} disabled={importing} className="btn-black text-sm px-5 py-2">
                {importing ? 'Importing...' : 'Import as draft'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}

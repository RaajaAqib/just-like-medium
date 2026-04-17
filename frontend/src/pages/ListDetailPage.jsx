import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SidebarLayout from '../components/SidebarLayout';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import PostCard from '../components/PostCard';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { FiArrowLeft, FiLock, FiGlobe, FiTrash2, FiEdit2, FiX, FiCheck } from 'react-icons/fi';

function EditListModal({ list, onClose, onSave }) {
  const [name, setName]           = useState(list.name);
  const [description, setDesc]    = useState(list.description || '');
  const [isPrivate, setIsPrivate] = useState(list.isPrivate);
  const [saving, setSaving]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await api.put(`/lists/${list._id}`, { name: name.trim(), description: description.trim(), isPrivate });
      onSave(res.data.list);
      toast.success('List updated');
      onClose();
    } catch { toast.error('Failed to update list'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6 border border-medium-border dark:border-gray-700">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-medium-black dark:text-gray-100 font-serif">Edit list</h2>
          <button onClick={onClose} className="p-1 text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100">
            <FiX className="text-xl" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-medium-black dark:text-gray-200 mb-1.5">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={100}
              className="w-full border border-medium-border dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-medium-black dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-medium-black dark:focus:ring-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-medium-black dark:text-gray-200 mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} maxLength={280} rows={3}
              className="w-full border border-medium-border dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-medium-black dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-medium-black dark:focus:ring-gray-400 resize-none" />
          </div>
          <div className="flex items-center justify-between py-2 border-t border-medium-border dark:border-gray-700">
            <div className="flex items-center gap-2">
              {isPrivate ? <FiLock className="text-sm text-medium-gray" /> : <FiGlobe className="text-sm text-medium-gray" />}
              <div>
                <p className="text-sm font-medium text-medium-black dark:text-gray-200">{isPrivate ? 'Private' : 'Public'}</p>
                <p className="text-xs text-medium-gray dark:text-gray-500">{isPrivate ? 'Only you can see this' : 'Anyone can see this'}</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsPrivate(p => !p)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isPrivate ? 'bg-gray-300 dark:bg-gray-600' : 'bg-medium-black dark:bg-gray-200'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isPrivate ? 'translate-x-0' : 'translate-x-5'}`} />
            </button>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium border border-medium-border dark:border-gray-600 rounded-full text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving || !name.trim()}
              className="flex-1 px-4 py-2.5 text-sm font-medium bg-medium-black dark:bg-gray-100 text-white dark:text-gray-900 rounded-full hover:opacity-90 disabled:opacity-50 transition">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ListDetailContent({ id }) {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [list, setList]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const isOwner = user && list && list.owner?._id === user._id;

  useEffect(() => {
    api.get(`/lists/${id}`)
      .then(res => setList(res.data.list))
      .catch(err => {
        toast.error(err.response?.data?.message || 'List not found');
        navigate('/library');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this list? This cannot be undone.')) return;
    try {
      await api.delete(`/lists/${id}`);
      toast.success('List deleted');
      navigate('/library');
    } catch { toast.error('Failed to delete list'); }
  };

  const handleRemovePost = async (postId) => {
    try {
      await api.delete(`/lists/${id}/posts/${postId}`);
      setList(prev => ({ ...prev, posts: prev.posts.filter(p => p._id !== postId) }));
      toast.success('Story removed from list');
    } catch { toast.error('Failed to remove story'); }
  };

  if (loading) return <div className="py-20"><LoadingSpinner /></div>;
  if (!list) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

      {/* Back link */}
      <Link to="/library" className="flex items-center gap-1.5 text-sm text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-200 transition mb-6">
        <FiArrowLeft className="text-base" />
        Your library
      </Link>

      {/* List header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {list.isPrivate
                ? <FiLock className="text-medium-gray dark:text-gray-500 text-xs" />
                : <FiGlobe className="text-medium-gray dark:text-gray-500 text-xs" />}
              <span className="text-xs text-medium-gray dark:text-gray-500">
                {list.isPrivate ? 'Private' : 'Public'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-medium-black dark:text-gray-100 leading-tight mb-2">
              {list.name}
            </h1>
            {list.description && (
              <p className="text-base text-medium-gray dark:text-gray-400 leading-relaxed mb-3">
                {list.description}
              </p>
            )}
            <p className="text-sm text-medium-gray dark:text-gray-500">
              {list.posts?.length || 0} {(list.posts?.length || 0) === 1 ? 'story' : 'stories'}
              {' · '}Updated {formatDistanceToNow(new Date(list.updatedAt), { addSuffix: true })}
            </p>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 text-sm text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-200 transition px-3 py-1.5 border border-medium-border dark:border-gray-600 rounded-full"
              >
                <FiEdit2 className="text-sm" /> Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-sm text-medium-gray dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition px-3 py-1.5 border border-medium-border dark:border-gray-600 rounded-full"
              >
                <FiTrash2 className="text-sm" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stories */}
      {list.posts?.length === 0 ? (
        <div className="text-center py-16 border-t border-medium-border dark:border-gray-700">
          <p className="text-medium-black dark:text-gray-200 font-medium mb-2">This list is empty</p>
          <p className="text-medium-gray dark:text-gray-500 text-sm mb-6">
            Save stories to this list using the bookmark icon on any story.
          </p>
          <Link to="/" className="btn-black px-6 py-2 text-sm">Browse stories</Link>
        </div>
      ) : (
        <div className="divide-y divide-medium-border dark:divide-gray-700">
          {list.posts.map(post => (
            <div key={post._id} className="relative">
              <PostCard post={post} />
              {/* Remove from list button (owner only) */}
              {isOwner && (
                <button
                  onClick={() => handleRemovePost(post._id)}
                  className="absolute top-6 right-0 flex items-center gap-1 text-xs text-medium-gray dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition"
                  title="Remove from list"
                >
                  <FiX className="text-sm" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showEdit && (
        <EditListModal
          list={list}
          onClose={() => setShowEdit(false)}
          onSave={(updated) => setList(prev => ({ ...prev, ...updated }))}
        />
      )}
    </div>
  );
}

export default function ListDetailPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return null;

  if (user) {
    return (
      <SidebarLayout>
        <ListDetailContent id={id} />
      </SidebarLayout>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <ListDetailContent id={id} />
    </div>
  );
}

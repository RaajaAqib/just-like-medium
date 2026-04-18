import { useState, useEffect, useRef } from 'react';
import { FiBookmark, FiCheck, FiPlus, FiLock, FiGlobe } from 'react-icons/fi';
import { useSavedPosts } from '../context/SavedPostsContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';

export default function SaveToListDropdown({ postId, onClose }) {
  const { isSaved, toggleSave, markAsSaved, markAsUnsaved } = useSavedPosts();
  const [lists, setLists]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName]   = useState('');
  const [saving, setSaving]     = useState(false);
  const ref     = useRef(null);
  const inputRef = useRef(null);

  // Fetch user's custom lists
  useEffect(() => {
    api.get('/lists/me')
      .then(res => setLists(res.data.lists || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Focus the input when inline create opens
  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const isInList = (list) =>
    list.posts?.some(p => (p._id || p).toString() === postId.toString());

  const handleToggleList = async (list) => {
    const inList = isInList(list);
    try {
      if (inList) {
        await api.delete(`/lists/${list._id}/posts/${postId}`);
        const updatedLists = lists.map(l => l._id === list._id
          ? { ...l, posts: l.posts.filter(p => (p._id || p).toString() !== postId.toString()) }
          : l
        );
        setLists(updatedLists);
        // Un-fill bookmark only if post is no longer in any custom list AND not in reading list
        const stillInAnyList = updatedLists.some(l =>
          l.posts?.some(p => (p._id || p).toString() === postId.toString())
        );
        if (!stillInAnyList && !isSaved(postId)) markAsUnsaved(postId);
      } else {
        await api.post(`/lists/${list._id}/posts/${postId}`);
        setLists(prev => prev.map(l => l._id === list._id
          ? { ...l, posts: [...(l.posts || []), { _id: postId }] }
          : l
        ));
        markAsSaved(postId); // Fill bookmark immediately
        toast.success(`Saved to "${list.name}"`);
      }
    } catch { toast.error('Failed to update list'); }
  };

  const handleCreateAndSave = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await api.post('/lists', { name: newName.trim(), isPrivate: true });
      const newList = { ...res.data.list, posts: [{ _id: postId }] };
      await api.post(`/lists/${newList._id}/posts/${postId}`);
      setLists(prev => [newList, ...prev]);
      markAsSaved(postId); // Fill bookmark immediately
      setNewName('');
      setCreating(false);
      toast.success(`Saved to "${newList.name}"`);
    } catch { toast.error('Failed to create list'); }
    finally { setSaving(false); }
  };

  const readingListSaved = isSaved(postId);

  return (
    <div
      ref={ref}
      className="absolute z-50 bottom-full right-0 mb-2 w-64 bg-white dark:bg-gray-900 border border-medium-border dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-medium-border dark:border-gray-700">
        <p className="text-sm font-semibold text-medium-black dark:text-gray-100">Save to list</p>
      </div>

      {/* List items */}
      <div className="max-h-52 overflow-y-auto">
        {/* Default Reading list */}
        <button
          onClick={async () => {
            const result = await toggleSave(postId);
            if (result !== null) {
              toast.success(result ? 'Saved to Reading list' : 'Removed from Reading list');
            }
          }}
          className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <FiBookmark className="text-sm flex-shrink-0 text-medium-gray dark:text-gray-400" />
            <span className="text-sm text-medium-black dark:text-gray-200 truncate">Reading list</span>
          </div>
          {readingListSaved && (
            <FiCheck className="text-sm text-medium-green dark:text-green-400 flex-shrink-0 ml-2" />
          )}
        </button>

        {/* Custom lists */}
        {loading ? (
          <div className="px-4 py-3 text-xs text-medium-gray dark:text-gray-500">Loading lists…</div>
        ) : (
          lists.map(list => {
            const inList = isInList(list);
            return (
              <button
                key={list._id}
                onClick={() => handleToggleList(list)}
                className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {list.isPrivate
                    ? <FiLock className="text-sm flex-shrink-0 text-medium-gray dark:text-gray-400" />
                    : <FiGlobe className="text-sm flex-shrink-0 text-medium-gray dark:text-gray-400" />}
                  <span className="text-sm text-medium-black dark:text-gray-200 truncate">{list.name}</span>
                </div>
                {inList && (
                  <FiCheck className="text-sm text-medium-green dark:text-green-400 flex-shrink-0 ml-2" />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Create new list */}
      <div className="border-t border-medium-border dark:border-gray-700">
        {creating ? (
          <div className="px-3 py-3 space-y-2">
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateAndSave();
                if (e.key === 'Escape') { setCreating(false); setNewName(''); }
              }}
              placeholder="List name…"
              maxLength={100}
              className="w-full border border-medium-border dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-medium-black dark:text-gray-100 bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-medium-black dark:focus:ring-gray-400"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setCreating(false); setNewName(''); }}
                className="flex-1 text-xs py-1.5 border border-medium-border dark:border-gray-600 rounded-full text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAndSave}
                disabled={saving || !newName.trim()}
                className="flex-1 text-xs py-1.5 bg-medium-black dark:bg-gray-100 text-white dark:text-gray-900 rounded-full hover:opacity-90 disabled:opacity-50 transition"
              >
                {saving ? 'Creating…' : 'Create & save'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <FiPlus className="text-base flex-shrink-0" />
            New list
          </button>
        )}
      </div>
    </div>
  );
}

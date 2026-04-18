import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/axios';

const SavedPostsContext = createContext(null);

export const SavedPostsProvider = ({ children }) => {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  const loadSaved = useCallback(async () => {
    if (!user) { setSavedIds(new Set()); setLoaded(true); return; }
    try {
      const res = await api.get('/users/me/saved');
      const ids = (res.data.savedPosts || []).map(p => p._id);
      setSavedIds(new Set(ids));
    } catch {
      setSavedIds(new Set());
    } finally {
      setLoaded(true);
    }
  }, [user]);

  useEffect(() => { loadSaved(); }, [loadSaved]);

  const toggleSave = async (postId) => {
    if (!user) return false;
    try {
      const res = await api.post(`/users/save-post/${postId}`);
      setSavedIds(prev => {
        const next = new Set(prev);
        if (res.data.saved) next.add(postId);
        else next.delete(postId);
        return next;
      });
      return res.data.saved;
    } catch {
      return null;
    }
  };

  const isSaved = (postId) => savedIds.has(postId);

  // Called when a post is added to ANY custom list — marks bookmark as filled
  const markAsSaved = (postId) => {
    setSavedIds(prev => { const next = new Set(prev); next.add(postId); return next; });
  };

  // Called when a post is removed — only un-fills bookmark if not in reading list
  const markAsUnsaved = (postId) => {
    setSavedIds(prev => { const next = new Set(prev); next.delete(postId); return next; });
  };

  return (
    <SavedPostsContext.Provider value={{ savedIds, isSaved, toggleSave, markAsSaved, markAsUnsaved, loaded }}>
      {children}
    </SavedPostsContext.Provider>
  );
};

export const useSavedPosts = () => {
  const ctx = useContext(SavedPostsContext);
  if (!ctx) throw new Error('useSavedPosts must be used within SavedPostsProvider');
  return ctx;
};

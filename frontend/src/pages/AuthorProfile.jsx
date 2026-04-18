import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import SidebarLayout from '../components/SidebarLayout';
import Navbar from '../components/Navbar';
import { formatDistanceToNow, format } from 'date-fns';
import {
  FiEdit2, FiX, FiMessageCircle, FiCalendar, FiUsers,
  FiMoreHorizontal, FiVolumeX, FiVolume2, FiUserMinus, FiUserPlus,
  FiLink, FiSlash, FiFlag, FiBookmark,
} from 'react-icons/fi';
import UserBadges from '../components/UserBadges';

// ── Followers / Following modal ───────────────────────────────────────────────
function UsersModal({ title, users, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-medium-black dark:text-gray-100">{title}</h3>
          <button onClick={onClose} className="p-1 text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100 transition">
            <FiX className="text-xl" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
          {users.length === 0 ? (
            <p className="px-5 py-8 text-sm text-medium-gray dark:text-gray-400 text-center">No users yet.</p>
          ) : (
            users.map(u => (
              <Link key={u._id || u} to={`/profile/${u._id || u}`} onClick={onClose}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <img
                  src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=random&size=40`}
                  alt={u.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-medium-black dark:text-gray-100 text-sm truncate">{u.name || 'User'}</p>
                  {u.bio && <p className="text-xs text-medium-gray dark:text-gray-400 truncate">{u.bio}</p>}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Edit profile modal ────────────────────────────────────────────────────────
function EditProfileModal({ profile, onClose, onSave }) {
  const [form, setForm]           = useState({ name: profile.name, bio: profile.bio || '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar || '');
  const [saving, setSaving]       = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('bio', form.bio);
      if (avatarFile) formData.append('avatar', avatarFile);
      const res = await api.put('/users/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSave(res.data.user);
      toast.success('Profile updated!');
      onClose();
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6 border border-medium-border dark:border-gray-700">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-medium-black dark:text-gray-100 font-serif">Edit profile</h2>
          <button onClick={onClose} className="p-1 text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100">
            <FiX className="text-xl" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'U')}&background=random&size=80`}
                alt="avatar" className="w-16 h-16 rounded-full object-cover" />
              <label className="absolute bottom-0 right-0 p-1.5 bg-gray-900 dark:bg-gray-100 rounded-full cursor-pointer">
                <FiEdit2 className="text-white dark:text-gray-900 text-xs" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium text-medium-black dark:text-gray-200">Profile photo</p>
              <p className="text-xs text-medium-gray dark:text-gray-400">Click the pencil to change</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-medium-black dark:text-gray-200 mb-1.5">Name</label>
            <input type="text" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-medium-border dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-medium-black dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-medium-black dark:focus:ring-gray-400"
              placeholder="Your name" />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-medium-black dark:text-gray-200 mb-1.5">Bio</label>
            <textarea value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              className="w-full border border-medium-border dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-medium-black dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-medium-black dark:focus:ring-gray-400 resize-none"
              rows={3} placeholder="Tell the world about yourself…" maxLength={300} />
            <p className="text-xs text-medium-gray dark:text-gray-500 mt-1 text-right">{form.bio.length}/300</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium border border-medium-border dark:border-gray-600 rounded-full text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving || !form.name.trim()}
              className="flex-1 px-4 py-2.5 text-sm font-medium bg-medium-black dark:bg-gray-100 text-white dark:text-gray-900 rounded-full hover:opacity-90 transition disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sidebar following row with ··· menu ───────────────────────────────────────
function SidebarFollowingRow({ u, currentUser }) {
  const [open, setOpen]       = useState(false);
  const [following, setFollowing] = useState(
    currentUser ? (currentUser.following || []).some(f => (f._id || f) === u._id) : false
  );
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    if (!currentUser) { toast.error('Please log in'); return; }
    try {
      const res = await api.post(`/users/${u._id}/follow`);
      setFollowing(res.data.following);
      toast.success(res.data.following ? `Following ${u.name}` : `Unfollowed ${u.name}`);
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="flex items-center justify-between gap-2 py-1.5 group">
      <Link to={`/profile/${u._id}`} className="flex items-center gap-2.5 min-w-0">
        <img
          src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=random&size=32`}
          alt={u.name}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
        <span className="text-sm text-medium-black dark:text-gray-200 group-hover:underline truncate">{u.name}</span>
      </Link>

      {currentUser && (
        <div className="relative flex-shrink-0" ref={ref}>
          <button
            onClick={(e) => { e.preventDefault(); setOpen(v => !v); }}
            className="p-1 rounded-full text-medium-gray dark:text-gray-500 hover:text-medium-black dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition opacity-0 group-hover:opacity-100"
          >
            <FiMoreHorizontal size={15} />
          </button>
          {open && (
            <div className="absolute right-0 top-7 w-44 bg-white dark:bg-gray-800 border border-medium-border dark:border-gray-600 rounded-lg shadow-xl py-1 z-30">
              <button
                onClick={handleFollow}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
              >
                {following ? <FiUserMinus size={14} /> : <FiUserPlus size={14} />}
                {following ? `Unfollow` : `Follow`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Report user modal ─────────────────────────────────────────────────────────
const REPORT_REASONS = [
  'Harassment or bullying',
  'Hate speech or discrimination',
  'Spam or misleading content',
  'Impersonation',
  'Sharing private information',
  'Other',
];

function ReportUserModal({ name, onClose, onSubmit }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(reason);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-medium-black dark:text-gray-100">Report {name}</h3>
          <button onClick={onClose} className="p-1 text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-100 transition">
            <FiX className="text-xl" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <p className="text-sm text-medium-gray dark:text-gray-400">
            Why are you reporting this author? Our team will review your report.
          </p>
          <div className="space-y-2">
            {REPORT_REASONS.map(r => (
              <label key={r} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-medium-black dark:accent-gray-200"
                />
                <span className="text-sm text-medium-black dark:text-gray-200 group-hover:text-medium-black">
                  {r}
                </span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium border border-medium-border dark:border-gray-600 rounded-full text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-500 text-white rounded-full hover:bg-red-600 transition disabled:opacity-50">
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'home',     label: 'Home' },
  { key: 'activity', label: 'Activity' },
  { key: 'lists',    label: 'Lists' },
  { key: 'about',    label: 'About' },
];

function ProfileContent({ id }) {
  const { user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'home';

  const [profile, setProfile]           = useState(null);
  const [posts, setPosts]               = useState([]);
  const [activity, setActivity]         = useState([]);
  const [publicLists, setPublicLists]   = useState([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [following, setFollowing]       = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [muted, setMuted]               = useState(false);
  const [blocked, setBlocked]           = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [modal, setModal]               = useState(null); // 'followers' | 'following'
  const [showEdit, setShowEdit]         = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef                   = useRef(null);
  const moreMenuRef                     = useRef(null);

  // Close more menu on outside click
  useEffect(() => {
    if (!showMoreMenu) return;
    function handler(e) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMoreMenu]);

  const isOwn = user?._id === id;

  useEffect(() => {
    setLoading(true);
    api.get(`/users/${id}`)
      .then(res => {
        setProfile(res.data.user);
        setPosts(res.data.posts);
        setFollowersCount(res.data.user.followers?.length || 0);
        if (user) setFollowing(res.data.user.followers?.some(f => f._id === user._id || f === user._id));
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [id]);

  // Lazy-load activity
  useEffect(() => {
    if (activeTab !== 'activity' || activity.length > 0) return;
    setActivityLoading(true);
    api.get(`/users/${id}/activity`)
      .then(res => setActivity(res.data.activity || []))
      .catch(() => toast.error('Failed to load activity'))
      .finally(() => setActivityLoading(false));
  }, [activeTab, id]);

  // Lazy-load public lists
  useEffect(() => {
    if (activeTab !== 'lists' || publicLists.length > 0) return;
    setListsLoading(true);
    api.get(`/lists/user/${id}`)
      .then(res => setPublicLists(res.data.lists || []))
      .catch(() => {})
      .finally(() => setListsLoading(false));
  }, [activeTab, id]);

  // Also load public lists for sidebar (always)
  useEffect(() => {
    api.get(`/lists/user/${id}`)
      .then(res => setPublicLists(res.data.lists || []))
      .catch(() => {});
  }, [id]);

  const setTab = (key) => setSearchParams({ tab: key });

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    const fd = new FormData();
    fd.append('cover', file);
    try {
      const res = await api.put('/users/me/cover', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(prev => ({ ...prev, coverImage: res.data.coverImage }));
      toast.success('Cover image updated');
    } catch { toast.error('Failed to upload cover image'); }
    finally { setCoverUploading(false); if (coverInputRef.current) coverInputRef.current.value = ''; }
  };

  const handleCoverRemove = async () => {
    setCoverUploading(true);
    try {
      await api.put('/users/me/cover', { remove: 'true' });
      setProfile(prev => ({ ...prev, coverImage: '' }));
      toast.success('Cover image removed');
    } catch { toast.error('Failed to remove cover image'); }
    finally { setCoverUploading(false); }
  };

  const handleFollow = async () => {
    if (!user) return toast.error('Please log in to follow');
    try {
      const res = await api.post(`/users/${id}/follow`);
      setFollowing(res.data.following);
      setFollowersCount(res.data.followersCount);
      toast.success(res.data.following ? `Following ${profile.name}` : `Unfollowed ${profile.name}`);
    } catch { toast.error('Failed to follow'); }
  };

  const handleMute = async () => {
    if (!user) return toast.error('Please log in');
    try {
      const res = await api.post(`/users/${id}/mute`);
      setMuted(res.data.muted);
      toast.success(res.data.muted ? `${profile.name} muted` : `${profile.name} unmuted`);
    } catch { toast.error('Failed to mute'); }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
    setShowMoreMenu(false);
  };

  const handleBlock = async () => {
    if (!user) return toast.error('Please log in');
    setShowMoreMenu(false);
    try {
      const res = await api.post(`/users/${id}/block`);
      setBlocked(res.data.blocked);
      if (res.data.blocked) {
        setFollowing(false);
        toast.success(`${profile.name} blocked`);
      } else {
        toast.success(`${profile.name} unblocked`);
      }
    } catch { toast.error('Failed to block user'); }
  };

  const handleReport = async (reason) => {
    try {
      await api.post(`/users/${id}/report`, { reason });
      toast.success('Report submitted. Our team will review it.');
      setShowReportModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    }
  };

  const handleSaveProfile = (updatedUser) => {
    setProfile(prev => ({ ...prev, ...updatedUser }));
    updateUser({ name: updatedUser.name, avatar: updatedUser.avatar });
  };

  if (loading) return <div className="py-20"><LoadingSpinner /></div>;
  if (!profile) return null;

  const followers    = profile.followers || [];
  const followingList = profile.following || [];

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Cover image ── */}
      <div className={`relative w-full ${profile.coverImage ? 'h-48 sm:h-64' : isOwn ? 'h-20' : 'h-0'} overflow-hidden bg-gray-100 dark:bg-gray-800`}>
        {profile.coverImage ? (
          <>
            <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
            {isOwn && (
              <div className="absolute bottom-3 right-4 flex gap-2">
                <button onClick={() => coverInputRef.current?.click()}
                  disabled={coverUploading}
                  className="px-3 py-1.5 text-xs font-medium bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-full hover:bg-white dark:hover:bg-gray-900 transition">
                  {coverUploading ? 'Uploading…' : 'Change cover'}
                </button>
                <button onClick={handleCoverRemove}
                  disabled={coverUploading}
                  className="px-3 py-1.5 text-xs font-medium bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-full hover:bg-white dark:hover:bg-gray-900 transition text-red-500">
                  Remove
                </button>
              </div>
            )}
          </>
        ) : isOwn ? (
          <button onClick={() => coverInputRef.current?.click()}
            disabled={coverUploading}
            className="absolute inset-0 w-full h-full flex items-center justify-center gap-2 text-sm text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-200 hover:bg-gray-200/40 dark:hover:bg-gray-700/40 transition">
            <FiEdit2 size={14} />
            {coverUploading ? 'Uploading…' : 'Add cover image'}
          </button>
        ) : null}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleCoverUpload}
        />
      </div>

      <div className="px-4 sm:px-6 md:px-8 py-8 flex gap-12">

      {/* ── Center column ── */}
      <div className="flex-1 min-w-0 max-w-2xl">

        {/* Name */}
        <div className="flex items-center gap-2 mb-5">
          <h1 className="text-3xl sm:text-4xl font-bold text-medium-black dark:text-gray-100">
            {profile.name}
          </h1>
          <UserBadges user={profile} size="lg" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-medium-border dark:border-gray-700 mb-6">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-1 mr-6 pb-3 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${
                activeTab === t.key
                  ? 'border-medium-black dark:border-gray-200 text-medium-black dark:text-gray-100'
                  : 'border-transparent text-medium-gray dark:text-gray-500 hover:text-medium-black dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Home tab: published stories ── */}
        {activeTab === 'home' && (
          posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-medium-gray dark:text-gray-500 text-base">
                {isOwn ? "You haven't published any stories yet." : 'No stories yet.'}
              </p>
              {isOwn && (
                <Link to="/write" className="mt-4 inline-block btn-black px-6 py-2 text-sm">
                  Write your first story
                </Link>
              )}
            </div>
          ) : (
            <div>
              {posts.map(post => <PostCard key={post._id} post={post} />)}
            </div>
          )
        )}

        {/* ── Activity tab ── */}
        {activeTab === 'activity' && (
          activityLoading ? <LoadingSpinner /> :
          activity.length === 0 ? (
            <div className="text-center py-16">
              <FiMessageCircle className="text-4xl text-medium-gray dark:text-gray-600 mx-auto mb-3" />
              <p className="text-medium-black dark:text-gray-200 font-medium mb-1">No responses yet</p>
              <p className="text-medium-gray dark:text-gray-500 text-sm">
                {isOwn ? 'Your responses to stories will appear here.' : 'This writer has not responded to any stories yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-medium-border dark:divide-gray-700">
              {activity.map(comment => (
                <div key={comment._id} className="py-6">
                  {/* Response text */}
                  <p className="text-sm sm:text-base text-medium-black dark:text-gray-100 leading-relaxed mb-4">
                    {comment.content}
                  </p>

                  {/* Post preview card */}
                  {comment.post && (
                    <Link to={`/article/${comment.post.slug}`}
                      className="flex items-start gap-3 p-3 rounded-lg border border-medium-border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition group">
                      {/* Cover image */}
                      {comment.post.coverImage && (
                        <div className="flex-shrink-0 w-16 h-12 rounded overflow-hidden bg-white dark:bg-gray-800 flex items-center justify-center">
                          <img src={comment.post.coverImage} alt={comment.post.title}
                            className="max-w-full max-h-full object-contain block" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {/* Post author */}
                        {comment.post.author && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <img
                              src={comment.post.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.post.author.name || 'A')}&background=random&size=16`}
                              alt={comment.post.author.name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span className="text-xs text-medium-gray dark:text-gray-400">{comment.post.author.name}</span>
                          </div>
                        )}
                        {/* Post title */}
                        <p className="text-sm font-semibold text-medium-black dark:text-gray-100 line-clamp-2 group-hover:underline decoration-1 underline-offset-2 leading-snug">
                          {comment.post.title}
                        </p>
                        {comment.post.readTime && (
                          <p className="text-xs text-medium-gray dark:text-gray-500 mt-0.5">{comment.post.readTime} min read</p>
                        )}
                      </div>
                    </Link>
                  )}

                  {/* Meta: timestamp + likes */}
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-medium-gray dark:text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                    {comment.likes?.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-medium-gray dark:text-gray-500">
                        <FiMessageCircle className="text-xs" />
                        {comment.likes.length} {comment.likes.length === 1 ? 'clap' : 'claps'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Lists tab ── */}
        {activeTab === 'lists' && (
          listsLoading ? <LoadingSpinner /> :
          publicLists.length === 0 ? (
            <div className="text-center py-16">
              <FiBookmark className="text-4xl text-medium-gray dark:text-gray-600 mx-auto mb-3" />
              <p className="text-medium-black dark:text-gray-200 font-medium mb-1">No public lists yet</p>
              <p className="text-medium-gray dark:text-gray-500 text-sm">
                {isOwn ? 'Create a list in your Library and make it public.' : 'This writer has no public lists.'}
              </p>
              {isOwn && <Link to="/library" className="mt-4 inline-block btn-black px-6 py-2 text-sm">Go to Library</Link>}
            </div>
          ) : (
            <div className="space-y-6">
              {publicLists.map(list => {
                const covers = (list.posts || []).map(p => p.coverImage).filter(Boolean).slice(0, 3);
                return (
                  <Link key={list._id} to={`/lists/${list._id}`}
                    className="block border border-medium-border dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition group">
                    {/* Cover collage */}
                    <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 flex overflow-hidden">
                      {covers.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                          <FiBookmark className="text-3xl text-gray-300 dark:text-gray-600" />
                        </div>
                      ) : covers.length === 1 ? (
                        <img src={covers[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <img src={covers[0]} alt="" className="w-1/2 h-full object-cover border-r border-white dark:border-gray-900" />
                          <div className="w-1/2 flex flex-col">
                            {covers.slice(1).map((src, i) => (
                              <img key={i} src={src} alt="" className={`flex-1 w-full object-cover ${i === 0 && covers.length > 2 ? 'border-b border-white dark:border-gray-900' : ''}`} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-medium-black dark:text-gray-100 text-base group-hover:underline decoration-1 underline-offset-2">{list.name}</h3>
                      {list.description && <p className="text-sm text-medium-gray dark:text-gray-400 mt-1 line-clamp-2">{list.description}</p>}
                      <p className="text-xs text-medium-gray dark:text-gray-500 mt-2">{list.posts?.length || 0} {list.posts?.length === 1 ? 'story' : 'stories'}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}

        {/* ── About tab ── */}
        {activeTab === 'about' && (
          <div className="space-y-6 py-2">

            {profile.bio ? (
              <p className="text-base text-medium-black dark:text-gray-200 leading-relaxed">
                {profile.bio}
              </p>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center">
                <p className="font-semibold text-medium-black dark:text-gray-100 mb-2">
                  {isOwn ? 'Tell the world about yourself' : 'No bio yet.'}
                </p>
                {isOwn && (
                  <>
                    <p className="text-sm text-medium-gray dark:text-gray-400 mb-4">
                      Share your history, work experience, interests, and more.
                    </p>
                    <button onClick={() => setShowEdit(true)}
                      className="px-5 py-2 text-sm border border-medium-border dark:border-gray-600 rounded-full text-medium-black dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                      Get started
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="border-t border-medium-border dark:border-gray-700 pt-5 space-y-3">
              {/* Member since */}
              <div className="flex items-center gap-2 text-sm text-medium-gray dark:text-gray-400">
                <FiCalendar className="flex-shrink-0" />
                <span>Member since {format(new Date(profile.createdAt), 'MMMM yyyy')}</span>
              </div>

              {/* Followers / Following */}
              <div className="flex items-center gap-2 text-sm text-medium-gray dark:text-gray-400">
                <FiUsers className="flex-shrink-0" />
                <button onClick={() => setModal('followers')}
                  className="hover:text-medium-black dark:hover:text-gray-200 hover:underline transition">
                  <strong className="text-medium-black dark:text-gray-200">{followersCount}</strong> {followersCount === 1 ? 'Follower' : 'Followers'}
                </button>
                <span>·</span>
                <button onClick={() => setModal('following')}
                  className="hover:text-medium-black dark:hover:text-gray-200 hover:underline transition">
                  <strong className="text-medium-black dark:text-gray-200">{followingList.length}</strong> Following
                </button>
              </div>

              {/* Stories count */}
              <div className="flex items-center gap-2 text-sm text-medium-gray dark:text-gray-400">
                <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">✍</span>
                <span><strong className="text-medium-black dark:text-gray-200">{posts.length}</strong> {posts.length === 1 ? 'Story' : 'Stories'} published</span>
              </div>
            </div>

            {isOwn && profile.bio && (
              <button onClick={() => setShowEdit(true)}
                className="text-sm text-medium-green hover:underline transition">
                Edit bio
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Right sidebar ── */}
      <aside className="hidden lg:block w-72 flex-shrink-0 self-start border-l border-medium-border dark:border-gray-700 pl-8">
        <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 scrollbar-thin">

          {/* Avatar + name + bio */}
          <div className="flex flex-col items-center text-center gap-4 pb-6">
            <img
              src={profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&size=160`}
              alt={profile.name}
              className="w-[88px] h-[88px] rounded-full object-cover" />

            <div className="space-y-1.5 w-full">
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <p className="text-xl font-bold text-medium-black dark:text-gray-100 leading-tight">{profile.name}</p>
                <UserBadges user={profile} size="md" />
              </div>
              {profile.bio && (
                <p className="text-sm text-medium-gray dark:text-gray-400 leading-relaxed line-clamp-5">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Follow / Edit / ··· */}
            {isOwn ? (
              <button onClick={() => setShowEdit(true)}
                className="text-sm text-medium-green dark:text-green-400 hover:underline transition font-medium">
                Edit profile
              </button>
            ) : user ? (
              <div className="flex items-center gap-2 w-full justify-center">
                <button onClick={handleFollow}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition border ${
                    following
                      ? 'border-medium-border dark:border-gray-600 text-medium-gray dark:text-gray-400 hover:border-red-300 dark:hover:border-red-400 hover:text-red-500'
                      : 'bg-[#1a8917] text-white border-[#1a8917] hover:bg-[#156d12]'
                  }`}>
                  {following ? 'Following' : 'Follow'}
                </button>

                {/* ··· more menu */}
                <div className="relative flex-shrink-0" ref={moreMenuRef}>
                  <button
                    onClick={() => setShowMoreMenu(v => !v)}
                    className="p-2 rounded-full border border-medium-border dark:border-gray-600 text-medium-gray dark:text-gray-400 hover:border-medium-black dark:hover:border-gray-300 hover:text-medium-black dark:hover:text-gray-200 transition"
                    title="More options"
                  >
                    <FiMoreHorizontal size={16} />
                  </button>

                  {showMoreMenu && (
                    <div className="absolute right-0 top-10 w-56 bg-white dark:bg-gray-800 border border-medium-border dark:border-gray-600 rounded-lg shadow-xl py-1 z-30">
                      <button
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
                      >
                        <FiLink size={15} />
                        Copy link to profile
                      </button>
                      <div className="my-1 border-t border-medium-border dark:border-gray-700" />
                      <button
                        onClick={() => { handleFollow(); setShowMoreMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
                      >
                        {following ? <FiUserMinus size={15} /> : <FiUserPlus size={15} />}
                        {following ? `Unfollow ${profile.name}` : `Follow ${profile.name}`}
                      </button>
                      <button
                        onClick={() => { handleMute(); setShowMoreMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
                      >
                        {muted ? <FiVolume2 size={15} /> : <FiVolumeX size={15} />}
                        {muted ? `Unmute ${profile.name}` : `Mute ${profile.name}`}
                      </button>
                      <button
                        onClick={handleBlock}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
                      >
                        <FiSlash size={15} />
                        {blocked ? `Unblock ${profile.name}` : `Block ${profile.name}`}
                      </button>
                      <div className="my-1 border-t border-medium-border dark:border-gray-700" />
                      <button
                        onClick={() => { setShowMoreMenu(false); setShowReportModal(true); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
                      >
                        <FiFlag size={15} />
                        Report {profile.name}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link to="/login"
                className="px-6 py-2 rounded-full text-sm font-medium bg-[#1a8917] text-white border border-[#1a8917] hover:bg-[#156d12] transition">
                Follow
              </Link>
            )}
          </div>

          {/* Follower / Following counts */}
          <div className="border-t border-medium-border dark:border-gray-700 py-5 flex gap-6">
            <button onClick={() => setModal('followers')}
              className="text-left hover:opacity-70 transition">
              <div className="text-lg font-bold text-medium-black dark:text-gray-100">{followersCount}</div>
              <div className="text-xs text-medium-gray dark:text-gray-400">{followersCount === 1 ? 'Follower' : 'Followers'}</div>
            </button>
            <button onClick={() => setModal('following')}
              className="text-left hover:opacity-70 transition">
              <div className="text-lg font-bold text-medium-black dark:text-gray-100">{followingList.length}</div>
              <div className="text-xs text-medium-gray dark:text-gray-400">Following</div>
            </button>
          </div>

          {/* Following list with ··· menu per user */}
          {followingList.length > 0 && (
            <div className="border-t border-medium-border dark:border-gray-700 pt-5">
              <h3 className="text-sm font-semibold text-medium-black dark:text-gray-100 mb-3">Following</h3>
              <div className="space-y-1">
                {followingList.slice(0, 6).map(u => (
                  <SidebarFollowingRow key={u._id} u={u} currentUser={user} />
                ))}
              </div>
              {followingList.length > 6 && (
                <button onClick={() => setModal('following')}
                  className="text-sm text-medium-green dark:text-green-400 hover:underline transition mt-3 block">
                  See all ({followingList.length})
                </button>
              )}
            </div>
          )}

          {/* Public lists section */}
          {publicLists.length > 0 && (
            <div className="border-t border-medium-border dark:border-gray-700 pt-5">
              <h3 className="text-sm font-semibold text-medium-black dark:text-gray-100 mb-3">Lists</h3>
              <div className="space-y-3">
                {publicLists.slice(0, 4).map(list => {
                  const covers = (list.posts || []).map(p => p.coverImage).filter(Boolean).slice(0, 2);
                  return (
                    <Link key={list._id} to={`/lists/${list._id}`}
                      className="flex items-center gap-3 group">
                      <div className="w-12 h-9 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 flex">
                        {covers.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center">
                            <FiBookmark className="text-xs text-gray-400" />
                          </div>
                        ) : covers.length === 1 ? (
                          <img src={covers[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <img src={covers[0]} alt="" className="w-1/2 h-full object-cover border-r border-white dark:border-gray-900" />
                            <img src={covers[1]} alt="" className="w-1/2 h-full object-cover" />
                          </>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-medium-black dark:text-gray-200 group-hover:underline truncate">{list.name}</p>
                        <p className="text-xs text-medium-gray dark:text-gray-500">{list.posts?.length || 0} {list.posts?.length === 1 ? 'story' : 'stories'}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {publicLists.length > 4 && (
                <button onClick={() => setTab('lists')}
                  className="text-sm text-medium-green dark:text-green-400 hover:underline transition mt-3 block">
                  See all lists
                </button>
              )}
            </div>
          )}

        </div>
      </aside>

      </div>{/* close px-4 wrapper */}

      {/* Modals */}
      {modal === 'followers' && (
        <UsersModal
          title={`${followersCount} Follower${followersCount !== 1 ? 's' : ''}`}
          users={followers}
          onClose={() => setModal(null)} />
      )}
      {modal === 'following' && (
        <UsersModal
          title={`${followingList.length} Following`}
          users={followingList}
          onClose={() => setModal(null)} />
      )}
      {showEdit && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSave={handleSaveProfile} />
      )}

      {/* Report user modal */}
      {showReportModal && (
        <ReportUserModal
          name={profile.name}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReport} />
      )}
    </div>
  );
}

export default function AuthorProfile() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();

  // Wait for auth to settle so we never flash between Navbar and SidebarLayout
  if (authLoading) return null;

  if (user) {
    return (
      <SidebarLayout>
        <ProfileContent id={id} />
      </SidebarLayout>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <ProfileContent id={id} />
    </div>
  );
}

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

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'home',     label: 'Home' },
  { key: 'activity', label: 'Activity' },
  { key: 'about',    label: 'About' },
];

function ProfileContent({ id }) {
  const { user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'home';

  const [profile, setProfile]           = useState(null);
  const [posts, setPosts]               = useState([]);
  const [activity, setActivity]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [following, setFollowing]       = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [muted, setMuted]               = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [modal, setModal]               = useState(null); // 'followers' | 'following'
  const [showEdit, setShowEdit]         = useState(false);
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

  const setTab = (key) => setSearchParams({ tab: key });

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

  const handleSaveProfile = (updatedUser) => {
    setProfile(prev => ({ ...prev, ...updatedUser }));
    updateUser({ name: updatedUser.name, avatar: updatedUser.avatar });
  };

  if (loading) return <div className="py-20"><LoadingSpinner /></div>;
  if (!profile) return null;

  const followers    = profile.followers || [];
  const followingList = profile.following || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 flex gap-12">

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
              <p className="text-medium-gray dark:text-gray-500 text-base">
                {isOwn ? 'You have no recent activity yet.' : 'No recent activity.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-medium-border dark:divide-gray-700">
              {activity.map(comment => (
                <div key={comment._id} className="py-5">
                  {/* Which story */}
                  {comment.post && (
                    <Link to={`/article/${comment.post.slug}`}
                      className="flex items-center gap-1.5 text-xs text-medium-gray dark:text-gray-500 hover:text-medium-black dark:hover:text-gray-300 transition mb-2 group">
                      <FiMessageCircle className="text-xs flex-shrink-0" />
                      <span className="line-clamp-1 group-hover:underline">
                        Responded to: <span className="font-medium">{comment.post.title}</span>
                      </span>
                    </Link>
                  )}
                  {/* Comment content */}
                  <p className="text-sm text-medium-black dark:text-gray-200 leading-relaxed line-clamp-4">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-medium-gray dark:text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                    {comment.likes?.length > 0 && (
                      <span className="text-xs text-medium-gray dark:text-gray-500">
                        {comment.likes.length} {comment.likes.length === 1 ? 'like' : 'likes'}
                      </span>
                    )}
                    {comment.post && (
                      <Link to={`/article/${comment.post.slug}`}
                        className="text-xs text-medium-gray dark:text-gray-500 hover:text-medium-black dark:hover:text-gray-300 underline ml-auto">
                        View
                      </Link>
                    )}
                  </div>
                </div>
              ))}
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
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 space-y-5">

          {/* Avatar */}
          <div className="flex flex-col items-center text-center gap-3">
            <img
              src={profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&size=120`}
              alt={profile.name}
              className="w-20 h-20 rounded-full object-cover" />
            <div>
              <div className="flex items-center justify-center gap-1.5">
                <p className="font-semibold text-medium-black dark:text-gray-100 text-base">{profile.name}</p>
                <UserBadges user={profile} size="sm" />
              </div>
              {profile.bio && (
                <p className="text-xs text-medium-gray dark:text-gray-400 mt-1 line-clamp-3 leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Follow / Edit profile */}
            {isOwn ? (
              <button onClick={() => setShowEdit(true)}
                className="text-sm text-medium-green dark:text-green-400 hover:underline transition">
                Edit profile
              </button>
            ) : user ? (
              <div className="flex items-center gap-2 w-full">
                <button onClick={handleFollow}
                  className={`flex-1 text-sm px-5 py-2 rounded-full font-medium transition border ${
                    following
                      ? 'border-medium-border dark:border-gray-600 text-medium-gray dark:text-gray-400 hover:border-red-300 hover:text-red-500'
                      : 'bg-medium-black dark:bg-gray-100 text-white dark:text-gray-900 border-medium-black dark:border-gray-100 hover:opacity-90'
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
                    <div className="absolute right-0 top-10 w-52 bg-white dark:bg-gray-800 border border-medium-border dark:border-gray-600 rounded-lg shadow-xl py-1 z-30">
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
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link to="/login"
                className="w-full text-center block text-sm px-5 py-2 rounded-full font-medium bg-medium-black text-white hover:opacity-90 transition">
                Follow
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="border-t border-medium-border dark:border-gray-700 pt-4 space-y-2 text-sm text-medium-gray dark:text-gray-400">
            <button onClick={() => setModal('followers')}
              className="w-full text-left hover:text-medium-black dark:hover:text-gray-200 transition py-1">
              <strong className="text-medium-black dark:text-gray-200">{followersCount}</strong> {followersCount === 1 ? 'Follower' : 'Followers'}
            </button>
            <button onClick={() => setModal('following')}
              className="w-full text-left hover:text-medium-black dark:hover:text-gray-200 transition py-1">
              <strong className="text-medium-black dark:text-gray-200">{followingList.length}</strong> Following
            </button>
          </div>

        </div>
      </aside>

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

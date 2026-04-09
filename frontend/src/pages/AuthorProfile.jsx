import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiEdit2, FiX } from 'react-icons/fi';

// ─── Followers / Following Modal ─────────────────────────────────────────────
function UsersModal({ title, users, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-medium-black">{title}</h3>
          <button onClick={onClose} className="p-1 text-medium-gray hover:text-medium-black transition">
            <FiX className="text-xl" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
          {users.length === 0 ? (
            <p className="px-5 py-8 text-sm text-medium-gray text-center">No users yet.</p>
          ) : (
            users.map(u => (
              <Link key={u._id || u} to={`/profile/${u._id || u}`} onClick={onClose}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
                <img
                  src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=random&size=40`}
                  alt={u.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-medium-black text-sm truncate">{u.name || 'User'}</p>
                  {u.bio && <p className="text-xs text-medium-gray truncate">{u.bio}</p>}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AuthorProfile() {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null); // 'followers' | 'following' | null

  const isOwn = user?._id === id;

  useEffect(() => { fetchProfile(); }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${id}`);
      setProfile(res.data.user);
      setPosts(res.data.posts);
      setFollowersCount(res.data.user.followers?.length || 0);
      if (user) setFollowing(res.data.user.followers?.some(f => f._id === user._id || f === user._id));
      setEditForm({ name: res.data.user.name, bio: res.data.user.bio || '' });
      setAvatarPreview(res.data.user.avatar || '');
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) return toast.error('Please login');
    try {
      const res = await api.post(`/users/${id}/follow`);
      setFollowing(res.data.following);
      setFollowersCount(res.data.followersCount);
      toast.success(res.data.following ? `Following ${profile.name}` : `Unfollowed ${profile.name}`);
    } catch {
      toast.error('Failed to follow');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('bio', editForm.bio);
      if (avatarFile) formData.append('avatar', avatarFile);
      const res = await api.put('/users/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(res.data.user);
      updateUser({ name: res.data.user.name, avatar: res.data.user.avatar });
      setEditMode(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!profile) return null;

  const followers = profile.followers || [];
  const followingList = profile.following || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-8 pb-8 border-b border-gray-100">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&size=100`}
            alt={profile.name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
          />
          {isOwn && editMode && (
            <label className="absolute bottom-0 right-0 p-1.5 bg-gray-900 rounded-full cursor-pointer">
              <FiEdit2 className="text-white text-xs" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {editMode ? (
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <input type="text" value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-lg font-bold focus:outline-none focus:border-gray-400"
                placeholder="Your name" />
              <textarea value={editForm.bio}
                onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400"
                rows={3} placeholder="Tell us about yourself..." maxLength={300} />
              <div className="flex gap-2">
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-medium-black text-white text-sm rounded-full hover:bg-gray-800 transition disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={() => setEditMode(false)}
                  className="px-4 py-2 border border-gray-200 text-sm rounded-full hover:border-gray-400 transition">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                {isOwn ? (
                  <button onClick={() => setEditMode(true)}
                    className="text-sm text-medium-gray hover:text-medium-black underline">
                    Edit profile
                  </button>
                ) : user ? (
                  <button onClick={handleFollow}
                    className={`text-sm px-5 py-1.5 rounded-full font-medium transition border ${
                      following
                        ? 'border-medium-border text-medium-gray hover:border-red-300 hover:text-red-500'
                        : 'bg-medium-black text-white border-medium-black hover:bg-gray-800'
                    }`}>
                    {following ? 'Following' : 'Follow'}
                  </button>
                ) : null}
              </div>

              <p className="text-gray-600 text-sm leading-relaxed max-w-lg mb-3">
                {profile.bio || 'No bio yet.'}
              </p>

              {/* Clickable stats */}
              <div className="flex gap-4 text-sm text-gray-500">
                <button onClick={() => setModal('followers')}
                  className="hover:text-medium-black transition">
                  <strong className="text-gray-800">{followersCount}</strong> followers
                </button>
                <button onClick={() => setModal('following')}
                  className="hover:text-medium-black transition">
                  <strong className="text-gray-800">{followingList.length}</strong> following
                </button>
                <span>
                  <strong className="text-gray-800">{posts.length}</strong> stories
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Stories</h2>
        {posts.length === 0 ? (
          <p className="text-medium-gray text-sm py-10 text-center">No stories yet.</p>
        ) : (
          posts.map(post => <PostCard key={post._id} post={post} />)
        )}
      </div>

      {/* Followers modal */}
      {modal === 'followers' && (
        <UsersModal
          title={`${followersCount} Follower${followersCount !== 1 ? 's' : ''}`}
          users={followers}
          onClose={() => setModal(null)}
        />
      )}

      {/* Following modal */}
      {modal === 'following' && (
        <UsersModal
          title={`${followingList.length} Following`}
          users={followingList}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

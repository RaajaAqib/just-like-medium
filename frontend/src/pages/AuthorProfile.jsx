import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiEdit2 } from 'react-icons/fi';

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

  const isOwn = user?._id === id;

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${id}`);
      setProfile(res.data.user);
      setPosts(res.data.posts);
      setFollowersCount(res.data.user.followers?.length || 0);
      if (user) {
        setFollowing(res.data.user.followers?.some((f) => f._id === user._id || f === user._id));
      }
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

      const res = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-start gap-6 pb-8 border-b border-gray-100">
        <div className="relative">
          <img
            src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&size=100`}
            alt={profile.name}
            className="w-24 h-24 rounded-full object-cover"
          />
          {isOwn && editMode && (
            <label className="absolute bottom-0 right-0 p-1.5 bg-gray-900 rounded-full cursor-pointer">
              <FiEdit2 className="text-white text-xs" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          )}
        </div>

        <div className="flex-1">
          {editMode ? (
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="input-field text-xl font-bold"
                placeholder="Your name"
              />
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="input-field resize-none"
                rows={3}
                placeholder="Tell us about yourself..."
                maxLength={300}
              />
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="btn-primary text-sm">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={() => setEditMode(false)} className="btn-secondary text-sm">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                {isOwn ? (
                  <button onClick={() => setEditMode(true)} className="text-sm text-gray-500 hover:text-gray-900 underline">
                    Edit profile
                  </button>
                ) : user ? (
                  <button
                    onClick={handleFollow}
                    className={following ? 'btn-secondary text-sm' : 'btn-green text-sm'}
                  >
                    {following ? 'Following' : 'Follow'}
                  </button>
                ) : null}
              </div>
              <p className="text-gray-600 mt-2 text-sm leading-relaxed max-w-lg">
                {profile.bio || 'No bio yet.'}
              </p>
              <div className="flex gap-4 mt-3 text-sm text-gray-400">
                <span><strong className="text-gray-700">{followersCount}</strong> followers</span>
                <span><strong className="text-gray-700">{profile.following?.length || 0}</strong> following</span>
                <span><strong className="text-gray-700">{posts.length}</strong> stories</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Stories</h2>
        {posts.length === 0 ? (
          <p className="text-gray-400 text-sm py-10 text-center">No stories yet.</p>
        ) : (
          posts.map((post) => <PostCard key={post._id} post={post} />)
        )}
      </div>
    </div>
  );
}

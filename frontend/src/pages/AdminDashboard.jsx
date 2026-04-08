import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiTrash2, FiShield, FiEye, FiUsers, FiFileText } from 'react-icons/fi';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AdminDashboard() {
  const [tab, setTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ posts: 0, users: 0 });

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'posts') {
        const res = await api.get('/posts/admin/all');
        setPosts(res.data.posts);
        setStats((s) => ({ ...s, posts: res.data.total }));
      } else {
        const res = await api.get('/users/admin/all');
        setUsers(res.data.users);
        setStats((s) => ({ ...s, users: res.data.total }));
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${id}`);
      setPosts(posts.filter((p) => p._id !== id));
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user and all their posts?')) return;
    try {
      await api.delete(`/users/admin/${id}`);
      setUsers(users.filter((u) => u._id !== id));
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const toggleAdmin = async (id) => {
    try {
      const res = await api.put(`/users/admin/${id}/toggle-admin`);
      setUsers(users.map((u) => (u._id === id ? { ...u, isAdmin: res.data.isAdmin } : u)));
      toast.success('Admin status updated');
    } catch {
      toast.error('Failed to update admin');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Posts', value: stats.posts, icon: <FiFileText />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Users', value: stats.users, icon: <FiUsers />, color: 'bg-green-50 text-green-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className={`inline-flex p-2 rounded-lg ${stat.color} mb-2`}>{stat.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {['posts', 'users'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 text-sm font-medium capitalize transition border-b-2 -mb-px ${
              tab === t ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : tab === 'posts' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="pb-3 font-medium text-gray-500 pr-4">Title</th>
                <th className="pb-3 font-medium text-gray-500 pr-4">Author</th>
                <th className="pb-3 font-medium text-gray-500 pr-4">Status</th>
                <th className="pb-3 font-medium text-gray-500 pr-4">Views</th>
                <th className="pb-3 font-medium text-gray-500 pr-4">Date</th>
                <th className="pb-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-gray-900 line-clamp-1 max-w-xs">{post.title}</p>
                  </td>
                  <td className="py-3 pr-4 text-gray-500">{post.author?.name}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      post.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-500">{post.views}</td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/article/${post.slug}`}
                        className="p-1.5 text-gray-400 hover:text-blue-500 transition"
                        title="View"
                      >
                        <FiEye />
                      </Link>
                      <button
                        onClick={() => deletePost(post._id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {posts.length === 0 && (
            <p className="text-center text-gray-400 py-10">No posts found</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="pb-3 font-medium text-gray-500 pr-4">User</th>
                <th className="pb-3 font-medium text-gray-500 pr-4">Email</th>
                <th className="pb-3 font-medium text-gray-500 pr-4">Role</th>
                <th className="pb-3 font-medium text-gray-500 pr-4">Joined</th>
                <th className="pb-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <img
                        src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&size=32`}
                        alt={u.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-500">{u.email}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">
                    {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/profile/${u._id}`}
                        className="p-1.5 text-gray-400 hover:text-blue-500 transition"
                        title="View profile"
                      >
                        <FiEye />
                      </Link>
                      <button
                        onClick={() => toggleAdmin(u._id)}
                        className={`p-1.5 transition ${u.isAdmin ? 'text-purple-400 hover:text-gray-400' : 'text-gray-400 hover:text-purple-500'}`}
                        title={u.isAdmin ? 'Remove admin' : 'Make admin'}
                      >
                        <FiShield />
                      </button>
                      <button
                        onClick={() => deleteUser(u._id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition"
                        title="Delete user"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-center text-gray-400 py-10">No users found</p>
          )}
        </div>
      )}
    </div>
  );
}

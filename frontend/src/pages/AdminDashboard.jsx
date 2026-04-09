import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import {
  FiTrash2, FiShield, FiEye, FiUsers, FiFileText, FiMessageCircle,
  FiBarChart2, FiTag, FiSettings, FiStar, FiSlash, FiCheckCircle,
  FiAlertCircle, FiSearch, FiFilter, FiTrendingUp, FiHeart, FiZap,
  FiGrid, FiToggleLeft, FiToggleRight, FiX
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const TABS = [
  { id: 'overview',  label: 'Overview',   icon: FiGrid },
  { id: 'articles', label: 'Articles',    icon: FiFileText },
  { id: 'users',    label: 'Users',       icon: FiUsers },
  { id: 'comments', label: 'Comments',    icon: FiMessageCircle },
  { id: 'analytics',label: 'Analytics',   icon: FiBarChart2 },
  { id: 'tags',     label: 'Tags',        icon: FiTag },
];

const PIE_COLORS = ['#1a8917', '#242424', '#6b6b6b', '#d1d5db', '#86efac'];

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className={`inline-flex p-2.5 rounded-lg mb-3 ${color}`}>
        <Icon className="text-lg" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────
function OverviewTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/posts/admin/stats')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const { stats, recentPosts, topPosts, tagStats } = data;

  const publishedVsDraft = [
    { name: 'Published', value: stats.totalPublished },
    { name: 'Drafts',    value: stats.totalDrafts },
  ];

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Users"     value={stats.totalUsers}     icon={FiUsers}       color="bg-blue-50 text-blue-600" />
        <StatCard label="Total Articles"  value={stats.totalPosts}     icon={FiFileText}    color="bg-green-50 text-green-600" />
        <StatCard label="Published Today" value={stats.publishedToday} icon={FiCheckCircle} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Total Comments"  value={stats.totalComments}  icon={FiMessageCircle} color="bg-purple-50 text-purple-600" />
        <StatCard label="Total Views"     value={stats.totalViews}     icon={FiEye}         color="bg-orange-50 text-orange-600" />
        <StatCard label="Total Likes"     value={stats.totalLikes}     icon={FiHeart}       color="bg-red-50 text-red-500" />
        <StatCard label="Total Claps"     value={stats.totalClaps}     icon={FiZap}         color="bg-yellow-50 text-yellow-600" />
        <StatCard label="Drafts"          value={stats.totalDrafts}    icon={FiFileText}    color="bg-gray-100 text-gray-500" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top posts bar chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Top Articles by Views</h3>
          {topPosts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topPosts.map(p => ({ name: p.title.substring(0, 20) + (p.title.length > 20 ? '…' : ''), views: p.views }))}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="views" fill="#1a8917" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Published vs Draft pie */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Content Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={publishedVsDraft} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {publishedVsDraft.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top tags + Recent posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top tags */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Top Tags</h3>
          {tagStats.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No tags yet</p>
          ) : (
            <div className="space-y-2">
              {tagStats.map(t => (
                <div key={t._id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-28 truncate">#{t._id}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-medium-green h-2 rounded-full" style={{ width: `${(t.count / tagStats[0].count) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-6 text-right">{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent posts */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Recently Published</h3>
          <div className="space-y-3">
            {recentPosts.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No posts yet</p>}
            {recentPosts.map(p => (
              <div key={p._id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.title}</p>
                  <p className="text-xs text-gray-400">{p.author?.name} · {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</p>
                </div>
                <span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
                  <FiEye className="text-xs" /> {p.views}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Articles Tab ─────────────────────────────────────────────────────────────
function ArticlesTab() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/posts/admin/all?page=${page}&limit=15`);
      setPosts(res.data.posts);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Failed to load articles'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const deletePost = async (id) => {
    if (!window.confirm('Delete this post permanently?')) return;
    try {
      await api.delete(`/posts/${id}`);
      setPosts(posts.filter(p => p._id !== id));
      toast.success('Post deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const toggleFeature = async (id) => {
    try {
      const res = await api.put(`/posts/admin/${id}/feature`);
      setPosts(posts.map(p => p._id === id ? { ...p, featured: res.data.featured } : p));
      toast.success(res.data.featured ? 'Post featured' : 'Post unfeatured');
    } catch { toast.error('Failed to update'); }
  };

  const togglePublish = async (id) => {
    try {
      const res = await api.put(`/posts/admin/${id}/publish`);
      setPosts(posts.map(p => p._id === id ? { ...p, published: res.data.published } : p));
      toast.success(res.data.published ? 'Post published' : 'Post unpublished');
    } catch { toast.error('Failed to update'); }
  };

  const filtered = posts.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.author?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' ? true :
      statusFilter === 'published' ? p.published :
      statusFilter === 'draft' ? !p.published :
      statusFilter === 'featured' ? p.featured : true;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or author…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 bg-white">
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="featured">Featured</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left border-b border-gray-200">
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Title</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Author</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Views</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Likes</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(post => (
                  <tr key={post._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {post.featured && <FiStar className="text-yellow-400 flex-shrink-0" title="Featured" />}
                        <span className="font-medium text-gray-900 line-clamp-1 max-w-[200px]">{post.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{post.author?.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        post.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{post.views}</td>
                    <td className="px-4 py-3 text-gray-500">{post.likes?.length || 0}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {format(new Date(post.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {post.published && (
                          <Link to={`/article/${post.slug}`} target="_blank"
                            className="p-1.5 text-gray-400 hover:text-blue-500 transition rounded" title="View">
                            <FiEye className="text-sm" />
                          </Link>
                        )}
                        <button onClick={() => toggleFeature(post._id)}
                          className={`p-1.5 rounded transition ${post.featured ? 'text-yellow-400 hover:text-gray-400' : 'text-gray-300 hover:text-yellow-400'}`}
                          title={post.featured ? 'Unfeature' : 'Feature'}>
                          <FiStar className="text-sm" />
                        </button>
                        <button onClick={() => togglePublish(post._id)}
                          className={`p-1.5 rounded transition ${post.published ? 'text-green-400 hover:text-gray-400' : 'text-gray-300 hover:text-green-400'}`}
                          title={post.published ? 'Unpublish' : 'Publish'}>
                          {post.published ? <FiToggleRight className="text-sm" /> : <FiToggleLeft className="text-sm" />}
                        </button>
                        <button onClick={() => deletePost(post._id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 transition rounded" title="Delete">
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No articles found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:border-gray-400 transition">← Prev</button>
              <span className="text-sm text-gray-500">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:border-gray-400 transition">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/admin/all?page=${page}&limit=15`);
      setUsers(res.data.users);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleAdmin = async (id) => {
    try {
      const res = await api.put(`/users/admin/${id}/toggle-admin`);
      setUsers(users.map(u => u._id === id ? { ...u, isAdmin: res.data.isAdmin } : u));
      toast.success('Role updated');
    } catch { toast.error('Failed to update role'); }
  };

  const toggleBan = async (id) => {
    try {
      const res = await api.put(`/users/admin/${id}/ban`);
      setUsers(users.map(u => u._id === id ? { ...u, banned: res.data.banned } : u));
      toast.success(res.data.banned ? 'User banned' : 'User unbanned');
    } catch { toast.error('Failed to update ban status'); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user and all their posts?')) return;
    try {
      await api.delete(`/users/admin/${id}`);
      setUsers(users.filter(u => u._id !== id));
      toast.success('User deleted');
    } catch { toast.error('Failed to delete user'); }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' ? true :
      roleFilter === 'admin' ? u.isAdmin :
      roleFilter === 'banned' ? u.banned : true;
    return matchSearch && matchRole;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 bg-white">
          <option value="all">All Users</option>
          <option value="admin">Admins</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left border-b border-gray-200">
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">User</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Role</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Followers</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Joined</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(u => (
                  <tr key={u._id} className={`hover:bg-gray-50 transition ${u.banned ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&size=32`}
                          alt={u.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          {u.banned && <p className="text-xs text-red-500">Banned</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        u.isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        u.banned ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {u.banned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.followers?.length || 0}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to={`/profile/${u._id}`}
                          className="p-1.5 text-gray-400 hover:text-blue-500 transition rounded" title="View profile">
                          <FiEye className="text-sm" />
                        </Link>
                        <button onClick={() => toggleAdmin(u._id)}
                          className={`p-1.5 rounded transition ${u.isAdmin ? 'text-purple-400 hover:text-gray-400' : 'text-gray-300 hover:text-purple-500'}`}
                          title={u.isAdmin ? 'Remove admin' : 'Make admin'}>
                          <FiShield className="text-sm" />
                        </button>
                        <button onClick={() => toggleBan(u._id)}
                          className={`p-1.5 rounded transition ${u.banned ? 'text-red-400 hover:text-gray-400' : 'text-gray-300 hover:text-red-500'}`}
                          title={u.banned ? 'Unban user' : 'Ban user'}>
                          <FiSlash className="text-sm" />
                        </button>
                        <button onClick={() => deleteUser(u._id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 transition rounded" title="Delete user">
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:border-gray-400 transition">← Prev</button>
              <span className="text-sm text-gray-500">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:border-gray-400 transition">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Comments Tab ─────────────────────────────────────────────────────────────
function CommentsTab() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/comments/admin/all?page=${page}&limit=20`);
      setComments(res.data.comments);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Failed to load comments'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const deleteComment = async (id) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/comments/${id}`);
      setComments(comments.filter(c => c._id !== id));
      toast.success('Comment deleted');
    } catch { toast.error('Failed to delete comment'); }
  };

  const filtered = comments.filter(c =>
    c.content?.toLowerCase().includes(search.toLowerCase()) ||
    c.author?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.post?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search comments…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400" />
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left border-b border-gray-200">
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Comment</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Author</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Article</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-gray-800 line-clamp-2">{c.content}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={c.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author?.name || 'U')}&background=random&size=24`}
                          alt={c.author?.name} className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-gray-600 text-xs">{c.author?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.post ? (
                        <Link to={`/article/${c.post.slug}`}
                          className="text-xs text-medium-green hover:underline line-clamp-1 max-w-[150px] block">
                          {c.post.title}
                        </Link>
                      ) : <span className="text-gray-400 text-xs">Deleted</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteComment(c._id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 transition rounded" title="Delete">
                        <FiTrash2 className="text-sm" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No comments found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:border-gray-400 transition">← Prev</button>
              <span className="text-sm text-gray-500">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:border-gray-400 transition">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/posts/admin/stats')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const { topPosts, tagStats } = data;

  const engagementData = topPosts.map(p => ({
    name: p.title.substring(0, 18) + (p.title.length > 18 ? '…' : ''),
    views: p.views,
    likes: p.likes?.length || 0,
    claps: p.claps || 0,
  }));

  const tagPieData = tagStats.slice(0, 6).map(t => ({ name: t._id, value: t.count }));

  return (
    <div className="space-y-6">
      {/* Engagement chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-1 text-sm">Engagement by Article</h3>
        <p className="text-xs text-gray-400 mb-4">Views, likes and claps for your top articles</p>
        {engagementData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={engagementData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="views" fill="#1a8917" radius={[3, 3, 0, 0]} />
              <Bar dataKey="likes" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="claps" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tag distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-1 text-sm">Tag Distribution</h3>
          <p className="text-xs text-gray-400 mb-4">Most used tags across all articles</p>
          {tagPieData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No tags yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={tagPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name }) => name} labelLine={false}>
                  {tagPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top authors by total views */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-1 text-sm">Top Articles</h3>
          <p className="text-xs text-gray-400 mb-4">Ranked by total views</p>
          <div className="space-y-3">
            {topPosts.map((p, i) => (
              <div key={p._id} className="flex items-center gap-3">
                <span className="text-xl font-bold text-gray-200 w-7 flex-shrink-0 text-center">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.title}</p>
                  <p className="text-xs text-gray-400">{p.author?.name}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><FiEye className="text-xs" />{p.views}</span>
                  <span className="flex items-center gap-1"><FiHeart className="text-xs" />{p.likes?.length || 0}</span>
                </div>
              </div>
            ))}
            {topPosts.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No posts yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tags Tab ─────────────────────────────────────────────────────────────────
function TagsTab() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api.get('/posts/admin/tags')
      .then(r => setTags(r.data.tags))
      .catch(() => toast.error('Failed to load tags'))
      .finally(() => setLoading(false));
  }, []);

  const deleteTag = async (tag) => {
    if (!window.confirm(`Remove tag "${tag}" from all posts?`)) return;
    setDeleting(tag);
    try {
      await api.delete(`/posts/admin/tags/${encodeURIComponent(tag)}`);
      setTags(tags.filter(t => t._id !== tag));
      toast.success(`Tag "${tag}" removed`);
    } catch { toast.error('Failed to remove tag'); }
    finally { setDeleting(null); }
  };

  const filtered = tags.filter(t => t._id.toLowerCase().includes(search.toLowerCase()));
  const maxCount = tags[0]?.count || 1;

  return (
    <div>
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tags…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400" />
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left border-b border-gray-200">
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Tag</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Usage</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Popularity</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(t => (
                <tr key={t._id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <Link to={`/?tag=${t._id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-800 hover:text-medium-green transition">
                      <span className="text-gray-400">#</span>{t._id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                      {t.count} {t.count === 1 ? 'post' : 'posts'}
                    </span>
                  </td>
                  <td className="px-4 py-3 w-48">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-medium-green h-2 rounded-full transition-all"
                        style={{ width: `${(t.count / maxCount) * 100}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteTag(t._id)}
                      disabled={deleting === t._id}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition rounded disabled:opacity-40" title="Remove tag">
                      {deleting === t._id ? <span className="text-xs text-gray-400">…</span> : <FiTrash2 className="text-sm" />}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">No tags found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main AdminDashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabContent = {
    overview:  <OverviewTab />,
    articles:  <ArticlesTab />,
    users:     <UsersTab />,
    comments:  <CommentsTab />,
    analytics: <AnalyticsTab />,
    tags:      <TagsTab />,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your platform — articles, users, comments, and more.</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar nav */}
          <aside className="hidden md:flex flex-col w-48 flex-shrink-0">
            <nav className="space-y-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white shadow-sm text-gray-900 font-semibold border border-gray-200'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-white/60'}`}>
                    <Icon className="text-base flex-shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Mobile tab bar */}
          <div className="md:hidden w-full">
            <div className="flex gap-1 overflow-x-auto pb-1 mb-4">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-colors flex-shrink-0 ${
                      activeTab === tab.id ? 'bg-white shadow-sm text-gray-900 font-semibold border border-gray-200' : 'text-gray-500 hover:bg-white/60'}`}>
                    <Icon className="text-sm" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {tabContent[activeTab]}
          </div>
        </div>
      </div>
    </div>
  );
}

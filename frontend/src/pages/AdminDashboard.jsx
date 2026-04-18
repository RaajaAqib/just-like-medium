import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import {
  FiTrash2, FiShield, FiEye, FiUsers, FiFileText, FiMessageCircle,
  FiBarChart2, FiTag, FiStar, FiSlash, FiCheckCircle,
  FiAlertCircle, FiSearch, FiHeart, FiZap,
  FiGrid, FiToggleLeft, FiToggleRight, FiX, FiFlag, FiAlertTriangle,
  FiClock, FiBell, FiUserX, FiUserCheck, FiUser, FiPlus, FiSave,
  FiUpload, FiChevronDown, FiChevronUp, FiExternalLink,
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const TABS = [
  { id: 'overview',     label: 'Overview',     icon: FiGrid },
  { id: 'submissions',  label: 'Submissions',  icon: FiCheckCircle },
  { id: 'articles',     label: 'Articles',     icon: FiFileText },
  { id: 'users',        label: 'Users',        icon: FiUsers },
  { id: 'comments',     label: 'Comments',     icon: FiMessageCircle },
  { id: 'reports',      label: 'Reports',      icon: FiFlag },
  { id: 'appeals',      label: 'Appeals',      icon: FiAlertCircle },
  { id: 'analytics',    label: 'Analytics',    icon: FiBarChart2 },
  { id: 'tags',         label: 'Tags',         icon: FiTag },
  { id: 'developer',    label: 'Developer',    icon: FiUser },
];

const PIE_COLORS = ['#1a8917', '#242424', '#6b6b6b', '#d1d5db', '#86efac'];

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
      <div className={`inline-flex p-2.5 rounded-lg mb-3 ${color}`}>
        <Icon className="text-lg" />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value ?? '—'}</p>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-sm">Top Articles by Views</h3>
          {topPosts.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No data yet</p>
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-sm">Content Status</h3>
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-sm">Top Tags</h3>
          {tagStats.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No tags yet</p>
          ) : (
            <div className="space-y-2">
              {tagStats.map(t => (
                <div key={t._id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-28 truncate">#{t._id}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-medium-green h-2 rounded-full" style={{ width: `${(t.count / tagStats[0].count) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-6 text-right">{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent posts */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-sm">Recently Published</h3>
          <div className="space-y-3">
            {recentPosts.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No posts yet</p>}
            {recentPosts.map(p => (
              <div key={p._id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{p.author?.name} · {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 flex-shrink-0">
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
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 bg-white dark:bg-gray-800 dark:text-gray-200">
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="featured">Featured</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Title</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Author</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Views</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Likes</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(post => (
                  <tr key={post._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {post.featured && <FiStar className="text-yellow-400 flex-shrink-0" title="Featured" />}
                        <span className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1 max-w-[200px]">{post.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{post.author?.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        post.published ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{post.views}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{post.likes?.length || 0}</td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap">
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
                          className={`p-1.5 rounded transition ${post.featured ? 'text-yellow-400 hover:text-gray-400' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'}`}
                          title={post.featured ? 'Unfeature' : 'Feature'}>
                          <FiStar className="text-sm" />
                        </button>
                        <button onClick={() => togglePublish(post._id)}
                          className={`p-1.5 rounded transition ${post.published ? 'text-green-400 hover:text-gray-400' : 'text-gray-300 dark:text-gray-600 hover:text-green-400'}`}
                          title={post.published ? 'Unpublish' : 'Publish'}>
                          {post.published ? <FiToggleRight className="text-sm" /> : <FiToggleLeft className="text-sm" />}
                        </button>
                        <button onClick={() => deletePost(post._id)}
                          className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 transition rounded" title="Delete">
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 dark:text-gray-500">No articles found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-1.5 text-sm border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:border-gray-400 transition">← Prev</button>
              <span className="text-sm text-gray-500 dark:text-gray-400">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-1.5 text-sm border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:border-gray-400 transition">Next →</button>
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
  const [moderatingUser, setModeratingUser] = useState(null);

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

  const toggleVerify = async (id) => {
    try {
      const res = await api.put(`/users/admin/${id}/toggle-verify`);
      setUsers(users.map(u => u._id === id ? { ...u, isVerified: res.data.isVerified } : u));
      toast.success(res.data.isVerified ? 'User verified' : 'Verification removed');
    } catch { toast.error('Failed to update verification'); }
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
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 bg-white dark:bg-gray-800 dark:text-gray-200">
          <option value="all">All Users</option>
          <option value="admin">Admins</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">User</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Role</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Actions</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Followers</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Joined</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(u => (
                  <tr key={u._id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${u.banned ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&size=32`}
                          alt={u.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{u.name}</p>
                          {u.banned && <p className="text-xs text-red-500">Banned</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        u.isAdmin ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                        {u.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        u.banned      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                        u.isSuspended ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                                        'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                        {u.banned ? 'Banned' : u.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    {/* Active moderation badges */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.warnings?.length > 0 && (
                          <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium"
                            title={`${u.warnings.length} warning${u.warnings.length > 1 ? 's' : ''}`}>
                            {u.warnings.length}× warned
                          </span>
                        )}
                        {u.isSuspended && u.suspendedUntil && (
                          <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium"
                            title={`Until ${new Date(u.suspendedUntil).toLocaleDateString()}`}>
                            Susp. until {new Date(u.suspendedUntil).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                          </span>
                        )}
                        {u.banned && (
                          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                            Banned
                          </span>
                        )}
                        {!u.warnings?.length && !u.isSuspended && !u.banned && (
                          <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.followers?.length || 0}</td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap">
                      {format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to={`/profile/${u._id}`}
                          className="p-1.5 text-gray-400 hover:text-blue-500 transition rounded" title="View profile">
                          <FiEye className="text-sm" />
                        </Link>
                        <button onClick={() => toggleVerify(u._id)}
                          className={`p-1.5 rounded transition ${u.isVerified ? 'text-blue-500 hover:text-gray-400' : 'text-gray-300 dark:text-gray-600 hover:text-blue-500'}`}
                          title={u.isVerified ? 'Remove verification' : 'Verify user'}>
                          <FiCheckCircle className="text-sm" />
                        </button>
                        <button onClick={() => toggleAdmin(u._id)}
                          className={`p-1.5 rounded transition ${u.isAdmin ? 'text-purple-400 hover:text-gray-400' : 'text-gray-300 dark:text-gray-600 hover:text-purple-500'}`}
                          title={u.isAdmin ? 'Remove admin' : 'Make admin'}>
                          <FiShield className="text-sm" />
                        </button>
                        <button onClick={() => toggleBan(u._id)}
                          className={`p-1.5 rounded transition ${u.banned ? 'text-red-400 hover:text-gray-400' : 'text-gray-300 dark:text-gray-600 hover:text-red-500'}`}
                          title={u.banned ? 'Unban user' : 'Ban user'}>
                          <FiSlash className="text-sm" />
                        </button>
                        <button onClick={() => deleteUser(u._id)}
                          className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 transition rounded" title="Delete user">
                          <FiTrash2 className="text-sm" />
                        </button>
                        <button
                          onClick={() => setModeratingUser(u)}
                          className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-orange-500 transition rounded"
                          title="Moderate user"
                        >
                          <FiAlertTriangle className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 dark:text-gray-500">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-1.5 text-sm border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:border-gray-400 transition">← Prev</button>
              <span className="text-sm text-gray-500 dark:text-gray-400">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-1.5 text-sm border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:border-gray-400 transition">Next →</button>
            </div>
          )}
        </>
      )}

      {moderatingUser && (
        <UserModerationModal
          targetUser={moderatingUser}
          onClose={() => setModeratingUser(null)}
          onDone={() => { setModeratingUser(null); fetch(); }}
        />
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
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500" />
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Comment</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Author</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Article</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-gray-800 dark:text-gray-200 line-clamp-2">{c.content}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={c.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author?.name || 'U')}&background=random&size=24`}
                          alt={c.author?.name} className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-gray-600 dark:text-gray-400 text-xs">{c.author?.name}</span>
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
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteComment(c._id)}
                        className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 transition rounded" title="Delete">
                        <FiTrash2 className="text-sm" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 dark:text-gray-500">No comments found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-1.5 text-sm border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:border-gray-400 transition">← Prev</button>
              <span className="text-sm text-gray-500 dark:text-gray-400">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-1.5 text-sm border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:border-gray-400 transition">Next →</button>
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
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1 text-sm">Engagement by Article</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Views, likes and claps for your top articles</p>
        {engagementData.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No data yet</p>
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1 text-sm">Tag Distribution</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Most used tags across all articles</p>
          {tagPieData.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No tags yet</p>
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1 text-sm">Top Articles</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Ranked by total views</p>
          <div className="space-y-3">
            {topPosts.map((p, i) => (
              <div key={p._id} className="flex items-center gap-3">
                <span className="text-xl font-bold text-gray-200 dark:text-gray-700 w-7 flex-shrink-0 text-center">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{p.author?.name}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><FiEye className="text-xs" />{p.views}</span>
                  <span className="flex items-center gap-1"><FiHeart className="text-xs" />{p.likes?.length || 0}</span>
                </div>
              </div>
            ))}
            {topPosts.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No posts yet</p>}
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
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500" />
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Tag</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Usage</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Popularity</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(t => (
                <tr key={t._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition">
                  <td className="px-4 py-3">
                    <Link to={`/?tag=${t._id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-medium-green transition">
                      <span className="text-gray-400 dark:text-gray-500">#</span>{t._id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full font-medium">
                      {t.count} {t.count === 1 ? 'post' : 'posts'}
                    </span>
                  </td>
                  <td className="px-4 py-3 w-48">
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-medium-green h-2 rounded-full transition-all"
                        style={{ width: `${(t.count / maxCount) * 100}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteTag(t._id)}
                      disabled={deleting === t._id}
                      className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 transition rounded disabled:opacity-40" title="Remove tag">
                      {deleting === t._id ? <span className="text-xs text-gray-400 dark:text-gray-500">…</span> : <FiTrash2 className="text-sm" />}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400 dark:text-gray-500">No tags found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Moderation Action Modal ──────────────────────────────────────────────────
function ModerationModal({ comment, onClose, onDone }) {
  const [action, setAction]   = useState('dismiss');
  const [reason, setReason]   = useState('');
  const [days, setDays]       = useState(7);
  const [loading, setLoading] = useState(false);

  const ACTIONS = [
    { id: 'dismiss',  label: 'Dismiss report',      icon: FiCheckCircle,  color: 'text-green-600' },
    { id: 'delete',   label: 'Delete comment',       icon: FiTrash2,       color: 'text-red-600' },
    { id: 'warn',     label: 'Warn user',            icon: FiBell,         color: 'text-yellow-600' },
    { id: 'suspend',  label: 'Suspend user',         icon: FiUserX,        color: 'text-orange-600' },
    { id: 'ban',      label: 'Ban user permanently', icon: FiSlash,        color: 'text-red-700' },
  ];

  const submit = async () => {
    setLoading(true);
    try {
      const body = { reason: reason || undefined, days: action === 'suspend' ? days : undefined };
      if (action === 'dismiss') {
        await api.post(`/comments/admin/${comment._id}/dismiss`, body);
      } else if (action === 'delete') {
        await api.delete(`/comments/admin/${comment._id}/reported`, { data: body });
      } else if (action === 'warn') {
        await api.post(`/comments/admin/${comment._id}/warn`, body);
      } else if (action === 'suspend') {
        await api.post(`/comments/admin/${comment._id}/suspend`, body);
      } else if (action === 'ban') {
        await api.post(`/comments/admin/${comment._id}/ban`, body);
      }
      toast.success('Moderation action applied');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Moderate reported comment</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {comment.reportedBy?.length || 0} report{comment.reportedBy?.length !== 1 ? 's' : ''} ·{' '}
              by <span className="font-medium text-gray-600 dark:text-gray-300">{comment.author?.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <FiX />
          </button>
        </div>

        {/* Reported comment preview */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-4 border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-4">{comment.content}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
            {comment.post && (
              <Link to={`/article/${comment.post.slug}`} target="_blank"
                className="text-medium-green hover:underline line-clamp-1 max-w-[200px]">
                {comment.post.title}
              </Link>
            )}
            <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Report reasons summary */}
        {comment.reportReason && (
          <div className="mb-4 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">Latest report reason</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">{comment.reportReason}</p>
          </div>
        )}

        {/* Action selector */}
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Choose action</p>
        <div className="grid grid-cols-1 gap-1.5 mb-4">
          {ACTIONS.map(a => {
            const Icon = a.icon;
            return (
              <label key={a.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  action === a.id ? 'border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-700' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                <input type="radio" name="action" value={a.id} checked={action === a.id}
                  onChange={() => setAction(a.id)} className="accent-gray-800 dark:accent-gray-300" />
                <Icon className={`text-base flex-shrink-0 ${a.color}`} />
                <span className="text-sm text-gray-700 dark:text-gray-300">{a.label}</span>
              </label>
            );
          })}
        </div>

        {/* Suspend days */}
        {action === 'suspend' && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Suspension duration</label>
            <select value={days} onChange={e => setDays(Number(e.target.value))}
              className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 bg-white dark:bg-gray-700 dark:text-gray-200">
              {[1,3,7,14,30].map(d => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>)}
            </select>
          </div>
        )}

        {/* Optional reason/note */}
        {action !== 'dismiss' && (
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {action === 'delete' ? 'Internal note (optional)' : 'Reason sent to user (optional)'}
            </label>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              rows={2} placeholder="Violation of community guidelines…"
              className="w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500" />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition">
            Cancel
          </button>
          <button onClick={submit} disabled={loading}
            className="px-5 py-2 text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full hover:bg-gray-700 dark:hover:bg-white transition disabled:opacity-40">
            {loading ? 'Applying…' : 'Apply action'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab() {
  const [reportType, setReportType]   = useState('comments'); // 'comments' | 'stories'
  const [reports, setReports]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setFilter]     = useState('pending');
  const [page, setPage]               = useState(1);
  const [totalPages, setTotal]        = useState(1);
  const [totalCount, setCount]        = useState(0);
  const [selected, setSelected]       = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      if (reportType === 'comments') {
        const res = await api.get(`/comments/admin/reports?status=${statusFilter}&page=${page}&limit=15`);
        setReports(res.data.comments);
        setTotal(res.data.totalPages);
        setCount(res.data.total);
      } else {
        const res = await api.get(`/posts/admin/reports?status=${statusFilter}&page=${page}&limit=15`);
        setReports(res.data.posts);
        setTotal(res.data.totalPages);
        setCount(res.data.total);
      }
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  }, [reportType, statusFilter, page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);
  useEffect(() => { setPage(1); setReports([]); }, [reportType, statusFilter]);

  const STATUS_BADGE = {
    pending:   'bg-amber-100 text-amber-700',
    dismissed: 'bg-gray-100 text-gray-500',
    actioned:  'bg-red-100 text-red-600',
  };

  const dismissStory = async (postId) => {
    try {
      await api.post(`/posts/admin/${postId}/dismiss`);
      toast.success('Report dismissed');
      fetchReports();
    } catch { toast.error('Failed to dismiss'); }
  };

  const deleteStory = async (postId) => {
    if (!window.confirm('Delete this story permanently?')) return;
    try {
      await api.delete(`/posts/admin/${postId}/reported`);
      toast.success('Story deleted');
      fetchReports();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div>
      {/* Type toggle */}
      <div className="flex items-center gap-2 mb-4">
        {[{ id: 'comments', label: 'Comments' }, { id: 'stories', label: 'Stories' }].map(t => (
          <button key={t.id} onClick={() => setReportType(t.id)}
            className={`px-4 py-1.5 text-sm rounded-full border transition-colors font-medium ${
              reportType === t.id
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Header + status filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            Reported {reportType === 'comments' ? 'Comments' : 'Stories'}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{totalCount} total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['pending','all','dismissed','actioned'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors font-medium ${
                statusFilter === s
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : reports.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FiFlag className="text-3xl mx-auto mb-3 opacity-40" />
          <p className="text-sm">No {statusFilter !== 'all' ? statusFilter : ''} reports</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {reports.map(item => {
              const isStory = reportType === 'stories';
              const author  = item.author;
              const status  = item.moderationStatus || 'pending';
              return (
                <div key={item._id}
                  className={`bg-white dark:bg-gray-800 rounded-xl border p-4 shadow-sm ${
                    item.isHidden ? 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div className="flex items-start gap-3">
                    <img
                      src={author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author?.name || 'U')}&background=random&size=36`}
                      alt={author?.name}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{author?.name}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{author?.email}</span>
                          {item.isHidden && (
                            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                              Auto-hidden
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[status]}`}>
                            {status}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                          {isStory ? (
                            <>
                              <button
                                onClick={() => dismissStory(item._id)}
                                disabled={status !== 'pending'}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-full hover:border-gray-400 transition disabled:opacity-40">
                                <FiCheckCircle className="text-green-500" /> Dismiss
                              </button>
                              <button
                                onClick={() => deleteStory(item._id)}
                                disabled={status === 'actioned'}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-500 text-white rounded-full hover:bg-red-600 transition disabled:opacity-40">
                                <FiTrash2 /> Delete
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setSelected(item)}
                              disabled={status === 'dismissed' || status === 'actioned'}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-900 text-white rounded-full
                                hover:bg-gray-700 transition disabled:opacity-40 disabled:cursor-default">
                              <FiShield className="text-xs" /> Moderate
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Content preview */}
                      {isStory ? (
                        <div className="mt-2">
                          <Link to={`/article/${item.slug}`} target="_blank"
                            className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline line-clamp-1">
                            {item.title}
                          </Link>
                          {item.excerpt && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{item.excerpt}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed line-clamp-3">{item.content}</p>
                      )}

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                          <FiAlertTriangle className="text-amber-500" />
                          {item.reportedBy?.length || 0} report{item.reportedBy?.length !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock /> {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </span>
                        {!isStory && item.post && (
                          <Link to={`/article/${item.post.slug}`} target="_blank"
                            className="text-medium-green hover:underline line-clamp-1 max-w-[180px]">
                            {item.post.title}
                          </Link>
                        )}
                      </div>

                      {/* Report reason */}
                      {item.reportReason && (
                        <div className="mt-2 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            <span className="font-medium">Reason: </span>{item.reportReason}
                          </span>
                        </div>
                      )}

                      {/* Reporters */}
                      {item.reportedBy?.length > 0 && (
                        <div className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                          Reported by: {item.reportedBy.slice(0, 3).map(u => u.name || u.email).join(', ')}
                          {item.reportedBy.length > 3 && ` +${item.reportedBy.length - 3} more`}
                        </div>
                      )}

                      {item.moderationNote && (
                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 italic">Admin note: {item.moderationNote}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-1.5 text-sm border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:border-gray-400 transition">← Prev</button>
              <span className="text-sm text-gray-500 dark:text-gray-400">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-1.5 text-sm border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:border-gray-400 transition">Next →</button>
            </div>
          )}
        </>
      )}

      {selected && (
        <ModerationModal
          comment={selected}
          onClose={() => setSelected(null)}
          onDone={() => { setSelected(null); fetchReports(); }}
        />
      )}
    </div>
  );
}

// ─── Appeals Tab ──────────────────────────────────────────────────────────────
function AppealsTab() {
  const [appeals, setAppeals]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setFilter] = useState('pending');
  const [page, setPage]           = useState(1);
  const [totalPages, setTotal]    = useState(1);
  const [totalCount, setCount]    = useState(0);
  const [reviewing, setReviewing] = useState(null); // { appeal, decision: 'approve'|'reject' }
  const [note, setNote]           = useState('');
  const [submitting, setSub]      = useState(false);

  const fetchAppeals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/appeals/admin?status=${statusFilter}&page=${page}&limit=15`);
      setAppeals(res.data.appeals);
      setTotal(res.data.totalPages);
      setCount(res.data.total);
    } catch { toast.error('Failed to load appeals'); }
    finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { fetchAppeals(); }, [fetchAppeals]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const submitReview = async () => {
    if (!reviewing) return;
    setSub(true);
    try {
      const endpoint = `/appeals/admin/${reviewing.appeal._id}/${reviewing.decision}`;
      await api.put(endpoint, { note });
      toast.success(reviewing.decision === 'approve' ? 'Appeal approved' : 'Appeal rejected');
      setReviewing(null);
      setNote('');
      fetchAppeals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to review');
    } finally {
      setSub(false);
    }
  };

  const ACTION_LABELS = {
    warn:    { label: 'Warning',   color: 'bg-yellow-100 text-yellow-700' },
    suspend: { label: 'Suspension',color: 'bg-orange-100 text-orange-700' },
    ban:     { label: 'Ban',       color: 'bg-red-100 text-red-700' },
    delete:  { label: 'Deleted comment', color: 'bg-gray-100 text-gray-600' },
  };

  const STATUS_BADGE = {
    pending:  'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Appeals</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{totalCount} total appeals submitted by users</p>
        </div>
        <div className="flex gap-2">
          {['pending','all','approved','rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors font-medium ${
                statusFilter === s
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : appeals.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FiAlertCircle className="text-3xl mx-auto mb-3 opacity-40" />
          <p className="text-sm">No {statusFilter !== 'all' ? statusFilter : ''} appeals</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {appeals.map(a => {
              const actionMeta = ACTION_LABELS[a.action] || { label: a.action, color: 'bg-gray-100 text-gray-600' };
              return (
                <div key={a._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <img
                      src={a.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.user?.name || 'U')}&background=random&size=36`}
                      alt={a.user?.name}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{a.user?.name}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{a.user?.email}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionMeta.color}`}>
                            Appealing: {actionMeta.label}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[a.status]}`}>
                            {a.status}
                          </span>
                        </div>

                        {a.status === 'pending' && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => setReviewing({ appeal: a, decision: 'approve' })}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-full hover:bg-green-700 transition">
                              <FiUserCheck /> Approve
                            </button>
                            <button onClick={() => setReviewing({ appeal: a, decision: 'reject' })}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-500 text-white rounded-full hover:bg-red-600 transition">
                              <FiUserX /> Reject
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Original comment snapshot */}
                      <div className="mt-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 font-medium">Reported comment</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{a.commentContent}</p>
                      </div>

                      {/* Appeal reason */}
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Appeal reason</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{a.reason}</p>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1"><FiClock /> {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                        {a.reviewedBy && (
                          <span>Reviewed by <span className="font-medium text-gray-600 dark:text-gray-400">{a.reviewedBy.name}</span></span>
                        )}
                        {a.adminNote && (
                          <span className="italic text-gray-500 dark:text-gray-400">Note: {a.adminNote}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-1.5 text-sm border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:border-gray-400 transition">← Prev</button>
              <span className="text-sm text-gray-500 dark:text-gray-400">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-1.5 text-sm border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:border-gray-400 transition">Next →</button>
            </div>
          )}
        </>
      )}

      {/* Approve / reject confirm modal */}
      {reviewing && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {reviewing.decision === 'approve' ? 'Approve appeal' : 'Reject appeal'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {reviewing.decision === 'approve'
                ? 'Approving will reverse the moderation action and notify the user.'
                : 'Rejecting will keep the moderation action in place and notify the user.'}
            </p>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Admin note (optional)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              rows={3} placeholder="Internal or user-facing note…"
              className="w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500 rounded-lg px-3 py-2 resize-none mb-4 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setReviewing(null); setNote(''); }}
                className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition">Cancel</button>
              <button onClick={submitReview} disabled={submitting}
                className={`px-5 py-2 text-sm text-white rounded-full transition disabled:opacity-40 ${
                  reviewing.decision === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}>
                {submitting ? 'Saving…' : reviewing.decision === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── User Moderation Modal ────────────────────────────────────────────────────
function UserModerationModal({ targetUser, onClose, onDone }) {
  const [action, setAction]   = useState('warn');
  const [reason, setReason]   = useState('');
  const [days, setDays]       = useState(7);
  const [loading, setLoading] = useState(false);

  const ACTIONS = [
    { id: 'warn',    label: 'Warn user',              icon: FiBell,      color: 'text-yellow-600' },
    { id: 'suspend', label: 'Suspend user',            icon: FiUserX,     color: 'text-orange-600' },
    { id: 'ban',     label: targetUser?.banned ? 'Unban user' : 'Ban user permanently', icon: FiSlash, color: 'text-red-700' },
    { id: 'remove',  label: 'Remove all restrictions', icon: FiUserCheck, color: 'text-green-600' },
  ];

  const submit = async () => {
    setLoading(true);
    try {
      const body = { reason: reason || undefined, days: action === 'suspend' ? days : undefined };
      if (action === 'warn')    await api.post(`/users/admin/${targetUser._id}/warn`, body);
      else if (action === 'suspend') await api.post(`/users/admin/${targetUser._id}/suspend`, body);
      else if (action === 'ban')     await api.put(`/users/admin/${targetUser._id}/ban`, body);
      else if (action === 'remove')  await api.post(`/users/admin/${targetUser._id}/remove-restrictions`);
      toast.success('Action applied');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Moderate user</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {targetUser?.name} · {targetUser?.email}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <FiX />
          </button>
        </div>

        {/* Current status summary */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2.5 mb-4 flex flex-wrap gap-2 text-xs">
          <span className={`px-2 py-0.5 rounded-full font-medium ${
            targetUser?.banned ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
            targetUser?.isSuspended ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
            'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
            {targetUser?.banned ? 'Banned' : targetUser?.isSuspended ? 'Suspended' : 'Active'}
          </span>
          {targetUser?.warnings?.length > 0 && (
            <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">
              {targetUser.warnings.length}× warned
            </span>
          )}
        </div>

        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Choose action</p>
        <div className="grid grid-cols-1 gap-1.5 mb-4">
          {ACTIONS.map(a => {
            const Icon = a.icon;
            return (
              <label key={a.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  action === a.id ? 'border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-700' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                <input type="radio" name="user-action" value={a.id} checked={action === a.id}
                  onChange={() => setAction(a.id)} className="accent-gray-800 dark:accent-gray-300" />
                <Icon className={`text-base flex-shrink-0 ${a.color}`} />
                <span className="text-sm text-gray-700 dark:text-gray-300">{a.label}</span>
              </label>
            );
          })}
        </div>

        {action === 'suspend' && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Suspension duration</label>
            <select value={days} onChange={e => setDays(Number(e.target.value))}
              className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 bg-white dark:bg-gray-700 dark:text-gray-200">
              {[1,3,7,14,30].map(d => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>)}
            </select>
          </div>
        )}

        {(action === 'warn' || action === 'suspend' || action === 'ban') && action !== 'ban' && (
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Reason (sent to user, optional)</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              rows={2} placeholder="Violation of community guidelines…"
              className="w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500" />
          </div>
        )}

        {action === 'remove' && (
          <div className="mb-5 px-3 py-2.5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg text-xs text-green-700 dark:text-green-400">
            This will clear the ban, suspension, and all warnings from this user's record.
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="px-5 py-2 text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full hover:bg-gray-700 dark:hover:bg-white transition disabled:opacity-40">
            {loading ? 'Applying…' : 'Apply action'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Submissions Tab ──────────────────────────────────────────────────────────
const SUBMISSION_STATUS_META = {
  pending:            { label: 'Pending review',   cls: 'bg-gray-100 text-gray-600' },
  'in-review':        { label: 'In review',         cls: 'bg-blue-100 text-blue-700' },
  'edits-requested':  { label: 'Edits requested',   cls: 'bg-orange-100 text-orange-700' },
  approved:           { label: 'Approved',           cls: 'bg-green-100 text-green-700' },
  withdrawn:          { label: 'Withdrawn',          cls: 'bg-gray-100 text-gray-500' },
  declined:           { label: 'Declined',           cls: 'bg-red-100 text-red-600' },
};

function SubmissionsTab() {
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote]         = useState('');
  const [saving, setSaving]     = useState(false);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/posts/admin/submissions${params}`);
      setPosts(res.data.posts || []);
    } catch { toast.error('Failed to load submissions'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setSaving(true);
    try {
      await api.patch(`/posts/admin/${selected._id}/submission`, { status: newStatus, note });
      toast.success('Submission updated');
      setSelected(null);
      fetchSubmissions();
    } catch { toast.error('Failed to update submission'); }
    finally { setSaving(false); }
  };

  const pendingCount = posts.filter(p => p.submissionStatus === 'pending').length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Story Submissions</h2>
          {pendingCount > 0 && (
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-0.5">{pendingCount} pending review</p>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400"
        >
          <option value="">All submissions</option>
          {Object.entries(SUBMISSION_STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-16"><LoadingSpinner /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400 text-sm">No submissions found.</div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {posts.map(post => {
            const meta = SUBMISSION_STATUS_META[post.submissionStatus];
            return (
              <div key={post._id} className="flex items-start gap-4 p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                {/* Thumbnail */}
                <div className="w-14 h-10 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {post.coverImage
                    ? <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No img</div>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <Link to={`/article/${post.slug}`} target="_blank"
                        className="font-semibold text-gray-900 dark:text-gray-100 hover:underline text-sm line-clamp-1">
                        {post.title || 'Untitled'}
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        by {post.author?.name} · {post.readTime} min · {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
                      </p>
                      {post.submissionNote && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">Note: {post.submissionNote}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {meta && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.cls}`}>
                          {meta.label}
                        </span>
                      )}
                      <button
                        onClick={() => { setSelected(post); setNewStatus(post.submissionStatus); setNote(post.submissionNote || ''); }}
                        className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Review submission</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <FiX className="text-xl" />
              </button>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">{selected.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">by {selected.author?.name}</p>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 mb-3"
            >
              {Object.entries(SUBMISSION_STATUS_META).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Note to author (optional)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="e.g. Please revise the introduction..."
              className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 resize-none mb-4"
            />

            {newStatus === 'approved' && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4 text-xs text-green-700 dark:text-green-400">
                Approving will automatically publish this story.
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setSelected(null)}
                className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                Cancel
              </button>
              <button onClick={handleUpdateStatus} disabled={saving}
                className="px-4 py-2 text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full hover:opacity-90 disabled:opacity-50 transition">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Developer Profile Tab ───────────────────────────────────────────────────
const SKILL_CATS = ['technical', 'tools', 'soft', 'languages'];

function Section({ title, open, onToggle, children }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition text-left">
        <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{title}</span>
        {open ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
      </button>
      {open && <div className="p-5 space-y-4 bg-white dark:bg-gray-900">{children}</div>}
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

const INPUT = 'w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-medium-green/40';
const TEXTAREA = INPUT + ' resize-none';

function ImageUploadField({ label, current, fieldName, onChange }) {
  const inputRef = useRef();
  const [preview, setPreview] = useState(current || '');
  useEffect(() => setPreview(current || ''), [current]);
  return (
    <FieldRow label={label}>
      <div className="flex items-start gap-4">
        {preview && (
          <img src={preview} alt="preview" className="w-20 h-20 rounded-lg object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0" />
        )}
        <div className="flex-1">
          <input type="file" accept="image/*" ref={inputRef} className="hidden"
            onChange={e => {
              const f = e.target.files[0];
              if (!f) return;
              setPreview(URL.createObjectURL(f));
              onChange(fieldName, f);
            }} />
          <button type="button" onClick={() => inputRef.current.click()}
            className="flex items-center gap-2 text-sm px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-medium-green hover:text-medium-green transition">
            <FiUpload /> {preview ? 'Change image' : 'Upload image'}
          </button>
          {preview && (
            <button type="button" onClick={() => { setPreview(''); onChange(fieldName, null); }}
              className="mt-1 text-xs text-red-500 hover:underline">Remove</button>
          )}
        </div>
      </div>
    </FieldRow>
  );
}

function DeveloperProfileTab() {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [openSections, setOpenSections] = useState({
    header: true, aboutMe: true, experience: true, education: true,
    skills: true, projects: true, certifications: true,
    qrCode: true, websiteInfo: true, support: true,
  });
  const [files, setFiles] = useState({});

  // Local editable state
  const [f, setF] = useState({
    name: '', title: '', location: '', shortBio: '',
    fullBio: '', mission: '', yearsOfExperience: 0, currentRole: '', currentCompany: '',
    socialLinks: [],
    workExperience: [], education: [], skills: [], projects: [], certifications: [],
    qrLabel: '', qrPurpose: '', qrAltText: '',
    websiteInfo: { name: '', foundedYear: '', mission: '', techStack: '', version: '', contributors: '' },
    supportHeading: '', supportDescription: '', supportUpiId: '', supportPaypalEmail: '',
    supportBitcoin: '', supportBankDetails: '', supportThankYou: '',
    isVisible: true,
  });

  useEffect(() => {
    api.get('/developer-profile')
      .then(r => {
        const p = r.data.profile;
        setProfile(p);
        setF({
          name: p.name || '', title: p.title || '', location: p.location || '', shortBio: p.shortBio || '',
          fullBio: p.fullBio || '', mission: p.mission || '',
          yearsOfExperience: p.yearsOfExperience || 0,
          currentRole: p.currentRole || '', currentCompany: p.currentCompany || '',
          socialLinks: p.socialLinks?.length
            ? p.socialLinks.map(({ platform, url }) => ({ platform, url }))
            : [{ platform: '', url: '' }],
          workExperience: (p.workExperience || []).map(({ company, role, startDate, endDate, description }) => ({ company, role, startDate, endDate, description })),
          education:      (p.education      || []).map(({ degree, institution, year, grade }) => ({ degree, institution, year, grade })),
          skills:         (p.skills         || []).map(({ name, category }) => ({ name, category })),
          projects:       (p.projects       || []).map(({ name, description, technologies, link }) => ({ name, description, technologies, link })),
          certifications: (p.certifications || []).map(({ name, organization, year }) => ({ name, organization, year })),
          qrLabel:   p.qrCode?.label   || '',
          qrPurpose: p.qrCode?.purpose || '',
          qrAltText: p.qrCode?.altText || '',
          websiteInfo: {
            name:         p.websiteInfo?.name         || '',
            foundedYear:  p.websiteInfo?.foundedYear  || '',
            mission:      p.websiteInfo?.mission      || '',
            techStack:    p.websiteInfo?.techStack     || '',
            version:      p.websiteInfo?.version      || '',
            contributors: p.websiteInfo?.contributors || '',
          },
          supportHeading:     p.support?.heading         || '',
          supportDescription: p.support?.description     || '',
          supportUpiId:       p.support?.upiId           || '',
          supportPaypalEmail: p.support?.paypalEmail     || '',
          supportBitcoin:     p.support?.bitcoinAddress  || '',
          supportBankDetails: p.support?.bankDetails     || '',
          supportThankYou:    p.support?.thankYouMessage || '',
          isVisible: p.isVisible !== false,
        });
      })
      .catch(() => toast.error('Failed to load developer profile'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key) => setOpenSections(s => ({ ...s, [key]: !s[key] }));
  const set = (key, val) => setF(prev => ({ ...prev, [key]: val }));
  const setFile = (fieldName, file) => setFiles(prev => ({ ...prev, [fieldName]: file }));

  // ── Array helpers ────────────────────────────────────────────────────────────
  const addRow = (key, template) => setF(prev => ({ ...prev, [key]: [...prev[key], { ...template }] }));
  const removeRow = (key, idx) => setF(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }));
  const updateRow = (key, idx, field, val) =>
    setF(prev => ({ ...prev, [key]: prev[key].map((r, i) => i === idx ? { ...r, [field]: val } : r) }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = new FormData();
      // Scalars
      ['name','title','location','shortBio','fullBio','mission','currentRole','currentCompany',
       'qrLabel','qrPurpose','qrAltText',
       'supportHeading','supportDescription','supportUpiId','supportPaypalEmail',
       'supportBitcoin','supportBankDetails','supportThankYou'].forEach(k => data.append(k, f[k]));
      data.append('yearsOfExperience', f.yearsOfExperience);
      data.append('isVisible', f.isVisible);
      // Arrays
      data.append('socialLinks',    JSON.stringify(f.socialLinks.filter(s => s.url)));
      data.append('workExperience', JSON.stringify(f.workExperience));
      data.append('education',      JSON.stringify(f.education));
      data.append('skills',         JSON.stringify(f.skills));
      data.append('projects',       JSON.stringify(f.projects));
      data.append('certifications', JSON.stringify(f.certifications));
      data.append('websiteInfo',    JSON.stringify(f.websiteInfo));
      // Files
      if (files.photo)          data.append('photo',          files.photo);
      if (files.qrCode)         data.append('qrCode',         files.qrCode);
      if (files.paymentQrCode)  data.append('paymentQrCode',  files.paymentQrCode);

      const res = await api.put('/developer-profile', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(res.data.profile);
      setFiles({});
      toast.success('Developer profile saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Developer Profile</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Controls the <Link to="/about-developer" target="_blank" className="text-medium-green hover:underline inline-flex items-center gap-1">/about-developer <FiExternalLink className="text-xs" /></Link> page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
            <span className="text-xs">{f.isVisible ? 'Visible' : 'Hidden'}</span>
            <div onClick={() => set('isVisible', !f.isVisible)}
              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${f.isVisible ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${f.isVisible ? 'translate-x-4' : ''}`} />
            </div>
          </label>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full hover:opacity-90 disabled:opacity-50 transition">
            <FiSave className="text-sm" /> {saving ? 'Saving…' : 'Save all'}
          </button>
        </div>
      </div>

      {/* ── Section: Profile Header ── */}
      <Section title="Profile Header" open={openSections.header} onToggle={() => toggle('header')}>
        <ImageUploadField label="Profile Photo" current={profile?.photo} fieldName="photo" onChange={setFile} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldRow label="Full Name"><input className={INPUT} value={f.name} onChange={e => set('name', e.target.value)} placeholder="Raja Aqib" /></FieldRow>
          <FieldRow label="Title / Role"><input className={INPUT} value={f.title} onChange={e => set('title', e.target.value)} placeholder="Full-Stack Developer & Founder" /></FieldRow>
          <FieldRow label="Location"><input className={INPUT} value={f.location} onChange={e => set('location', e.target.value)} placeholder="Lahore, Pakistan" /></FieldRow>
        </div>
        <FieldRow label="Short Bio (tagline)">
          <textarea className={TEXTAREA} rows={2} value={f.shortBio} onChange={e => set('shortBio', e.target.value)} placeholder="1-2 sentences summarizing you…" />
        </FieldRow>
        <FieldRow label="Social Links">
          <div className="space-y-2">
            {f.socialLinks.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className={INPUT + ' w-32 flex-shrink-0'} value={s.platform} placeholder="github"
                  onChange={e => updateRow('socialLinks', i, 'platform', e.target.value)} />
                <input className={INPUT + ' flex-1'} value={s.url} placeholder="https://github.com/…"
                  onChange={e => updateRow('socialLinks', i, 'url', e.target.value)} />
                <button type="button" onClick={() => removeRow('socialLinks', i)}
                  className="text-gray-400 hover:text-red-500 transition flex-shrink-0"><FiX /></button>
              </div>
            ))}
            <button type="button" onClick={() => addRow('socialLinks', { platform: '', url: '' })}
              className="flex items-center gap-1.5 text-xs text-medium-green hover:underline">
              <FiPlus /> Add social link
            </button>
          </div>
        </FieldRow>
      </Section>

      {/* ── Section: About Me ── */}
      <Section title="About Me Tab" open={openSections.aboutMe} onToggle={() => toggle('aboutMe')}>
        <FieldRow label="Full Bio">
          <textarea className={TEXTAREA} rows={5} value={f.fullBio} onChange={e => set('fullBio', e.target.value)} placeholder="Your detailed bio / personal story…" />
        </FieldRow>
        <FieldRow label="Mission Statement">
          <textarea className={TEXTAREA} rows={2} value={f.mission} onChange={e => set('mission', e.target.value)} placeholder="Shown as a blockquote…" />
        </FieldRow>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FieldRow label="Years of Experience"><input type="number" min={0} className={INPUT} value={f.yearsOfExperience} onChange={e => set('yearsOfExperience', e.target.value)} /></FieldRow>
          <FieldRow label="Current Role"><input className={INPUT} value={f.currentRole} onChange={e => set('currentRole', e.target.value)} placeholder="Software Engineer" /></FieldRow>
          <FieldRow label="Current Company"><input className={INPUT} value={f.currentCompany} onChange={e => set('currentCompany', e.target.value)} placeholder="Company Name" /></FieldRow>
        </div>
      </Section>

      {/* ── Section: Work Experience ── */}
      <Section title="Work Experience Tab" open={openSections.experience} onToggle={() => toggle('experience')}>
        {f.workExperience.map((job, i) => (
          <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3 relative">
            <button type="button" onClick={() => removeRow('workExperience', i)}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"><FiX /></button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldRow label="Company"><input className={INPUT} value={job.company} onChange={e => updateRow('workExperience', i, 'company', e.target.value)} placeholder="Company Name" /></FieldRow>
              <FieldRow label="Role / Position"><input className={INPUT} value={job.role} onChange={e => updateRow('workExperience', i, 'role', e.target.value)} placeholder="Full-Stack Developer" /></FieldRow>
              <FieldRow label="Start Date"><input className={INPUT} value={job.startDate} onChange={e => updateRow('workExperience', i, 'startDate', e.target.value)} placeholder="Jan 2022" /></FieldRow>
              <FieldRow label="End Date"><input className={INPUT} value={job.endDate} onChange={e => updateRow('workExperience', i, 'endDate', e.target.value)} placeholder="Present" /></FieldRow>
            </div>
            <FieldRow label="Description">
              <textarea className={TEXTAREA} rows={3} value={job.description} onChange={e => updateRow('workExperience', i, 'description', e.target.value)} placeholder="Key responsibilities and achievements…" />
            </FieldRow>
          </div>
        ))}
        <button type="button" onClick={() => addRow('workExperience', { company: '', role: '', startDate: '', endDate: 'Present', description: '' })}
          className="flex items-center gap-1.5 text-sm text-medium-green hover:underline">
          <FiPlus /> Add experience
        </button>
      </Section>

      {/* ── Section: Education ── */}
      <Section title="Education Tab" open={openSections.education} onToggle={() => toggle('education')}>
        {f.education.map((edu, i) => (
          <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3 relative">
            <button type="button" onClick={() => removeRow('education', i)}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"><FiX /></button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldRow label="Degree"><input className={INPUT} value={edu.degree} onChange={e => updateRow('education', i, 'degree', e.target.value)} placeholder="B.Sc Computer Science" /></FieldRow>
              <FieldRow label="Institution"><input className={INPUT} value={edu.institution} onChange={e => updateRow('education', i, 'institution', e.target.value)} placeholder="University Name" /></FieldRow>
              <FieldRow label="Year"><input className={INPUT} value={edu.year} onChange={e => updateRow('education', i, 'year', e.target.value)} placeholder="2023" /></FieldRow>
              <FieldRow label="Grade / CGPA"><input className={INPUT} value={edu.grade} onChange={e => updateRow('education', i, 'grade', e.target.value)} placeholder="3.8 / 4.0" /></FieldRow>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => addRow('education', { degree: '', institution: '', year: '', grade: '' })}
          className="flex items-center gap-1.5 text-sm text-medium-green hover:underline">
          <FiPlus /> Add education
        </button>
      </Section>

      {/* ── Section: Skills ── */}
      <Section title="Skills Tab" open={openSections.skills} onToggle={() => toggle('skills')}>
        <div className="space-y-2">
          {f.skills.map((skill, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className={INPUT + ' flex-1'} value={skill.name} placeholder="e.g. React"
                onChange={e => updateRow('skills', i, 'name', e.target.value)} />
              <select className={INPUT + ' w-32 flex-shrink-0'} value={skill.category}
                onChange={e => updateRow('skills', i, 'category', e.target.value)}>
                {SKILL_CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
              <button type="button" onClick={() => removeRow('skills', i)}
                className="text-gray-400 hover:text-red-500 transition flex-shrink-0"><FiX /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => addRow('skills', { name: '', category: 'technical' })}
          className="flex items-center gap-1.5 text-sm text-medium-green hover:underline">
          <FiPlus /> Add skill
        </button>
      </Section>

      {/* ── Section: Projects ── */}
      <Section title="Projects Tab" open={openSections.projects} onToggle={() => toggle('projects')}>
        {f.projects.map((proj, i) => (
          <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3 relative">
            <button type="button" onClick={() => removeRow('projects', i)}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"><FiX /></button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldRow label="Project Name"><input className={INPUT} value={proj.name} onChange={e => updateRow('projects', i, 'name', e.target.value)} placeholder="Just Like Medium" /></FieldRow>
              <FieldRow label="Live / GitHub Link"><input className={INPUT} value={proj.link} onChange={e => updateRow('projects', i, 'link', e.target.value)} placeholder="https://github.com/…" /></FieldRow>
            </div>
            <FieldRow label="Technologies (comma-separated)">
              <input className={INPUT} value={proj.technologies} onChange={e => updateRow('projects', i, 'technologies', e.target.value)} placeholder="React, Node.js, MongoDB" />
            </FieldRow>
            <FieldRow label="Description">
              <textarea className={TEXTAREA} rows={2} value={proj.description} onChange={e => updateRow('projects', i, 'description', e.target.value)} placeholder="Brief description…" />
            </FieldRow>
          </div>
        ))}
        <button type="button" onClick={() => addRow('projects', { name: '', description: '', technologies: '', link: '' })}
          className="flex items-center gap-1.5 text-sm text-medium-green hover:underline">
          <FiPlus /> Add project
        </button>
      </Section>

      {/* ── Section: Certifications ── */}
      <Section title="Certifications & Awards Tab" open={openSections.certifications} onToggle={() => toggle('certifications')}>
        {f.certifications.map((cert, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
              <input className={INPUT} value={cert.name} onChange={e => updateRow('certifications', i, 'name', e.target.value)} placeholder="Cert Name" />
              <input className={INPUT} value={cert.organization} onChange={e => updateRow('certifications', i, 'organization', e.target.value)} placeholder="Organization" />
              <input className={INPUT} value={cert.year} onChange={e => updateRow('certifications', i, 'year', e.target.value)} placeholder="2024" />
            </div>
            <button type="button" onClick={() => removeRow('certifications', i)}
              className="text-gray-400 hover:text-red-500 transition mt-2 flex-shrink-0"><FiX /></button>
          </div>
        ))}
        <button type="button" onClick={() => addRow('certifications', { name: '', organization: '', year: '' })}
          className="flex items-center gap-1.5 text-sm text-medium-green hover:underline">
          <FiPlus /> Add certification
        </button>
      </Section>

      {/* ── Section: QR Code ── */}
      <Section title="QR Code Section" open={openSections.qrCode} onToggle={() => toggle('qrCode')}>
        <ImageUploadField label="QR Code Image" current={profile?.qrCode?.image} fieldName="qrCode" onChange={setFile} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldRow label="Label (shown below QR)"><input className={INPUT} value={f.qrLabel} onChange={e => set('qrLabel', e.target.value)} placeholder="Scan to connect" /></FieldRow>
          <FieldRow label="Purpose / Description"><input className={INPUT} value={f.qrPurpose} onChange={e => set('qrPurpose', e.target.value)} placeholder="Scan to view my LinkedIn profile" /></FieldRow>
          <FieldRow label="Alt Text"><input className={INPUT} value={f.qrAltText} onChange={e => set('qrAltText', e.target.value)} placeholder="QR code for LinkedIn" /></FieldRow>
        </div>
      </Section>

      {/* ── Section: About Website ── */}
      <Section title="About the Website Section" open={openSections.websiteInfo} onToggle={() => toggle('websiteInfo')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ['name',         'Platform Name',        'Just Like Medium'],
            ['foundedYear',  'Founded Year',          '2025'],
            ['version',      'Version',               '1.0.0'],
            ['contributors', 'Contributors',          'Raja Aqib'],
          ].map(([key, label, ph]) => (
            <FieldRow key={key} label={label}>
              <input className={INPUT} value={f.websiteInfo[key]} placeholder={ph}
                onChange={e => setF(prev => ({ ...prev, websiteInfo: { ...prev.websiteInfo, [key]: e.target.value } }))} />
            </FieldRow>
          ))}
        </div>
        <FieldRow label="Mission Statement">
          <textarea className={TEXTAREA} rows={2} value={f.websiteInfo.mission} placeholder="A platform for writers…"
            onChange={e => setF(prev => ({ ...prev, websiteInfo: { ...prev.websiteInfo, mission: e.target.value } }))} />
        </FieldRow>
        <FieldRow label="Tech Stack (comma-separated)">
          <input className={INPUT} value={f.websiteInfo.techStack} placeholder="React, Node.js, MongoDB, Cloudinary"
            onChange={e => setF(prev => ({ ...prev, websiteInfo: { ...prev.websiteInfo, techStack: e.target.value } }))} />
        </FieldRow>
      </Section>

      {/* ── Section: Support / Buy Me a Coffee ── */}
      <Section title="Support / Buy Me a Coffee Section" open={openSections.support} onToggle={() => toggle('support')}>
        <FieldRow label="Heading"><input className={INPUT} value={f.supportHeading} onChange={e => set('supportHeading', e.target.value)} placeholder="Buy Me a Coffee ☕" /></FieldRow>
        <FieldRow label="Description">
          <textarea className={TEXTAREA} rows={2} value={f.supportDescription} onChange={e => set('supportDescription', e.target.value)} placeholder="If you like this platform, consider supporting its development." />
        </FieldRow>
        <ImageUploadField label="Payment QR Code" current={profile?.support?.paymentQrCode} fieldName="paymentQrCode" onChange={setFile} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldRow label="UPI ID"><input className={INPUT} value={f.supportUpiId} onChange={e => set('supportUpiId', e.target.value)} placeholder="developer@upi" /></FieldRow>
          <FieldRow label="PayPal Email"><input className={INPUT} value={f.supportPaypalEmail} onChange={e => set('supportPaypalEmail', e.target.value)} placeholder="dev@paypal.com" /></FieldRow>
          <FieldRow label="Bitcoin Address"><input className={INPUT} value={f.supportBitcoin} onChange={e => set('supportBitcoin', e.target.value)} placeholder="1A1zP1…" /></FieldRow>
        </div>
        <FieldRow label="Bank Details">
          <textarea className={TEXTAREA} rows={3} value={f.supportBankDetails} onChange={e => set('supportBankDetails', e.target.value)} placeholder="Bank: XXX&#10;Account: 123456789&#10;IFSC: ABC0001234" />
        </FieldRow>
        <FieldRow label="Thank You Message">
          <input className={INPUT} value={f.supportThankYou} onChange={e => set('supportThankYou', e.target.value)} placeholder="Thank you for your support! ❤️" />
        </FieldRow>
      </Section>

      {/* Floating save button at bottom */}
      <div className="flex justify-end pt-2">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full hover:opacity-90 disabled:opacity-50 transition font-medium">
          <FiSave /> {saving ? 'Saving…' : 'Save all changes'}
        </button>
      </div>

    </div>
  );
}

// ─── Main AdminDashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabContent = {
    overview:    <OverviewTab />,
    submissions: <SubmissionsTab />,
    articles:    <ArticlesTab />,
    users:       <UsersTab />,
    comments:    <CommentsTab />,
    reports:     <ReportsTab />,
    appeals:     <AppealsTab />,
    analytics:   <AnalyticsTab />,
    tags:        <TagsTab />,
    developer:   <DeveloperProfileTab />,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your platform — articles, users, comments, and more.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Sidebar nav — desktop only */}
          <aside className="hidden md:flex flex-col w-48 flex-shrink-0">
            <nav className="space-y-1 sticky top-6">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-gray-100 font-semibold border border-gray-200 dark:border-gray-700'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-800/60'}`}>
                    <Icon className="text-base flex-shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Mobile tab bar — scrollable pill strip */}
          <div className="md:hidden -mx-4 px-4">
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-hide">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs whitespace-nowrap transition-colors flex-shrink-0 font-medium ${
                      activeTab === tab.id
                        ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>
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

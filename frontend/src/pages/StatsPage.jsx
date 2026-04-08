import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SidebarLayout from '../components/SidebarLayout';
import api from '../utils/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';

export default function StatsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get(`/users/${user._id}`)
      .then(res => setPosts(res.data.posts || []))
      .finally(() => setLoading(false));
  }, [user]);

  const totalViews = posts.reduce((s, p) => s + (p.views || 0), 0);
  const totalLikes = posts.reduce((s, p) => s + (p.likes?.length || 0), 0);
  const totalClaps = posts.reduce((s, p) => s + (p.claps || 0), 0);

  const tabs = ['Stories', 'Audience'];

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold font-serif text-medium-black mb-8">Stats</h1>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-medium-border mb-8">
          {tabs.map((t, i) => (
            <button key={t}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition ${i === 0 ? 'border-medium-black text-medium-black' : 'border-transparent text-medium-gray hover:text-medium-black'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            {/* Monthly summary */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl font-bold text-medium-black">Monthly</h2>
                  <p className="text-xs text-medium-gray">This month · Updated hourly</p>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4 mt-6 mb-8">
                {[
                  { label: 'Views', value: totalViews },
                  { label: 'Reads', value: Math.floor(totalViews * 0.6) },
                  { label: 'Claps', value: totalClaps },
                  { label: 'Followers', value: user?.followers?.length || 0 },
                  { label: 'Stories', value: posts.length },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <p className="text-4xl font-bold text-medium-black">{stat.value}</p>
                    <p className="text-sm text-medium-gray mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Simple chart placeholder */}
              <div className="border border-medium-border rounded-lg p-6 h-40 flex items-end gap-1 relative">
                <div className="absolute top-3 left-4 flex items-center gap-4 text-xs text-medium-gray">
                  <span className="flex items-center gap-1"><span className="w-3 h-px bg-gray-300 inline-block"/> Views</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-px bg-medium-green inline-block"/> Reads</span>
                </div>
                {Array.from({ length: 30 }, (_, i) => {
                  const h = Math.random() * 60 + 5;
                  return (
                    <div key={i} className="flex-1 flex flex-col gap-0.5 items-center">
                      <div className="w-full bg-gray-200 rounded-sm" style={{ height: `${h}%` }} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lifetime */}
            <div className="border-t border-medium-border pt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-medium-black">Lifetime</h2>
              </div>

              {posts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-medium-gray mb-4">You haven't published any stories yet.</p>
                  <Link to="/write" className="btn-black px-6 py-2 text-sm">Start writing</Link>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-medium-border text-medium-gray text-xs">
                      <th className="pb-2 font-medium">Story</th>
                      <th className="pb-2 font-medium text-right">Views</th>
                      <th className="pb-2 font-medium text-right">Reads</th>
                      <th className="pb-2 font-medium text-right">Claps</th>
                      <th className="pb-2 font-medium text-right">Likes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map(post => (
                      <tr key={post._id} className="border-b border-medium-border hover:bg-gray-50">
                        <td className="py-3 pr-4">
                          <Link to={`/article/${post.slug}`}
                            className="font-medium text-medium-black hover:underline line-clamp-1">
                            {post.title}
                          </Link>
                        </td>
                        <td className="py-3 text-right text-medium-gray">{post.views || 0}</td>
                        <td className="py-3 text-right text-medium-gray">{Math.floor((post.views || 0) * 0.6)}</td>
                        <td className="py-3 text-right text-medium-gray">{post.claps || 0}</td>
                        <td className="py-3 text-right text-medium-gray">{post.likes?.length || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  );
}

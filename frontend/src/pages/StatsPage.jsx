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
  const [activeTab, setActiveTab] = useState('Stories');

  useEffect(() => {
    if (!user) return;
    api.get('/users/me/posts')
      .then(res => setPosts(res.data.posts || []))
      .finally(() => setLoading(false));
  }, [user]);

  const published = posts.filter(p => p.published);
  const totalViews = published.reduce((s, p) => s + (p.views || 0), 0);
  const totalLikes = published.reduce((s, p) => s + (p.likes?.length || 0), 0);
  const totalClaps = published.reduce((s, p) => s + (p.claps || 0), 0);

  // Build a simple bar chart from real post view data (top 10 posts by views)
  const chartPosts = [...published].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);
  const maxViews = Math.max(...chartPosts.map(p => p.views || 0), 1);

  const tabs = ['Stories', 'Audience'];

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="text-4xl font-bold font-serif text-medium-black mb-8">Stats</h1>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-medium-border mb-8">
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition ${activeTab === t ? 'border-medium-black text-medium-black' : 'border-transparent text-medium-gray hover:text-medium-black'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            {activeTab === 'Stories' && (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'Total Views', value: totalViews },
                    { label: 'Total Likes', value: totalLikes },
                    { label: 'Total Claps', value: totalClaps },
                    { label: 'Published Stories', value: published.length },
                  ].map(stat => (
                    <div key={stat.label} className="border border-medium-border rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-medium-black">{stat.value}</p>
                      <p className="text-xs text-medium-gray mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Views per post chart */}
                {chartPosts.length > 0 && (
                  <div className="border border-medium-border rounded-lg p-6 mb-8">
                    <h3 className="text-sm font-semibold text-medium-black mb-4">Views by story</h3>
                    <div className="space-y-3">
                      {chartPosts.map(p => (
                        <div key={p._id} className="flex items-center gap-3">
                          <Link to={`/article/${p.slug}`}
                            className="text-xs text-medium-gray hover:text-medium-black w-36 flex-shrink-0 truncate">
                            {p.title}
                          </Link>
                          <div className="flex-1 bg-gray-100 rounded-full h-3">
                            <div
                              className="bg-medium-green h-3 rounded-full transition-all"
                              style={{ width: `${Math.max(((p.views || 0) / maxViews) * 100, 2)}%` }}
                            />
                          </div>
                          <span className="text-xs text-medium-gray w-10 text-right flex-shrink-0">
                            {p.views || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lifetime table */}
                <div className="border-t border-medium-border pt-8">
                  <h2 className="text-xl font-bold text-medium-black mb-4">Lifetime</h2>
                  {published.length === 0 ? (
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
                          <th className="pb-2 font-medium text-right">Claps</th>
                          <th className="pb-2 font-medium text-right">Likes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {published.map(post => (
                          <tr key={post._id} className="border-b border-medium-border hover:bg-gray-50">
                            <td className="py-3 pr-4">
                              <Link to={`/article/${post.slug}`}
                                className="font-medium text-medium-black hover:underline line-clamp-1">
                                {post.title}
                              </Link>
                            </td>
                            <td className="py-3 text-right text-medium-gray">{post.views || 0}</td>
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

            {activeTab === 'Audience' && (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                  {[
                    { label: 'Followers', value: user?.followers?.length || 0 },
                    { label: 'Following', value: user?.following?.length || 0 },
                    { label: 'Total Readers', value: totalViews },
                  ].map(stat => (
                    <div key={stat.label} className="border border-medium-border rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-medium-black">{stat.value}</p>
                      <p className="text-xs text-medium-gray mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {(user?.followers?.length || 0) === 0 ? (
                  <div className="text-center py-16 border border-medium-border rounded-lg">
                    <p className="text-medium-black font-medium mb-2">No followers yet</p>
                    <p className="text-medium-gray text-sm mb-4">
                      Publish quality stories to grow your audience.
                    </p>
                    <Link to="/write" className="btn-black px-6 py-2 text-sm">Write a story</Link>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-medium-black mb-4">Your followers</h3>
                    <div className="space-y-3">
                      {(user.followers || []).map(f => (
                        <Link key={f._id || f} to={`/profile/${f._id || f}`}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-medium-border transition">
                          <img
                            src={f.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name || 'U')}&background=random`}
                            className="w-9 h-9 rounded-full object-cover" alt={f.name} />
                          <div>
                            <p className="font-medium text-medium-black text-sm">{f.name || 'Reader'}</p>
                            <p className="text-xs text-medium-gray">Follower</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </SidebarLayout>
  );
}

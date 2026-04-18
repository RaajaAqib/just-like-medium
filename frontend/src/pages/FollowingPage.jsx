import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SidebarLayout from '../components/SidebarLayout';
import api from '../utils/axios';
import { FiBookOpen, FiClock, FiCheckCircle } from 'react-icons/fi';

const TABS = ['Following', 'Reading history', 'Muted', 'Suggestions'];

function UserAvatar({ user, size = 'w-10 h-10' }) {
  return (
    <img
      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=random`}
      className={`${size} rounded-full object-cover flex-shrink-0`}
      alt={user.name}
    />
  );
}

function WriterRow({ user, actionLabel, actionClass, onAction, actionDone }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handle() {
    setLoading(true);
    await onAction(user._id);
    setDone(true);
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3 py-3">
      <Link to={`/profile/${user._id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <UserAvatar user={user} />
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="font-medium text-medium-black dark:text-gray-200 text-sm truncate">{user.name}</p>
            {user.isVerified && (
              <svg className="w-3.5 h-3.5 text-medium-green flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            )}
          </div>
          {user.bio && <p className="text-xs text-medium-gray dark:text-gray-500 truncate">{user.bio}</p>}
          <p className="text-xs text-medium-gray dark:text-gray-500">{user.followers?.length || 0} followers</p>
        </div>
      </Link>
      {!done ? (
        <button
          onClick={handle}
          disabled={loading}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full border text-sm transition ${actionClass}`}
        >
          {loading ? '...' : actionLabel}
        </button>
      ) : (
        <span className="flex-shrink-0 flex items-center gap-1 text-xs text-medium-gray dark:text-gray-400 px-2">
          <FiCheckCircle size={14} /> {actionDone}
        </span>
      )}
    </div>
  );
}

export default function FollowingPage() {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState('Following');

  const [following, setFollowing] = useState([]);
  const [followedTopics, setFollowedTopics] = useState([]);
  const [mutedUsers, setMutedUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFetched, setHistoryFetched] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [allTopics, setAllTopics] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsFetched, setSuggestionsFetched] = useState(false);

  useEffect(() => {
    fetchFollowingData();
  }, []);

  useEffect(() => {
    if (activeTab === 'Reading history' && !historyFetched) {
      fetchHistory();
    }
    if (activeTab === 'Suggestions' && !suggestionsFetched) {
      fetchSuggestions();
    }
  }, [activeTab]);

  async function fetchFollowingData() {
    try {
      setDataLoading(true);
      const { data } = await api.get('/users/me/following-data');
      setFollowing(data.following || []);
      setFollowedTopics(data.followedTopics || []);
      setMutedUsers(data.mutedUsers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  }

  async function fetchHistory() {
    try {
      setHistoryLoading(true);
      const { data } = await api.get('/users/me/history');
      setHistory(data.history || []);
      setHistoryFetched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function fetchSuggestions() {
    try {
      setSuggestionsLoading(true);
      const [suggestRes, topicsRes] = await Promise.all([
        api.get('/users/suggestions'),
        api.get('/topics'),
      ]);
      setSuggestions(suggestRes.data.suggestions || []);
      const all = topicsRes.data.topics || [];
      setAllTopics(all);
      setSuggestionsFetched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSuggestionsLoading(false);
    }
  }

  async function unfollowUser(userId) {
    await api.post(`/users/${userId}/follow`);
    setFollowing(prev => prev.filter(u => u._id !== userId));
  }

  async function unfollowTopic(topic) {
    await api.post('/users/topics/follow', { topic });
    setFollowedTopics(prev => prev.filter(t => t.toLowerCase() !== topic.toLowerCase()));
  }

  async function followTopic(topic) {
    await api.post('/users/topics/follow', { topic });
    setFollowedTopics(prev => [...prev, topic]);
  }

  async function unmuteUser(userId) {
    await api.post(`/users/${userId}/mute`);
    setMutedUsers(prev => prev.filter(u => u._id !== userId));
  }

  async function muteUser(userId) {
    await api.post(`/users/${userId}/mute`);
  }

  async function followSuggestion(userId) {
    await api.post(`/users/${userId}/follow`);
    setSuggestions(prev => prev.filter(u => u._id !== userId));
  }

  async function clearHistory() {
    if (!confirm('Clear your entire reading history? This cannot be undone.')) return;
    await api.delete('/users/me/history');
    setHistory([]);
  }

  const unfollowedTopics = allTopics.filter(
    t => !followedTopics.map(ft => ft.toLowerCase()).includes(t.toLowerCase())
  );

  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <h1 className="text-3xl font-bold font-serif text-medium-black dark:text-gray-100 mb-1">
          Refine recommendations
        </h1>
        <p className="text-medium-gray dark:text-gray-400 text-sm mb-8">
          Adjust recommendations by updating what you're following, your reading history, and who you've muted.
        </p>

        {/* Tabs */}
        <div className="flex border-b border-medium-border dark:border-gray-700 mb-8 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-medium-black dark:border-gray-100 text-medium-black dark:text-gray-100'
                  : 'border-transparent text-medium-gray dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ─── FOLLOWING TAB ─── */}
        {activeTab === 'Following' && (
          <div>
            {dataLoading ? (
              <div className="text-center py-12 text-medium-gray dark:text-gray-400 text-sm">Loading...</div>
            ) : (
              <>
                {/* Writers */}
                <section className="mb-8">
                  <p className="text-sm text-medium-gray dark:text-gray-400 mb-3">
                    {following.length} writer{following.length !== 1 ? 's' : ''}
                  </p>
                  {following.length === 0 ? (
                    <p className="text-medium-gray dark:text-gray-500 text-sm py-4 border-t border-medium-border dark:border-gray-700">
                      You're not following any writers yet.{' '}
                      <button onClick={() => setActiveTab('Suggestions')} className="underline text-medium-black dark:text-gray-300">
                        See suggestions
                      </button>
                    </p>
                  ) : (
                    <div className="divide-y divide-medium-border dark:divide-gray-700">
                      {following.map(u => (
                        <WriterRow
                          key={u._id}
                          user={u}
                          actionLabel="Following"
                          actionClass="border-medium-border dark:border-gray-600 text-medium-black dark:text-gray-200 hover:border-red-400 hover:text-red-500 dark:hover:border-red-400 dark:hover:text-red-400"
                          onAction={unfollowUser}
                          actionDone="Unfollowed"
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* Topics */}
                <section className="border-t border-medium-border dark:border-gray-700 pt-6">
                  <p className="text-sm text-medium-gray dark:text-gray-400 mb-3">
                    {followedTopics.length} topic{followedTopics.length !== 1 ? 's' : ''}
                  </p>
                  {followedTopics.length === 0 ? (
                    <p className="text-medium-gray dark:text-gray-500 text-sm py-4">
                      You're not following any topics yet.{' '}
                      <button onClick={() => setActiveTab('Suggestions')} className="underline text-medium-black dark:text-gray-300">
                        Discover topics
                      </button>
                    </p>
                  ) : (
                    <div className="divide-y divide-medium-border dark:divide-gray-700">
                      {followedTopics.map(topic => (
                        <TopicRow key={topic} topic={topic} onUnfollow={unfollowTopic} />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        )}

        {/* ─── READING HISTORY TAB ─── */}
        {activeTab === 'Reading history' && (
          <div>
            {historyLoading ? (
              <div className="text-center py-12 text-medium-gray dark:text-gray-400 text-sm">Loading...</div>
            ) : (
              <>
                {history.length > 0 && (
                  <div className="flex items-start justify-between mb-6 gap-4">
                    <p className="text-sm text-medium-gray dark:text-gray-400">
                      You can clear your reading history for a fresh start.
                    </p>
                    <button
                      onClick={clearHistory}
                      className="flex-shrink-0 text-sm font-medium text-medium-black dark:text-gray-200 underline underline-offset-2 hover:text-medium-gray dark:hover:text-gray-400 transition"
                    >
                      Clear history
                    </button>
                  </div>
                )}

                {history.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-medium-black dark:text-gray-200 font-medium mb-1">No reading history</p>
                    <p className="text-medium-gray dark:text-gray-400 text-sm">Articles you read will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-0 divide-y divide-medium-border dark:divide-gray-700">
                    {history.map(post => (
                      <HistoryItem key={post._id || post.slug} post={post} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── MUTED TAB ─── */}
        {activeTab === 'Muted' && (
          <div>
            {dataLoading ? (
              <div className="text-center py-12 text-medium-gray dark:text-gray-400 text-sm">Loading...</div>
            ) : mutedUsers.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-medium-black dark:text-gray-200 font-medium mb-1">You haven't muted anything</p>
                <p className="text-medium-gray dark:text-gray-400 text-sm">
                  Writers and topics you've muted will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-medium-border dark:divide-gray-700">
                {mutedUsers.map(u => (
                  <WriterRow
                    key={u._id}
                    user={u}
                    actionLabel="Unmute"
                    actionClass="border-medium-border dark:border-gray-600 text-medium-black dark:text-gray-200 hover:border-green-400 hover:text-green-500 dark:hover:border-green-400 dark:hover:text-green-400"
                    onAction={unmuteUser}
                    actionDone="Unmuted"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── SUGGESTIONS TAB ─── */}
        {activeTab === 'Suggestions' && (
          <div>
            {suggestionsLoading ? (
              <div className="text-center py-12 text-medium-gray dark:text-gray-400 text-sm">Loading...</div>
            ) : (
              <>
                {/* Writers to follow */}
                {suggestions.length > 0 && (
                  <section className="mb-10">
                    <h3 className="font-semibold text-medium-black dark:text-gray-200 mb-1">Writers to follow</h3>
                    <div className="divide-y divide-medium-border dark:divide-gray-700">
                      {suggestions.map(u => (
                        <WriterRow
                          key={u._id}
                          user={u}
                          actionLabel="Follow"
                          actionClass="bg-medium-black dark:bg-gray-200 text-white dark:text-gray-900 border-transparent hover:bg-gray-800 dark:hover:bg-white"
                          onAction={followSuggestion}
                          actionDone="Following"
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Topics to follow */}
                {unfollowedTopics.length > 0 && (
                  <section className={suggestions.length > 0 ? 'border-t border-medium-border dark:border-gray-700 pt-8' : ''}>
                    <h3 className="font-semibold text-medium-black dark:text-gray-200 mb-4">Topics to follow</h3>
                    <div className="flex flex-wrap gap-2">
                      {unfollowedTopics.map(topic => (
                        <TopicFollowPill
                          key={topic}
                          topic={topic}
                          onFollow={followTopic}
                          alreadyFollowed={followedTopics.map(t => t.toLowerCase()).includes(topic.toLowerCase())}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {suggestions.length === 0 && unfollowedTopics.length === 0 && (
                  <div className="text-center py-16 text-medium-gray dark:text-gray-500 text-sm">
                    No suggestions available right now.
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

function TopicRow({ topic, onUnfollow }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handle() {
    setLoading(true);
    await onUnfollow(topic);
    setDone(true);
    setLoading(false);
  }

  if (done) return null;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
        <FiBookOpen className="text-medium-gray dark:text-gray-400" size={16} />
      </div>
      <div className="flex-1">
        <p className="font-medium text-medium-black dark:text-gray-200 text-sm">{topic}</p>
      </div>
      <button
        onClick={handle}
        disabled={loading}
        className="flex-shrink-0 px-4 py-1.5 rounded-full border border-medium-border dark:border-gray-600 text-sm text-medium-black dark:text-gray-200 hover:border-red-400 hover:text-red-500 dark:hover:border-red-400 dark:hover:text-red-400 transition"
      >
        {loading ? '...' : 'Following'}
      </button>
    </div>
  );
}

function TopicFollowPill({ topic, onFollow, alreadyFollowed }) {
  const [following, setFollowing] = useState(alreadyFollowed);
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (following) return;
    setLoading(true);
    await onFollow(topic);
    setFollowing(true);
    setLoading(false);
  }

  return (
    <button
      onClick={handle}
      disabled={loading || following}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
        following
          ? 'bg-medium-black dark:bg-gray-200 text-white dark:text-gray-900 border-medium-black dark:border-gray-200'
          : 'border-medium-border dark:border-gray-600 text-medium-black dark:text-gray-200 hover:border-medium-black dark:hover:border-gray-400'
      }`}
    >
      {following ? '✓ Following' : loading ? '...' : topic}
    </button>
  );
}

function HistoryItem({ post }) {
  return (
    <div className="flex gap-4 py-5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <img
            src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'U')}&background=random&size=20`}
            className="w-5 h-5 rounded-full object-cover"
            alt={post.author?.name}
          />
          <span className="text-xs text-medium-gray dark:text-gray-400">{post.author?.name}</span>
        </div>
        <Link to={`/article/${post.slug}`}>
          <h3 className="font-bold text-medium-black dark:text-gray-100 text-base leading-snug hover:underline line-clamp-2">
            {post.title}
          </h3>
        </Link>
        {post.excerpt && (
          <p className="text-sm text-medium-gray dark:text-gray-400 mt-1 line-clamp-2">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-1 mt-2 text-xs text-medium-gray dark:text-gray-500">
          <FiClock size={11} />
          <span>{post.readTime || 1} min read</span>
          {post.readAt && (
            <span className="ml-2">
              · {new Date(post.readAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
      </div>
      {post.coverImage && (
        <Link to={`/article/${post.slug}`} className="flex-shrink-0 self-start">
          <div className="w-20 h-14 rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          </div>
        </Link>
      )}
    </div>
  );
}

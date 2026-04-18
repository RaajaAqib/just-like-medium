import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SidebarLayout from '../components/SidebarLayout';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import {
  FiBookOpen, FiClock, FiChevronDown,
  FiVolumeX, FiUserMinus,
} from 'react-icons/fi';

const TABS = ['Following', 'Reading history', 'Muted', 'Suggestions'];

/* ─── Small reusable components ─── */

function Avatar({ u, size = 'w-10 h-10' }) {
  return (
    <img
      src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=random`}
      className={`${size} rounded-full object-cover flex-shrink-0`}
      alt={u.name}
    />
  );
}

/* Writer row with "Following ▾" dropdown (unfollow) — matches Medium */
function WriterFollowingRow({ user, onUnfollow }) {
  const [open, setOpen] = useState(false);
  const [gone, setGone] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  if (gone) return null;

  async function handleUnfollow() {
    setOpen(false);
    try {
      await api.post(`/users/${user._id}/follow`);
      setGone(true);
      toast.success(`Unfollowed ${user.name}`);
    } catch { toast.error('Failed to unfollow'); }
  }

  return (
    <div className="flex items-center gap-3 py-4 border-b border-medium-border dark:border-gray-700">
      <Link to={`/profile/${user._id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar u={user} />
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="font-medium text-medium-black dark:text-gray-100 text-sm truncate">{user.name}</p>
            {user.isVerified && (
              <svg className="w-3.5 h-3.5 text-medium-green flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          {user.bio && <p className="text-xs text-medium-gray dark:text-gray-500 truncate mt-0.5">{user.bio}</p>}
          <p className="text-xs text-medium-gray dark:text-gray-500 mt-0.5">{user.followers?.length || 0} Followers</p>
        </div>
      </Link>

      <div className="relative flex-shrink-0" ref={ref}>
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-medium-border dark:border-gray-600 text-sm text-medium-black dark:text-gray-200 hover:border-medium-black dark:hover:border-gray-400 transition"
        >
          Following <FiChevronDown size={13} />
        </button>

        {open && (
          <div className="absolute right-0 top-9 w-48 bg-white dark:bg-gray-800 border border-medium-border dark:border-gray-600 rounded-lg shadow-xl py-1 z-20">
            <button
              onClick={handleUnfollow}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-medium-black dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
            >
              <FiUserMinus size={14} />
              Unfollow {user.name}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* Topic row with "Following" toggle */
function TopicFollowingRow({ topic, onUnfollow }) {
  const [gone, setGone] = useState(false);

  if (gone) return null;

  async function handle() {
    try {
      await api.post('/users/topics/follow', { topic });
      setGone(true);
      toast.success(`Unfollowed ${topic}`);
    } catch { toast.error('Failed'); }
  }

  return (
    <div className="flex items-center gap-3 py-4 border-b border-medium-border dark:border-gray-700">
      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
        <FiBookOpen className="text-medium-gray dark:text-gray-400" size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-medium-black dark:text-gray-100 text-sm">{topic}</p>
      </div>
      <button
        onClick={handle}
        className="flex-shrink-0 px-4 py-1.5 rounded-full border border-medium-border dark:border-gray-600 text-sm text-medium-black dark:text-gray-200 hover:border-red-400 hover:text-red-500 dark:hover:border-red-400 dark:hover:text-red-400 transition"
      >
        Following
      </button>
    </div>
  );
}

/* Suggestion writer row with Follow button */
function SuggestionWriterRow({ user }) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleFollow() {
    if (following) return;
    setLoading(true);
    try {
      await api.post(`/users/${user._id}/follow`);
      setFollowing(true);
      toast.success(`Following ${user.name}`);
    } catch { toast.error('Failed to follow'); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex items-center gap-3 py-4 border-b border-medium-border dark:border-gray-700">
      <Link to={`/profile/${user._id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar u={user} />
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="font-medium text-medium-black dark:text-gray-100 text-sm truncate">{user.name}</p>
            {user.isVerified && (
              <svg className="w-3.5 h-3.5 text-medium-green flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          {user.bio && <p className="text-xs text-medium-gray dark:text-gray-500 truncate mt-0.5">{user.bio}</p>}
          <p className="text-xs text-medium-gray dark:text-gray-500 mt-0.5">{user.followers?.length || 0} Followers</p>
        </div>
      </Link>
      <button
        onClick={handleFollow}
        disabled={loading || following}
        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition border ${
          following
            ? 'border-medium-border dark:border-gray-600 text-medium-gray dark:text-gray-400'
            : 'bg-medium-black dark:bg-gray-100 text-white dark:text-gray-900 border-medium-black dark:border-gray-100 hover:opacity-90'
        }`}
      >
        {following ? 'Following' : loading ? '...' : 'Follow'}
      </button>
    </div>
  );
}

/* Muted writer row with Unmute */
function MutedWriterRow({ user, onUnmute }) {
  const [gone, setGone] = useState(false);

  if (gone) return null;

  async function handleUnmute() {
    try {
      await api.post(`/users/${user._id}/mute`);
      setGone(true);
      toast.success(`${user.name} unmuted`);
    } catch { toast.error('Failed to unmute'); }
  }

  return (
    <div className="flex items-center gap-3 py-4 border-b border-medium-border dark:border-gray-700">
      <Link to={`/profile/${user._id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar u={user} />
        <div className="min-w-0">
          <p className="font-medium text-medium-black dark:text-gray-100 text-sm truncate">{user.name}</p>
          {user.bio && <p className="text-xs text-medium-gray dark:text-gray-500 truncate mt-0.5">{user.bio}</p>}
        </div>
      </Link>
      <button
        onClick={handleUnmute}
        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-medium-border dark:border-gray-600 text-sm text-medium-black dark:text-gray-200 hover:border-green-400 hover:text-green-500 dark:hover:text-green-400 transition"
      >
        <FiVolumeX size={13} /> Unmute
      </button>
    </div>
  );
}

/* Topic pill for Suggestions */
function TopicPill({ topic, alreadyFollowed }) {
  const [following, setFollowing] = useState(alreadyFollowed);
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (following) return;
    setLoading(true);
    try {
      await api.post('/users/topics/follow', { topic });
      setFollowing(true);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  }

  return (
    <button
      onClick={handle}
      disabled={loading || following}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
        following
          ? 'bg-medium-black dark:bg-gray-100 text-white dark:text-gray-900 border-medium-black dark:border-gray-100'
          : 'border-medium-border dark:border-gray-600 text-medium-black dark:text-gray-200 hover:border-medium-black dark:hover:border-gray-400 bg-white dark:bg-transparent'
      }`}
    >
      {following ? `✓ ${topic}` : loading ? '...' : topic}
    </button>
  );
}

/* History article item */
function HistoryItem({ post }) {
  return (
    <div className="flex gap-4 py-5 border-b border-medium-border dark:border-gray-700">
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

/* ─── Main page ─── */
export default function FollowingPage() {
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

  useEffect(() => { fetchFollowingData(); }, []);

  useEffect(() => {
    if (activeTab === 'Reading history' && !historyFetched) fetchHistory();
    if (activeTab === 'Suggestions' && !suggestionsFetched) fetchSuggestions();
  }, [activeTab]);

  async function fetchFollowingData() {
    try {
      setDataLoading(true);
      const { data } = await api.get('/users/me/following-data');
      setFollowing(data.following || []);
      setFollowedTopics(data.followedTopics || []);
      setMutedUsers(data.mutedUsers || []);
    } catch { toast.error('Failed to load following data'); }
    finally { setDataLoading(false); }
  }

  async function fetchHistory() {
    try {
      setHistoryLoading(true);
      const { data } = await api.get('/users/me/history');
      setHistory(data.history || []);
      setHistoryFetched(true);
    } catch { }
    finally { setHistoryLoading(false); }
  }

  async function fetchSuggestions() {
    try {
      setSuggestionsLoading(true);
      const [suggestRes, topicsRes] = await Promise.allSettled([
        api.get('/users/suggestions'),
        api.get('/topics'),
      ]);
      if (suggestRes.status === 'fulfilled') setSuggestions(suggestRes.value.data.suggestions || []);
      if (topicsRes.status === 'fulfilled') setAllTopics(topicsRes.value.data.topics || []);
      setSuggestionsFetched(true);
    } catch { }
    finally { setSuggestionsLoading(false); }
  }

  async function clearHistory() {
    if (!confirm('Clear your entire reading history? This cannot be undone.')) return;
    try {
      await api.delete('/users/me/history');
      setHistory([]);
      toast.success('Reading history cleared');
    } catch { toast.error('Failed to clear history'); }
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
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
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
          dataLoading ? (
            <div className="text-center py-12 text-medium-gray dark:text-gray-400 text-sm">Loading…</div>
          ) : (
            <div>
              {/* Writers */}
              <section className="mb-8">
                <p className="text-sm text-medium-gray dark:text-gray-500 mb-2">
                  {following.length} writer{following.length !== 1 ? 's' : ''}
                </p>
                {following.length === 0 ? (
                  <div className="py-6 text-sm text-medium-gray dark:text-gray-500">
                    You're not following any writers yet.{' '}
                    <button onClick={() => setActiveTab('Suggestions')} className="underline text-medium-black dark:text-gray-300">
                      See suggestions
                    </button>
                  </div>
                ) : (
                  following.map(u => <WriterFollowingRow key={u._id} user={u} />)
                )}
              </section>

              {/* Topics */}
              <section>
                <p className="text-sm text-medium-gray dark:text-gray-500 mb-2">
                  {followedTopics.length} topic{followedTopics.length !== 1 ? 's' : ''}
                </p>
                {followedTopics.length === 0 ? (
                  <div className="py-6 text-sm text-medium-gray dark:text-gray-500">
                    You're not following any topics.{' '}
                    <button onClick={() => setActiveTab('Suggestions')} className="underline text-medium-black dark:text-gray-300">
                      Discover topics
                    </button>
                  </div>
                ) : (
                  followedTopics.map(t => <TopicFollowingRow key={t} topic={t} />)
                )}
              </section>
            </div>
          )
        )}

        {/* ─── READING HISTORY TAB ─── */}
        {activeTab === 'Reading history' && (
          historyLoading ? (
            <div className="text-center py-12 text-medium-gray dark:text-gray-400 text-sm">Loading…</div>
          ) : (
            <div>
              {history.length > 0 && (
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-medium-gray dark:text-gray-400">
                    You can clear your reading history for a fresh start.
                  </p>
                  <button
                    onClick={clearHistory}
                    className="flex-shrink-0 ml-4 text-sm font-medium text-medium-black dark:text-gray-200 underline underline-offset-2 hover:opacity-70 transition"
                  >
                    Clear history
                  </button>
                </div>
              )}
              {history.length === 0 ? (
                <div className="text-center py-16">
                  <p className="font-medium text-medium-black dark:text-gray-200 mb-1">No reading history</p>
                  <p className="text-medium-gray dark:text-gray-400 text-sm">Articles you read will appear here.</p>
                </div>
              ) : (
                history.map(post => <HistoryItem key={post._id || post.slug} post={post} />)
              )}
            </div>
          )
        )}

        {/* ─── MUTED TAB ─── */}
        {activeTab === 'Muted' && (
          dataLoading ? (
            <div className="text-center py-12 text-medium-gray dark:text-gray-400 text-sm">Loading…</div>
          ) : mutedUsers.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-medium text-medium-black dark:text-gray-200 mb-1">You haven't muted anything</p>
              <p className="text-medium-gray dark:text-gray-400 text-sm">
                Writers and topics you've muted will appear here.
              </p>
            </div>
          ) : (
            <div>
              {mutedUsers.map(u => <MutedWriterRow key={u._id} user={u} />)}
            </div>
          )
        )}

        {/* ─── SUGGESTIONS TAB ─── */}
        {activeTab === 'Suggestions' && (
          suggestionsLoading ? (
            <div className="text-center py-12 text-medium-gray dark:text-gray-400 text-sm">Loading…</div>
          ) : (
            <div>
              {/* Writers to follow */}
              {suggestions.length > 0 && (
                <section className="mb-10">
                  <h3 className="font-semibold text-medium-black dark:text-gray-200 text-base mb-1">
                    Writers to follow
                  </h3>
                  <p className="text-xs text-medium-gray dark:text-gray-500 mb-4">
                    People you might be interested in based on what you read.
                  </p>
                  {suggestions.map(u => <SuggestionWriterRow key={u._id} user={u} />)}
                </section>
              )}

              {/* Topics to follow */}
              {unfollowedTopics.length > 0 && (
                <section className={suggestions.length > 0 ? 'border-t border-medium-border dark:border-gray-700 pt-8' : ''}>
                  <h3 className="font-semibold text-medium-black dark:text-gray-200 text-base mb-1">
                    Topics to follow
                  </h3>
                  <p className="text-xs text-medium-gray dark:text-gray-500 mb-4">
                    Follow topics to see more relevant stories in your feed.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {unfollowedTopics.map(t => (
                      <TopicPill
                        key={t}
                        topic={t}
                        alreadyFollowed={followedTopics.map(ft => ft.toLowerCase()).includes(t.toLowerCase())}
                      />
                    ))}
                  </div>
                </section>
              )}

              {suggestions.length === 0 && unfollowedTopics.length === 0 && (
                <div className="text-center py-16 text-medium-gray dark:text-gray-500 text-sm">
                  No suggestions right now. Check back later.
                </div>
              )}
            </div>
          )
        )}
      </div>
    </SidebarLayout>
  );
}

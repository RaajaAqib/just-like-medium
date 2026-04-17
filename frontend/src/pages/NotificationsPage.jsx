import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  FiHeart, FiMessageCircle, FiZap, FiUserPlus, FiShield,
} from 'react-icons/fi';
import SidebarLayout from '../components/SidebarLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/axios';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'responses', label: 'Responses' },
];

function NotifIcon({ type }) {
  if (type === 'like')       return <FiHeart        className="text-red-500 text-base" />;
  if (type === 'comment')    return <FiMessageCircle className="text-medium-green text-base" />;
  if (type === 'clap')       return <FiZap           className="text-yellow-500 text-base" />;
  if (type === 'follow')     return <FiUserPlus      className="text-blue-500 text-base" />;
  if (type === 'moderation') return <FiShield        className="text-orange-500 text-base" />;
  return null;
}

function notifText(n) {
  const name = <span className="font-semibold text-medium-black dark:text-gray-100">{n.fromUser?.name || 'Someone'}</span>;
  const title = n.postTitle
    ? <span className="font-semibold text-medium-black dark:text-gray-100">"{n.postTitle}"</span>
    : null;

  if (n.type === 'like')    return <>{name} liked your story {title}</>;
  if (n.type === 'clap')    return <>{name} clapped for {title}</>;
  if (n.type === 'comment') return <>{name} responded to your story {title}</>;
  if (n.type === 'follow')  return <>{name} started following you</>;
  if (n.type === 'moderation') {
    const a = n.moderationAction;
    if (a === 'warn')            return <span className="font-medium text-yellow-700 dark:text-yellow-400">Your comment received a warning</span>;
    if (a === 'suspend')         return <span className="font-medium text-orange-700 dark:text-orange-400">Your account has been temporarily suspended</span>;
    if (a === 'ban')             return <span className="font-medium text-red-700 dark:text-red-400">Your account has been banned</span>;
    if (a === 'delete')          return <span className="font-medium text-gray-700 dark:text-gray-300">Your comment was removed by a moderator</span>;
    if (a === 'appeal_approved') return <span className="font-medium text-green-700 dark:text-green-400">Your appeal was approved — restriction lifted</span>;
    if (a === 'appeal_rejected') return <span className="font-medium text-red-700 dark:text-red-400">Your appeal was reviewed and rejected</span>;
    return <span>A moderation action was taken on your account</span>;
  }
  return null;
}

function notifLink(n) {
  if (n.type === 'follow') return `/profile/${n.fromUser?._id}`;
  if (n.type === 'moderation') return n.postSlug ? `/article/${n.postSlug}` : '/appeals';
  return n.postSlug ? `/article/${n.postSlug}` : '#';
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState('all');

  useEffect(() => {
    api.get('/notifications')
      .then(r => setNotifications(r.data.notifications || []))
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  }, []);

  // Mark all read silently when page opens
  useEffect(() => {
    api.put('/notifications/read-all').catch(() => {});
  }, []);

  // "Responses" tab = comments only
  const visible = activeTab === 'responses'
    ? notifications.filter(n => n.type === 'comment')
    : notifications;

  return (
    <SidebarLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 flex gap-12">

        {/* ── Main column ── */}
        <div className="flex-1 min-w-0 max-w-2xl">
          <h1 className="text-3xl font-bold text-medium-black dark:text-gray-100 mb-6">
            Notifications
          </h1>

          {/* Tabs */}
          <div className="flex gap-0 mb-6 border-b border-medium-border dark:border-gray-700">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-5 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                  activeTab === t.key
                    ? 'border-medium-black dark:border-gray-200 text-medium-black dark:text-gray-100'
                    : 'border-transparent text-medium-gray dark:text-gray-500 hover:text-medium-black dark:hover:text-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? <LoadingSpinner /> : visible.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-medium-gray dark:text-gray-400 text-base">You're all caught up.</p>
            </div>
          ) : (
            <div className="divide-y divide-medium-border dark:divide-gray-700">
              {visible.map(n => (
                <Link
                  key={n._id}
                  to={notifLink(n)}
                  className={`flex items-start gap-4 py-4 px-2 rounded-lg transition hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
                    !n.read ? 'bg-green-50/40 dark:bg-green-900/10' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        n.fromUser?.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(n.fromUser?.name || 'U')}&background=random&size=40`
                      }
                      alt={n.fromUser?.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {/* Type icon badge */}
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow">
                      <NotifIcon type={n.type} />
                    </span>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-medium-black dark:text-gray-200 leading-snug">
                      {notifText(n)}
                    </p>
                    <p className="text-xs text-medium-gray dark:text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-medium-green flex-shrink-0 mt-1.5" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-8">

            {/* Who to follow — people from recent follow notifications */}
            {notifications.filter(n => n.type === 'follow').length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-medium-black dark:text-gray-200 mb-4">Recent followers</h3>
                <div className="space-y-3">
                  {notifications.filter(n => n.type === 'follow').slice(0, 4).map(n => (
                    <Link key={n._id} to={`/profile/${n.fromUser?._id}`}
                      className="flex items-center gap-3 group">
                      <img
                        src={n.fromUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(n.fromUser?.name || 'U')}&background=random&size=36`}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        alt={n.fromUser?.name}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-medium-black dark:text-gray-200 group-hover:underline truncate">
                          {n.fromUser?.name}
                        </p>
                        <p className="text-xs text-medium-gray dark:text-gray-500">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Writing CTA */}
            <div className="border-t border-medium-border dark:border-gray-700 pt-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5">
                <h3 className="font-semibold text-medium-black dark:text-gray-100 mb-2 text-sm">
                  Writing on Just Like Medium
                </h3>
                <ul className="space-y-1.5 mb-4 text-sm text-medium-black dark:text-gray-300">
                  <li className="hover:underline cursor-pointer">New writer FAQ</li>
                  <li className="hover:underline cursor-pointer">Expert writing advice</li>
                  <li className="hover:underline cursor-pointer">Grow your readership</li>
                </ul>
                <Link to="/write" className="btn-black text-sm px-5 py-2 inline-block">
                  Start writing
                </Link>
              </div>
            </div>

          </div>
        </aside>

      </div>
    </SidebarLayout>
  );
}

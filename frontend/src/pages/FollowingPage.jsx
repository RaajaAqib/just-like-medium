import { useAuth } from '../context/AuthContext';
import SidebarLayout from '../components/SidebarLayout';
import { Link } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';

const SUGGESTED_TOPICS = ['Technology', 'Programming', 'Design', 'Science', 'AI', 'Startup', 'Health', 'Travel'];

export default function FollowingPage() {
  const { user } = useAuth();
  const following = user?.following || [];

  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="text-4xl font-bold font-serif text-medium-black dark:text-gray-100 mb-8">Following</h1>

        <div className="flex gap-4 mb-8 flex-wrap">
          {['Writers and publications', 'Topics'].map((t, i) => (
            <button key={t}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${i === 1 ? 'border-medium-black dark:border-gray-300 text-medium-black dark:text-gray-200 bg-white dark:bg-transparent' : 'border-medium-border dark:border-gray-600 text-medium-gray dark:text-gray-400 hover:border-medium-black dark:hover:border-gray-300'}`}>
              {t}
            </button>
          ))}
          <button className="p-2 rounded-full border border-medium-border dark:border-gray-600 text-medium-gray dark:text-gray-400 hover:border-medium-black dark:hover:border-gray-300 transition">
            <FiPlus />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {SUGGESTED_TOPICS.slice(0, 3).map(t => (
            <Link key={t} to={`/?tag=${t.toLowerCase()}`}
              className="px-4 py-2 rounded-full border-2 border-medium-black dark:border-gray-400 text-medium-black dark:text-gray-200 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              {t}
            </Link>
          ))}
        </div>

        {following.length === 0 ? (
          <div className="text-center py-20 border-t border-medium-border dark:border-gray-700">
            <p className="text-medium-gray dark:text-gray-400 text-base mb-2">You're not following anyone yet.</p>
            <p className="text-medium-gray dark:text-gray-500 text-sm mb-6">Follow writers to see their latest stories here.</p>
            <Link to="/" className="btn-black px-6 py-2 text-sm">Discover writers</Link>
          </div>
        ) : (
          <div className="space-y-4 border-t border-medium-border dark:border-gray-700 pt-6">
            {following.map(f => (
              <Link key={f._id || f} to={`/profile/${f._id || f}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <img src={f.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name||'U')}&background=random`}
                  className="w-10 h-10 rounded-full object-cover" alt={f.name}/>
                <div>
                  <p className="font-medium text-medium-black dark:text-gray-200 text-sm">{f.name || 'Writer'}</p>
                  <p className="text-xs text-medium-gray dark:text-gray-500">Following</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 border-t border-medium-border dark:border-gray-700 pt-8">
          <h3 className="font-semibold text-medium-black dark:text-gray-200 mb-4">Recommended topics</h3>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TOPICS.map(t => (
              <Link key={t} to={`/?tag=${t.toLowerCase()}`}
                className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-medium-black dark:text-gray-300 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                {t}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

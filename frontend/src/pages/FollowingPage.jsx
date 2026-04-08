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
        <h1 className="text-4xl font-bold font-serif text-medium-black mb-8">Following</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {['Writers and publications', 'Topics'].map((t, i) => (
            <button key={t}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${i === 1 ? 'border-medium-black text-medium-black bg-white' : 'border-medium-border text-medium-gray hover:border-medium-black'}`}>
              {t}
            </button>
          ))}
          <button className="p-2 rounded-full border border-medium-border text-medium-gray hover:border-medium-black transition">
            <FiPlus />
          </button>
        </div>

        {/* Followed topics */}
        <div className="flex flex-wrap gap-2 mb-8">
          {SUGGESTED_TOPICS.slice(0, 3).map(t => (
            <Link key={t} to={`/?tag=${t.toLowerCase()}`}
              className="px-4 py-2 rounded-full border-2 border-medium-black text-medium-black text-sm font-medium hover:bg-gray-100 transition">
              {t}
            </Link>
          ))}
        </div>

        {/* Posts from following */}
        {following.length === 0 ? (
          <div className="text-center py-20 border-t border-medium-border">
            <p className="text-medium-gray text-base mb-2">You're not following anyone yet.</p>
            <p className="text-medium-gray text-sm mb-6">Follow writers to see their latest stories here.</p>
            <Link to="/" className="btn-black px-6 py-2 text-sm">Discover writers</Link>
          </div>
        ) : (
          <div className="space-y-4 border-t border-medium-border pt-6">
            {following.map(f => (
              <Link key={f._id || f} to={`/profile/${f._id || f}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                <img
                  src={f.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name||'U')}&background=random`}
                  className="w-10 h-10 rounded-full object-cover" alt={f.name}/>
                <div>
                  <p className="font-medium text-medium-black text-sm">{f.name || 'Writer'}</p>
                  <p className="text-xs text-medium-gray">Following</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Suggested topics */}
        <div className="mt-12 border-t border-medium-border pt-8">
          <h3 className="font-semibold text-medium-black mb-4">Recommended topics</h3>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TOPICS.map(t => (
              <Link key={t} to={`/?tag=${t.toLowerCase()}`}
                className="px-4 py-2 rounded-full bg-gray-100 text-medium-black text-sm hover:bg-gray-200 transition">
                {t}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

import SidebarLayout from '../components/SidebarLayout';
import { FiBookmark } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function Library() {
  const tabs = ['Your lists', 'Saved lists', 'Highlights', 'Reading history', 'Responses'];
  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold font-serif text-medium-black">Your library</h1>
          <button className="btn-green text-sm px-5 py-2">New list</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-medium-border mb-8">
          {tabs.map((t, i) => (
            <button key={t}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition ${i === 0 ? 'border-medium-black text-medium-black' : 'border-transparent text-medium-gray hover:text-medium-black'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Promo card */}
        <div className="bg-medium-green rounded-xl p-6 flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-bold text-lg mb-2">Create a list to easily organize and share stories</h3>
            <button className="bg-medium-black text-white text-sm px-5 py-2 rounded-full hover:bg-gray-800 transition">
              Start a list
            </button>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <FiBookmark className="text-white text-2xl" />
          </div>
        </div>

        {/* Reading list card */}
        <div className="border border-medium-border rounded-lg flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <FiBookmark className="text-medium-gray" />
            </div>
            <div>
              <p className="font-bold text-medium-black">Reading list</p>
              <p className="text-sm text-medium-gray">No stories saved yet</p>
            </div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-16 h-12 bg-gray-100 rounded" />
            ))}
          </div>
        </div>

        <div className="text-center py-16 text-medium-gray">
          <p className="text-sm">Save articles to read them later from any device.</p>
          <Link to="/" className="text-medium-green hover:underline text-sm mt-2 block">Browse stories</Link>
        </div>
      </div>
    </SidebarLayout>
  );
}

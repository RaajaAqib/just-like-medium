import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import rajaPhoto from '../../Images/me22-12-2025.png';
import rajaAvatar from '../../Images/profile photo photo (1) 1.png';

export default function OurStory() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />

      <div className="bg-cream dark:bg-gray-800 border-b border-medium-border dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl md:text-7xl font-bold font-serif text-medium-black dark:text-gray-100 mb-6 leading-tight">
            Everyone has a<br />story to tell
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-16 space-y-8 text-lg leading-relaxed text-medium-black dark:text-gray-300">
        <p>
          Dynamic Lab is a home for human stories and ideas. Here, anyone can share knowledge
          and wisdom with the world — without having to build a mailing list or a following first.
        </p>
        <p>
          The internet is noisy and chaotic. Dynamic Lab is quiet yet full of insight. It's simple,
          beautiful, collaborative, and helps you find the right readers for whatever you have to say.
        </p>
        <blockquote className="border-l-4 border-medium-black dark:border-gray-500 pl-6 py-1 italic text-2xl font-serif dark:text-gray-200">
          Ultimately, our goal is to deepen our collective understanding of the world through the power of writing.
        </blockquote>
        <p>
          We believe that what you read and write matters. Words can divide or empower us, inspire
          or discourage us. In a world where the most sensational and surface-level stories often win,
          we're building a system that rewards depth, nuance, and time well spent.
        </p>
        <p>
          A space for thoughtful conversation more than drive-by takes, and substance over packaging.
        </p>

        {/* About the builder */}
        <div className="pt-8 border-t border-medium-border dark:border-gray-700">
          <h2 className="text-2xl font-bold font-serif text-medium-black dark:text-gray-100 mb-6">
            About the builder
          </h2>

          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
            {/* Left — text */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <img src={rajaAvatar} alt="Raja Aqib" className="w-12 h-12 rounded-full object-cover shadow" />
                <div>
                  <p className="font-semibold text-medium-black dark:text-gray-100">Raja Aqib</p>
                  <p className="text-sm text-medium-gray dark:text-gray-400">Software Engineer &amp; ServiceNow Developer</p>
                </div>
              </div>
              <p>
                Hi, I'm <strong className="text-medium-black dark:text-gray-100">Raja Aqib</strong> — a Software Engineer
                and ServiceNow Developer. I built Dynamic Lab as a full-stack project to create a
                modern, clean writing platform inspired by Medium.
              </p>
              <p>Here's what I built into this platform:</p>
              <ul className="space-y-2 text-base">
                {[
                  'Full authentication — register, login, JWT-based sessions',
                  'Rich text editor with formatting, images, links, and embeds',
                  'Article publishing with cover photos, tags, and draft mode',
                  'Reading list (save articles for later) and reading history',
                  'Follow system — follow writers, get a personalised Following feed',
                  'Comments with nested replies, likes, and moderation',
                  'Likes and claps on articles',
                  'Author profiles with follower counts and published stories',
                  'Notifications for follows, likes, claps, and comments',
                  'Admin dashboard — manage users, articles, comments, tags, reports, and appeals',
                  'Content moderation — warn, suspend, or ban users; report and appeal system',
                  'Dark mode with system preference detection and manual toggle',
                  'Fully responsive design for mobile, tablet, and desktop',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-medium-green mt-1.5 text-sm flex-shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — full photo */}
            <div className="w-full md:w-72 flex-shrink-0">
              <img
                src={rajaPhoto}
                alt="Raja Aqib"
                className="w-full object-contain"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-medium-border dark:border-gray-700">
          <p className="text-medium-gray dark:text-gray-400 text-base mb-6">
            Join millions of curious readers and fearless writers on Dynamic Lab.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link to="/register" className="btn-black px-8 py-3">Start writing</Link>
            <Link to="/" className="btn-black-outline px-8 py-3">Start reading</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

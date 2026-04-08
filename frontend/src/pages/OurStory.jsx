import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function OurStory() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <div className="bg-cream border-b border-medium-border">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl md:text-7xl font-bold font-serif text-medium-black mb-6 leading-tight">
            Everyone has a<br />story to tell
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-16 space-y-8 text-lg leading-relaxed text-medium-black">
        <p>
          Just Like Medium is a home for human stories and ideas. Here, anyone can share knowledge
          and wisdom with the world — without having to build a mailing list or a following first.
        </p>
        <p>
          The internet is noisy and chaotic. Just Like Medium is quiet yet full of insight. It's simple,
          beautiful, collaborative, and helps you find the right readers for whatever you have to say.
        </p>
        <blockquote className="border-l-4 border-medium-black pl-6 py-1 italic text-2xl font-serif">
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

        <div className="pt-6 border-t border-medium-border">
          <p className="text-medium-gray text-base mb-6">
            Join millions of curious readers and fearless writers on Just Like Medium.
          </p>
          <div className="flex gap-4">
            <Link to="/register" className="btn-black px-8 py-3">
              Start writing
            </Link>
            <Link to="/" className="btn-black-outline px-8 py-3">
              Start reading
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * UserBadges — renders admin and/or verified badges next to a username.
 *
 * Usage:
 *   <UserBadges user={author} />
 *   <UserBadges user={author} size="sm" />
 */

import { FiShield } from 'react-icons/fi';

// Blue checkmark SVG (Twitter/X style)
function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={0} />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.491 4.491 0 01-3.497-1.307 4.491 4.491 0 01-1.307-3.497A4.49 4.49 0 012.25 12a4.49 4.49 0 011.549-3.397 4.491 4.491 0 011.307-3.497 4.491 4.491 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L8.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
      />
    </svg>
  );
}

export default function UserBadges({ user, size = 'md' }) {
  if (!user) return null;

  const iconSize = size === 'sm'
    ? 'w-3 h-3'
    : size === 'lg'
    ? 'w-4.5 h-4.5'
    : 'w-3.5 h-3.5';

  return (
    <>
      {user.isVerified && (
        <span
          title="Verified"
          className="inline-flex items-center flex-shrink-0"
        >
          <CheckIcon className={`${iconSize} text-blue-500`} />
        </span>
      )}
      {user.isAdmin && (
        <span
          title="Admin"
          className="inline-flex items-center flex-shrink-0"
        >
          <FiShield className={`${iconSize} text-medium-gray dark:text-gray-400`} />
        </span>
      )}
    </>
  );
}

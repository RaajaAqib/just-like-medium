/**
 * UserBadges — renders admin and/or verified badges next to a username.
 *
 * Usage:
 *   <UserBadges user={author} />
 *   <UserBadges user={author} size="sm" />
 */

// ── Verified badge: solid blue circle + white checkmark (Twitter/X style) ─────
function VerifiedIcon({ sz }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      {/* Blue filled circle */}
      <circle cx="11" cy="11" r="11" fill="#1D9BF0" />
      {/* White checkmark */}
      <path
        d="M6.5 11.5L9.5 14.5L15.5 8"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Admin badge: gold shield with white "A" ───────────────────────────────────
function AdminIcon({ sz }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      {/* Gold shield shape */}
      <path
        d="M11 2L3.5 5.5V10.5C3.5 14.9 6.8 19 11 20C15.2 19 18.5 14.9 18.5 10.5V5.5L11 2Z"
        fill="#F59E0B"
        stroke="#D97706"
        strokeWidth="0.8"
      />
      {/* White "A" letter */}
      <text
        x="11"
        y="15"
        textAnchor="middle"
        fill="white"
        fontSize="9"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        A
      </text>
    </svg>
  );
}

export default function UserBadges({ user, size = 'md' }) {
  if (!user) return null;

  const px = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  return (
    <>
      {user.isVerified && (
        <span title="Verified" className="inline-flex items-center flex-shrink-0">
          <VerifiedIcon sz={px} />
        </span>
      )}
      {user.isAdmin && (
        <span title="Admin" className="inline-flex items-center flex-shrink-0">
          <AdminIcon sz={px} />
        </span>
      )}
    </>
  );
}

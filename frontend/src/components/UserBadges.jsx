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
      {/* Gold shield — fills the full viewBox like the circle */}
      <path
        d="M11 1L2 5V11C2 15.97 5.98 20.57 11 22C16.02 20.57 20 15.97 20 11V5L11 1Z"
        fill="#F59E0B"
        stroke="#D97706"
        strokeWidth="0.5"
      />
      {/* White "A" letter */}
      <text
        x="11"
        y="15.5"
        textAnchor="middle"
        fill="white"
        fontSize="10"
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

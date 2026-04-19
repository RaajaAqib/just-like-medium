# Just Like Medium

A full-stack blogging platform inspired by [Medium.com](https://medium.com), built with React, Node.js, and MongoDB. Supports rich-text writing, image uploads, a full content moderation system, admin dashboard, custom lists, story submissions, scheduled publishing, appeals, notifications, developer profile, and much more.

**Live site:** [raajaaqib.github.io/just-like-medium](https://raajaaqib.github.io/just-like-medium)  
**Backend API:** [just-like-medium.onrender.com](https://just-like-medium.onrender.com)  
**GitHub:** [github.com/RaajaAqib/just-like-medium](https://github.com/RaajaAqib/just-like-medium)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Models](#data-models)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Tailwind Custom Colors](#tailwind-custom-colors)

---

## Features

### Authentication & Accounts
- **Register / Login** — Email + password authentication with JWT tokens stored in `localStorage`
- **Protected routes** — All write actions require authentication; admin routes require `isAdmin: true`
- **Optional auth** — Feed and article pages work for guests and logged-in users (following feed activates when logged in)
- **Change password** — Secure password update from profile settings
- **Account status banner** — Banned and suspended users see a persistent top banner with an appeal link

---

### Reader Experience
- **Landing page** — Hero section with trending stories and a sign-up CTA for guests
- **Home feed** — "For you" and "Following" tabs; tag filter strip; paginated posts (10 per page)
- **Article page** — Full rich-text rendering, view counter, estimated read time, cover image, author bio card
- **Search** — Search posts by title from the navbar (`?search=` query param)
- **Tag filtering** — Click any tag to filter the feed by topic
- **Dark mode** — Full dark/light toggle persisted to `localStorage`; every page, component, and modal fully themed

---

### Writer Experience
- **Rich text editor** — Tiptap-powered editor with headings (H1–H3), bold, italic, underline, links, images, bullet/ordered lists, blockquotes, code, and horizontal rules
- **Cover image upload** — Cloudinary image upload with drag-and-drop; cover image displayed in the center content column (not full-width)
- **In-editor image upload** — Insert images directly into the article body via Cloudinary
- **Draft / Publish toggle** — Authors can toggle publish state; non-admins submit for review instead of publishing directly
- **Story submission workflow** — Authors submit a draft for admin review; admin can set status to `pending → in-review → edits-requested / approved / declined`; each status change sends the author a notification with a link to the article or editor
- **Scheduled publishing** — Authors can set a future publish date/time; a server-side `setInterval` running every 60 seconds auto-publishes any post whose `scheduledAt` is in the past
- **Withdraw submission** — Authors can withdraw a pending or in-review submission at any time
- **Import a story** — Paste plain text into a modal to create a draft instantly
- **Edit stories** — Load drafts or published posts by ID; only the author (or admin) can access the edit page

---

### Social Features
- **Likes** — Toggle heart like on articles; notifies the author
- **Claps** — Medium-style clap counter (multi-clap per session supported)
- **Comments & Replies** — Add top-level comments or nested replies on any article; like comments; delete own comment; report a comment
- **Thread participant notifications** — When someone replies to a comment thread, **all previous participants** in that thread receive a notification (not just the direct parent author)
- **Follow / Unfollow** — Follow authors; their posts appear in the "Following" feed tab; follower/following counts on profiles
- **Report posts** — Report a story for admin review
- **Report users** — Report a user; reported users appear in the admin Reports → Users tab

---

### Save to Library / Lists

#### Reading List (built-in)
- Bookmark any article with the bookmark icon; toggles save/unsave
- The icon fills solid when the story is saved (optimistic UI via `SavedPostsContext`)
- Saved stories appear in Library → Saved lists tab

#### Custom Lists
- Create unlimited custom lists with a name, optional description, and public/private visibility
- Save any story to one or more custom lists via a dropdown (`SaveToListDropdown` component)
- The bookmark icon fills as soon as a story is in any list (context-aware)
- List pages show all stories in the list with their cover images

#### Saved Lists (from other users)
- Browse and save other users' public lists to your own library
- "Lists you've saved" section in Library → Your lists tab
- Unsave a list removes it from your library without affecting the original

---

### Library Page

Four tabs, all lazy-loaded on first visit:

| Tab | Content |
|-----|---------|
| **Your lists** | Reading list card + all your custom lists; create new list button |
| **Saved lists** | Other users' public lists you've saved; Unsave button |
| **Reading history** | Stories you've opened, sorted by read date |
| **Responses** | All comments you've written — each shows the story thumbnail, author, read time, your comment text, and a "View response" link that navigates to the article and scrolls/highlights your exact comment |

---

### Notifications

- **Bell icon** in the top navbar with a red unread-count badge (max `9+`)
- **Dedicated notifications page** — full list of all notifications
- **Notification types:**
  - `like` — someone liked your post
  - `comment` — someone commented on your post
  - `reply` — someone replied to your comment
  - `follow` — someone followed you
  - `submission` — admin changed the status of your submitted story (approved / declined / edits-requested / in-review)
  - `moderation` — admin warned, suspended, banned you, or approved/rejected your appeal
- **Scroll to comment** — clicking a comment/reply notification navigates to the article with `?comment=<id>`, which auto-opens the comment panel, expands reply threads if needed, smooth-scrolls to the comment, and flashes a highlight animation
- **Mark all as read** — single button clears all unread
- **Polling** — notifications refresh every 15 seconds; polling pauses automatically when the browser tab is hidden (Page Visibility API) to avoid wasted requests

---

### Author Profile Page
- Avatar, full name, bio, follower/following counts, social badges
- **Verified badge** (blue checkmark) — shown when `isVerified: true`
- **Admin badge** (gold shield) — shown when `isAdmin: true`
- Cover image displayed in the center content column (matching Medium's layout)
- Published stories list with cover thumbnails, read time, likes
- Activity tab showing the author's recent comments

---

### Following Page
- List of writers you follow with avatar, name, bio, follow/unfollow button
- **Verified and admin badges** rendered via `UserBadges` component (consistent across the whole app)
- Suggested writers section — users with the most followers you don't follow yet
- Suggested topics strip

---

### My Stories Page
- Lists all your drafts and published posts
- **Submission status badge** — shows `pending`, `in-review`, `edits-requested`, `approved`, `declined`, `withdrawn`
- Edit, delete, submit for review, withdraw submission, schedule publishing
- Admin note displayed when status is `edits-requested` or `declined`
- Import story from plain text modal

---

### Stats Page
- Per-story metrics: total views, likes, claps
- Horizontal bar chart visualization
- Audience tab: list of your followers with avatar and name

---

### Appeals System

Users can appeal any moderation action taken against them:

| Action | Description |
|--------|-------------|
| Warning | Appeal a warning issued by an admin |
| Account suspended | Appeal a temporary account suspension |
| Account banned | Appeal a permanent account ban |
| Comment deleted | Appeal removal of a comment |
| Story hidden | Appeal hiding of a story |
| Story deleted | Appeal deletion of a story |

- Submit with context (the content that was actioned) and a reason
- Each action type has a dynamic label/placeholder on the form
- Admin can approve (which reverses account-level actions: unsuspend, unban, remove last warning) or reject with a note
- Each decision sends a moderation notification to the user
- Duplicate pending appeals for the same action type are blocked

---

### Admin Dashboard

Accessible at `/admin` for users with `isAdmin: true`. Sidebar shows **live pending count badges** (refreshed every 15 seconds with visibility guard) for Reports, Appeals, and Submissions.

#### Overview
- Platform stats: total posts, published posts, drafts, posts published today, total users, total comments, total views/likes/claps
- Recent posts table (last 7)
- Top posts by views (top 5)
- Top tags bar chart (top 10)

#### Submissions
- All stories submitted for review (all statuses)
- Filter by status (pending, in-review, edits-requested, approved, declined, withdrawn)
- Change status with optional note via a modal; `approved` auto-publishes the post; `declined` unpublishes it
- Author is notified for every actionable status change

#### Articles
- All posts (published and drafts)
- Toggle featured / toggle publish
- Full moderation modal per story:
  - **Dismiss** — clears the report
  - **Hide** — sets `isHidden: true`, hides from feed without deleting
  - **Delete** — permanently removes the post
  - **Warn** — adds a warning to the author's record and notifies them
  - **Suspend** — sets `isSuspended: true` with a duration (1 / 3 / 7 / 14 / 30 days); notifies author
  - **Ban** — sets `banned: true` with a reason; notifies author

#### Users
- Full user table: avatar, name, email, join date, status badges (banned, suspended, verified, admin)
- Per-user actions: view profile, verify/unverify, make/remove admin, moderate (warn, suspend, ban, remove all restrictions)
- Delete user (removes all their posts too)

#### Comments
- All comments across the platform
- Toggle visibility, delete, or moderate the author (warn, suspend, ban)

#### Reports
Three sub-tabs:

- **Comments** — reported comments; moderation modal with dismiss, hide, delete, warn author, suspend author, ban author
- **Stories** — reported stories; same full moderation modal
- **Users** — users who have been reported; shows report count, last reported date, reasons; moderation modal

#### Appeals
- Pending/approved/rejected appeals
- Filter by status
- User info, the action being appealed, the content provided, and their reason
- Admin note displayed when `edits-requested` or `declined`
- Approve or reject with optional note; approval auto-reverses account-level actions

#### Analytics
- Platform-wide charts and trends

#### Tags
- All tags with usage count
- Delete a tag from all posts at once

#### Developer Profile
- Full CMS for the `/about-developer` page
- Sections: Profile Header, About Me, Experience, Education, Skills, Projects, Certifications, QR Code, Website Info, Support / Buy Me a Coffee
- Photo upload with Cloudinary (`crop: fill`, `gravity: face` for square output)
- Remove photo button properly deletes from Cloudinary and clears the URL
- Visibility toggle (hide page from public without deleting content)

---

### About Developer Page (`/about-developer`)

A personal portfolio page fully managed from the Admin Dashboard → Developer tab.

**Layout:** Two-column on desktop — center column for CV content, sticky right sidebar for supplementary widgets.

#### Center Column — CV Tabs

| Tab | Content |
|-----|---------|
| About Me | Full bio, mission statement (blockquote), years of experience, current role stats |
| Experience | Timeline with company, role, date range, description |
| Education | Degree, institution, year, grade |
| Skills | Grouped by Technical / Tools / Soft / Languages; colored badge pills |
| Projects | Card grid with name, description, tech stack tags, external link |
| Certifications | Organization, year, certification name |
| Contact | Email, phone, all social links with platform icons |

#### Right Sticky Sidebar (desktop only; stacks below tabs on mobile)
- **Connect** — QR code with label and purpose text
- **About Just Like Medium** — Platform name, founded year, version, contributors, mission, tech stack tags
- **Buy Me a Coffee** — BMC-branded card with:
  - Coffee cup SVG icon matching the official BMC logo
  - Heading in the **Cookie** cursive font (matching BMC's brand typeface)
  - Payment methods: UPI (₹), PayPal (P), Bitcoin (₿), Bank Transfer — each with a copy-to-clipboard button
  - Payment QR code
  - Thank you message footer with heart icon
  - Yellow gradient background matching BMC's `#FFDD00` brand color

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6, Tailwind CSS, Axios |
| Editor | Tiptap (rich text, image upload, link extension) |
| Icons | React Icons (Feather Icons `fi`) |
| Fonts | Google Fonts — Cookie (Buy Me a Coffee section) |
| Date utils | date-fns |
| Notifications | react-hot-toast |
| Backend | Node.js 20, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT (`jsonwebtoken`), `bcryptjs` |
| Images | Cloudinary, `multer-storage-cloudinary`, `multer` (memory storage) |
| Scheduling | Native `setInterval` in `server.js` — checks every 60 s |
| Deployment | GitHub Pages (frontend), Render.com (backend) |
| CI/CD | GitHub Actions |

---

## Project Structure

```
just-like-medium/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Build frontend + deploy to GitHub Pages on push to main
│
├── backend/
│   ├── controllers/
│   │   ├── authController.js       # register, login, getMe
│   │   ├── postController.js       # CRUD, like, clap, report, hide, warn, suspend, ban author
│   │   ├── commentController.js    # CRUD, like, report, thread-participant notifications
│   │   ├── userController.js       # profile, follow/unfollow, save-post, admin ops, reported users
│   │   └── appealController.js     # create, list, approve (reverses action), reject
│   │
│   ├── middleware/
│   │   ├── auth.js                 # JWT protect + optionalAuth
│   │   ├── adminAuth.js            # adminOnly guard
│   │   └── checkRestrictions.js    # Blocks write actions for banned/suspended users
│   │
│   ├── models/
│   │   ├── User.js                 # Full schema — see Data Models section
│   │   ├── Post.js                 # Full schema — see Data Models section
│   │   ├── Comment.js              # Full schema — see Data Models section
│   │   ├── Notification.js         # recipient, fromUser, type, post, submissionStatus, moderationAction
│   │   ├── Appeal.js               # user, action, commentContent, reason, status, adminNote
│   │   ├── List.js                 # owner, name, description, isPrivate, posts[], savedBy[]
│   │   └── DeveloperProfile.js     # Singleton — all about-developer page content
│   │
│   ├── routes/
│   │   ├── auth.js                 # /api/auth — register, login, me
│   │   ├── posts.js                # /api/posts — CRUD, like, clap, report, admin routes, submission routes
│   │   ├── comments.js             # /api/comments — CRUD, like, report
│   │   ├── users.js                # /api/users — profile, follow, save, history, responses, admin routes
│   │   ├── notifications.js        # /api/notifications — list, mark read
│   │   ├── appeals.js              # /api/appeals — user submit, admin review
│   │   ├── lists.js                # /api/lists — CRUD, save/unsave list
│   │   ├── linkPreview.js          # /api/link-preview — fetch OG metadata for editor
│   │   ├── topics.js               # /api/topics — suggested topics
│   │   └── developerProfile.js     # /api/developer-profile — get (public) + put (admin)
│   │
│   ├── utils/
│   │   └── cloudinary.js           # Cloudinary config + multer storage helpers + deleteFromCloudinary
│   │
│   └── server.js                   # Express app, CORS, routes, pending-counts endpoint, scheduled publisher
│
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── 404.html                # GitHub Pages SPA routing fix
│   │
│   └── src/
│       ├── components/
│       │   ├── SidebarLayout.jsx   # Sticky top navbar + collapsible desktop sidebar + mobile overlay
│       │   ├── Navbar.jsx          # Guest/landing page navbar
│       │   ├── PostCard.jsx        # Feed article card with save/bookmark button
│       │   ├── SaveToListDropdown.jsx  # Dropdown to save story to any custom list
│       │   ├── CommentSection.jsx  # Comment list, replies, like, report, highlight-on-scroll
│       │   ├── RichTextEditor.jsx  # Tiptap editor with image + link + all formatting
│       │   ├── UserBadges.jsx      # Consistent verified (blue) + admin (gold) badge display
│       │   └── LoadingSpinner.jsx
│       │
│       ├── context/
│       │   ├── AuthContext.jsx     # Global auth state — user, login, logout
│       │   ├── SavedPostsContext.jsx  # Global set of saved post IDs; markAsSaved / markAsUnsaved
│       │   └── ThemeContext.jsx    # Dark/light mode toggle persisted to localStorage
│       │
│       ├── pages/
│       │   ├── Home.jsx            # Landing (guest) + paginated feed with For You / Following tabs
│       │   ├── Article.jsx         # Full article, like, clap, save, comments, report
│       │   ├── WriteArticle.jsx    # New post editor with submit/schedule/publish workflow
│       │   ├── EditArticle.jsx     # Edit existing post (loads by ID)
│       │   ├── AuthorProfile.jsx   # Public author page — cover image, bio, posts, activity
│       │   ├── Library.jsx         # 4-tab library: lists, saved lists, history, responses
│       │   ├── MyStories.jsx       # Drafts + published posts, submission status, schedule
│       │   ├── StatsPage.jsx       # Per-story views/likes/claps + audience tab
│       │   ├── FollowingPage.jsx   # Following list + suggestions with verified/admin badges
│       │   ├── NotificationsPage.jsx  # Full notifications list with mark-all-read
│       │   ├── AdminDashboard.jsx  # Full admin panel — all sections described above
│       │   ├── AppealPage.jsx      # Submit and track your own appeals
│       │   ├── AboutDeveloper.jsx  # Portfolio page — CV tabs + sticky sidebar with BMC widget
│       │   ├── Login.jsx
│       │   └── Register.jsx
│       │
│       ├── utils/
│       │   └── axios.js            # Axios instance with base URL + Authorization header
│       │
│       ├── App.jsx                 # Route definitions — public, protected (requires login), admin-only
│       ├── main.jsx                # BrowserRouter with basename for GitHub Pages
│       └── index.css               # Tailwind directives + article content prose styles + comment-highlight animation
│
├── index.html                      # Vite entry; loads Cookie font; GitHub Pages SPA routing script
├── vite.config.js                  # Vite config, /api proxy, base path
├── tailwind.config.js              # Custom colors and fonts
└── README.md
```

---

## Data Models

### User
```js
{
  name:            String,          // Display name
  email:           String,          // Unique, lowercase
  password:        String,          // bcrypt hashed
  bio:             String,
  avatar:          String,          // Cloudinary URL
  avatarPublicId:  String,          // For deletion

  isAdmin:         Boolean,         // Platform admin
  isVerified:      Boolean,         // Blue checkmark
  isSuspended:     Boolean,
  suspendedUntil:  Date,
  banned:          Boolean,
  banReason:       String,

  warnings: [{
    reason:    String,
    createdAt: Date,
  }],

  reportedUsers: [{                 // Reports filed AGAINST this user
    user:      ObjectId (User),
    reason:    String,
    createdAt: Date,
  }],

  followers:  [ObjectId (User)],
  following:  [ObjectId (User)],
  savedPosts: [ObjectId (Post)],

  readingHistory: [{
    post:   ObjectId (Post),
    readAt: Date,
  }],
}
```

### Post
```js
{
  title:            String,
  slug:             String,         // URL-safe, unique, auto-generated
  content:          String,         // HTML from Tiptap editor
  excerpt:          String,         // First 200 chars of plain text
  coverImage:       String,         // Cloudinary URL
  coverImagePublicId: String,

  author:           ObjectId (User),
  tags:             [String],
  likes:            [ObjectId (User)],
  claps:            Number,
  views:            Number,
  readTime:         Number,         // Minutes, calculated on save
  published:        Boolean,
  featured:         Boolean,        // Admin can feature a post

  // Moderation
  reported:         Boolean,
  reportedBy: [{
    user:      ObjectId (User),
    reason:    String,
    createdAt: Date,
  }],
  moderationStatus: String,         // 'pending' | 'actioned' | 'dismissed'
  isHidden:         Boolean,        // Hidden without deletion

  // Submission workflow
  submissionStatus: String,         // 'none' | 'pending' | 'in-review' | 'edits-requested' | 'approved' | 'declined' | 'withdrawn'
  submissionNote:   String,         // Admin note for edits-requested / declined

  scheduledAt:      Date,           // Auto-published when this date passes
}
```

### Comment
```js
{
  content:          String,
  author:           ObjectId (User),
  post:             ObjectId (Post),
  parentComment:    ObjectId (Comment),  // null = top-level; set = reply
  likes:            [ObjectId (User)],
  replies:          [ObjectId (Comment)],

  // Moderation
  reported:         Boolean,
  reportedBy: [{
    user:      ObjectId (User),
    reason:    String,
    createdAt: Date,
  }],
  moderationStatus: String,         // 'pending' | 'actioned' | 'dismissed'
  isHidden:         Boolean,
}
```

### Notification
```js
{
  recipient:        ObjectId (User),
  fromUser:         ObjectId (User),
  type:             String,          // 'like' | 'comment' | 'reply' | 'follow' | 'submission' | 'moderation'
  post:             ObjectId (Post),
  postTitle:        String,
  postSlug:         String,
  comment:          ObjectId (Comment),
  link:             String,          // e.g. /article/<slug>?comment=<id>
  read:             Boolean,

  // Submission-specific
  submissionStatus: String,
  submissionNote:   String,

  // Moderation-specific
  moderationAction: String,          // 'warn' | 'suspend' | 'ban' | 'appeal_approved' | 'appeal_rejected'
}
```

### Appeal
```js
{
  user:           ObjectId (User),
  action:         String,   // 'warn' | 'suspend' | 'ban' | 'delete' | 'hide-story' | 'delete-story'
  commentContent: String,   // Snapshot of content that was actioned (max 1000 chars)
  reason:         String,   // User's explanation (max 500 chars)
  status:         String,   // 'pending' | 'approved' | 'rejected'
  adminNote:      String,
  reviewedBy:     ObjectId (User),
  reviewedAt:     Date,
}
```

### List
```js
{
  owner:       ObjectId (User),
  name:        String,
  description: String,
  isPrivate:   Boolean,
  posts:       [ObjectId (Post)],
  savedBy:     [ObjectId (User)],   // Users who saved this list to their library
}
```

### DeveloperProfile (Singleton)
```js
{
  // Header
  name:              String,
  title:             String,
  location:          String,
  shortBio:          String,
  photo:             String,        // Cloudinary URL (400x400 square crop)
  photoPublicId:     String,
  socialLinks: [{ platform: String, url: String }],

  // About Me tab
  fullBio:           String,
  mission:           String,
  yearsOfExperience: Number,
  currentRole:       String,
  currentCompany:    String,

  // CV tabs
  workExperience:  [{ role, company, startDate, endDate, description }],
  education:       [{ degree, institution, year, grade }],
  skills:          [{ name, category }],           // category: technical|tools|soft|languages
  projects:        [{ name, description, technologies, link }],
  certifications:  [{ name, organization, year }],

  // QR Code section
  qrCode: {
    image:        String,
    imagePublicId:String,
    label:        String,
    purpose:      String,
    altText:      String,
  },

  // About the website section
  websiteInfo: {
    name, foundedYear, version, contributors, mission, techStack
  },

  // Buy Me a Coffee section
  support: {
    heading:         String,
    description:     String,
    upiId:           String,
    paypalEmail:     String,
    bitcoinAddress:  String,
    bankDetails:     String,
    thankYouMessage: String,
    paymentQrCode:   String,
    paymentQrPublicId: String,
  },

  isVisible: Boolean,   // Toggle page visibility without deleting content
}
```

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register new account |
| POST | `/login` | No | Login, returns JWT token |
| GET | `/me` | Yes | Get current user data |

---

### Posts — `/api/posts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Optional | List published posts (search / tag / author / page) |
| GET | `/:slug` | Optional | Get single post — increments views |
| GET | `/id/:id` | Yes | Get post by ID (drafts — author or admin only) |
| POST | `/` | Yes | Create post (`multipart/form-data`) |
| PUT | `/:id` | Yes | Update post |
| DELETE | `/:id` | Yes | Delete post |
| PATCH | `/:id/toggle-publish` | Yes | Publish/unpublish; non-admins submit for review instead |
| POST | `/:id/like` | Yes | Toggle like + notify author |
| POST | `/:id/clap` | Yes | Add clap |
| POST | `/:id/report` | Yes | Report a post |
| POST | `/upload-image` | Yes | Upload image to Cloudinary for editor |
| PATCH | `/:id/submit` | Yes | Submit story for admin review |
| PATCH | `/:id/withdraw` | Yes | Withdraw pending submission |
| PATCH | `/:id/schedule` | Yes | Set a future publish date |
| PATCH | `/:id/unschedule` | Yes | Cancel scheduled publish |
| GET | `/admin/all` | Admin | All posts |
| GET | `/admin/stats` | Admin | Platform-wide stats |
| GET | `/admin/reports` | Admin | Reported posts |
| GET | `/admin/submissions` | Admin | All submissions (filterable by status) |
| GET | `/admin/tags` | Admin | All tags with usage count |
| PUT | `/admin/:id/feature` | Admin | Toggle featured flag |
| PUT | `/admin/:id/publish` | Admin | Toggle publish (admin override) |
| POST | `/admin/:id/dismiss` | Admin | Dismiss report |
| DELETE | `/admin/:id/reported` | Admin | Delete reported post |
| POST | `/admin/:id/hide` | Admin | Hide post |
| POST | `/admin/:id/warn` | Admin | Warn post author |
| POST | `/admin/:id/suspend` | Admin | Suspend post author |
| POST | `/admin/:id/ban` | Admin | Ban post author |
| PATCH | `/admin/:id/submission` | Admin | Update submission status + notify author |
| DELETE | `/admin/tags/:tag` | Admin | Remove tag from all posts |

---

### Comments — `/api/comments`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/:postId` | No | Get all comments + replies for a post |
| POST | `/:postId` | Yes | Add comment; notifies post author + thread participants |
| POST | `/:postId/reply` | Yes | Add reply; notifies parent author + all thread participants |
| DELETE | `/:id` | Yes | Delete own comment (or admin) |
| POST | `/:id/like` | Yes | Toggle like on a comment |
| POST | `/:id/report` | Yes | Report a comment |
| GET | `/admin/all` | Admin | All comments |
| POST | `/admin/:id/hide` | Admin | Hide comment |
| DELETE | `/admin/:id` | Admin | Delete any comment |

---

### Users — `/api/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/:id` | No | Public profile + posts |
| GET | `/me/posts` | Yes | All own posts (drafts + published) |
| GET | `/me/saved` | Yes | Saved/bookmarked posts |
| GET | `/me/history` | Yes | Reading history |
| GET | `/me/responses` | Yes | Comments written, with post thumbnail + author |
| GET | `/me/following` | Yes | Users you follow |
| GET | `/me/suggestions` | Yes | Suggested users to follow |
| PUT | `/profile` | Yes | Update name, bio, avatar |
| PUT | `/change-password` | Yes | Change password |
| POST | `/:id/follow` | Yes | Follow / unfollow |
| POST | `/save-post/:postId` | Yes | Save / unsave (toggle) a post |
| POST | `/report/:id` | Yes | Report a user |
| GET | `/admin/all` | Admin | All users |
| GET | `/admin/reported` | Admin | Users who have been reported |
| DELETE | `/admin/:id` | Admin | Delete user + their posts |
| PUT | `/admin/:id/toggle-admin` | Admin | Grant / revoke admin |
| PUT | `/admin/:id/toggle-verify` | Admin | Grant / revoke verified badge |
| PUT | `/admin/:id/warn` | Admin | Issue a warning |
| PUT | `/admin/:id/suspend` | Admin | Suspend account |
| PUT | `/admin/:id/ban` | Admin | Ban account |
| PUT | `/admin/:id/remove-restrictions` | Admin | Clear all restrictions |

---

### Notifications — `/api/notifications`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | Get all notifications for current user |
| PUT | `/read-all` | Yes | Mark all as read |

---

### Appeals — `/api/appeals`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Yes | Submit an appeal |
| GET | `/my` | Yes | Get own appeals |
| GET | `/admin` | Admin | All appeals (filterable by status + paginated) |
| PUT | `/admin/:id/approve` | Admin | Approve + reverse account-level action |
| PUT | `/admin/:id/reject` | Admin | Reject with note |

---

### Lists — `/api/lists`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Yes | Create a new list |
| GET | `/me` | Yes | Get own lists |
| GET | `/me/saved` | Yes | Get lists saved from other users |
| GET | `/:id` | Optional | Get a list + its posts |
| PUT | `/:id` | Yes | Update list name/description/privacy |
| DELETE | `/:id` | Yes | Delete a list |
| POST | `/:id/save` | Yes | Save / unsave a list (toggle) |
| POST | `/:id/posts/:postId` | Yes | Add / remove a post from a list (toggle) |

---

### Admin Pending Counts — `/api/admin`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/pending-counts` | Admin | Returns `{ reports, appeals, submissions }` counts for sidebar badges |

---

### Developer Profile — `/api/developer-profile`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Get the singleton profile (public) |
| PUT | `/` | Admin | Update any field; handles photo/QR uploads and explicit removes |

---

### Other — `/api/link-preview`, `/api/topics`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/link-preview` | No | Fetch OG metadata for a URL (used by editor) |
| GET | `/api/topics` | No | Suggested topics list |

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** — local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier)
- **Cloudinary** account — [Sign up free](https://cloudinary.com/)

### 1. Clone the repository

```bash
git clone https://github.com/RaajaAqib/just-like-medium.git
cd just-like-medium
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=5501
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/medium_clone
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

```bash
npm run dev     # Development with nodemon
npm start       # Production
```

API available at `http://localhost:5501`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. The Vite dev server proxies `/api/*` to `http://localhost:5501`.

### 4. Create the first admin account

Register normally via the UI, then in MongoDB shell or Compass:

```js
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { isAdmin: true } }
)
```

The Admin Dashboard is accessible at `/admin`.

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `PORT` | Backend | Server port (default `5501`) |
| `MONGODB_URI` | Backend | MongoDB connection string |
| `JWT_SECRET` | Backend | Secret for signing JWT tokens |
| `JWT_EXPIRE` | Backend | Token expiry (e.g. `30d`) |
| `CLOUDINARY_CLOUD_NAME` | Backend | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Backend | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Backend | Cloudinary API secret |
| `CLIENT_URL` | Backend | Frontend origin added to CORS allowlist |
| `VITE_API_URL` | Frontend | Backend API base URL (e.g. `https://just-like-medium.onrender.com`) |
| `VITE_BASE_PATH` | Frontend | Base path for GitHub Pages (e.g. `/just-like-medium/`) |

---

## Deployment

### Backend — Render.com

1. Connect your GitHub repo to [Render](https://render.com)
2. Create a **Web Service** pointing to the `backend/` folder
3. **Build command:** `npm install`
4. **Start command:** `npm start`
5. Add all backend environment variables
6. The service URL is your `VITE_API_URL`

### Frontend — GitHub Pages (GitHub Actions)

`.github/workflows/deploy.yml` auto-triggers on every push to `main`:
1. Installs dependencies in `frontend/`
2. Builds with `npm run build` (injects `VITE_API_URL` from GitHub Secrets, sets `VITE_BASE_PATH` from repo name)
3. Uploads `frontend/dist/` as a Pages artifact and deploys

**Required GitHub Secret:** `VITE_API_URL`

To enable: **Settings → Pages → Source → GitHub Actions**

---

## Tailwind Custom Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `cream` | `#faf9f7` | Landing page background |
| `medium-black` | `#242424` | Primary text and buttons |
| `medium-green` | `#1a8917` | Accent, publish button, links |
| `medium-gray` | `#6b6b6b` | Secondary text |
| `medium-border` | `#e6e6e6` | Dividers and borders |

---

## License

MIT — free to use, modify, and distribute.

---

## Author

Built by **Raja Aqib**  
[github.com/RaajaAqib](https://github.com/RaajaAqib) · [linkedin.com/in/raja-aqib](https://www.linkedin.com/in/raja-aqib)

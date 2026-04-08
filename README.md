# Just Like Medium

A full-stack blogging platform inspired by [Medium.com](https://medium.com), built with React, Node.js, and MongoDB. Supports rich-text writing, image uploads, notifications, a library system, stats, and an admin dashboard.

**Live site:** [raajaaqib.github.io/just-like-medium](https://raajaaqib.github.io/just-like-medium)
**Backend API:** [just-like-medium.onrender.com](https://just-like-medium.onrender.com)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Screenshots](#screenshots)

---

## Features

### Reader Experience
- **Landing page** — Hero section with trending stories for guests
- **Home feed** — "For you" and "Following" tabs, tag filter strip, paginated posts
- **Article page** — Full rich-text rendering, view counter, read time, cover image
- **Search** — Search posts by title or tag from the navbar
- **Tags** — Filter feed by topic (Technology, AI, Design, etc.)

### Writer Experience
- **Rich text editor** — Tiptap-powered editor with headings, bold, italic, links, images, lists, blockquotes, code blocks
- **Cover image upload** — Drag-and-drop cover image via Cloudinary
- **In-editor image upload** — Insert images directly into article body
- **Draft / Publish toggle** — Toggle publish state; drafts navigate to My Stories, published posts navigate to the article
- **Import a story** — Paste plain text into a modal to create a draft instantly
- **Edit stories** — Load drafts or published posts by ID for editing

### Social Features
- **Likes** — Toggle heart like on articles
- **Claps** — Medium-style clap counter (multi-clap supported)
- **Comments** — Add, view, and delete comments on articles; nested reply support
- **Follow / Unfollow** — Follow authors; Following tab shows their posts
- **Save to Library** — Bookmark any article with the bookmark icon; view saved articles in Library
- **Notifications** — Bell icon shows real-time notifications for likes and comments on your posts; mark all as read

### Profile & Account
- **Author profiles** — Avatar, bio, follower/following counts, published posts list
- **Edit profile** — Update name, bio, and avatar (Cloudinary upload)
- **Change password** — Secure password update from profile settings

### My Stories & Stats
- **My Stories** — View all your drafts and published posts; edit, delete, or import
- **Stats page** — Total views, likes, claps per story; horizontal bar chart; Audience tab with followers list

### Admin Dashboard
- **Post management** — View, delete any post
- **User management** — View all users, grant/revoke admin, delete users and their posts

### Platform
- **Medium-style sidebar** — Persistent on desktop (toggles via hamburger), overlay on mobile
- **Fully responsive** — Mobile, tablet, and desktop layouts
- **JWT authentication** — Secure login with token stored in localStorage
- **GitHub Actions CI/CD** — Auto-deploy frontend to GitHub Pages on every push to `main`

---

## Tech Stack

| Layer       | Technology                                                |
|-------------|-----------------------------------------------------------|
| Frontend    | React 18, Vite, React Router v6, Tailwind CSS, Axios      |
| Editor      | Tiptap (rich text, image upload extension)               |
| Icons       | React Icons (Feather Icons, Material Design)              |
| Date utils  | date-fns                                                  |
| Backend     | Node.js, Express.js                                       |
| Database    | MongoDB Atlas (Mongoose ODM)                              |
| Auth        | JWT (jsonwebtoken), bcryptjs                              |
| Images      | Cloudinary, multer-storage-cloudinary                     |
| Deployment  | GitHub Pages (frontend), Render.com (backend)             |
| CI/CD       | GitHub Actions                                            |

---

## Project Structure

```
just-like-medium/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions — build & deploy to GitHub Pages
│
├── backend/
│   ├── controllers/
│   │   ├── authController.js       # register, login, getMe
│   │   ├── postController.js       # CRUD, like, clap, admin list, notifications
│   │   ├── commentController.js    # CRUD, like, notifications
│   │   └── userController.js       # profile, follow/unfollow, admin ops
│   ├── middleware/
│   │   ├── auth.js                 # JWT protect + optionalAuth
│   │   └── adminAuth.js            # adminOnly guard
│   ├── models/
│   │   ├── User.js                 # name, email, password, bio, avatar, followers, following, savedPosts
│   │   ├── Post.js                 # title, slug, content, tags, likes, claps, views, readTime
│   │   ├── Comment.js              # content, author, post, likes, parentComment
│   │   └── Notification.js         # recipient, fromUser, type, postTitle, postSlug, read
│   ├── routes/
│   │   ├── auth.js                 # /api/auth
│   │   ├── posts.js                # /api/posts
│   │   ├── comments.js             # /api/comments
│   │   ├── users.js                # /api/users
│   │   └── notifications.js        # /api/notifications
│   ├── utils/
│   │   └── cloudinary.js           # Cloudinary config + multer storage
│   ├── server.js                   # Express app, CORS, routes
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SidebarLayout.jsx   # Persistent sidebar + top navbar + notifications
│   │   │   ├── Navbar.jsx          # Guest/landing page navbar
│   │   │   ├── PostCard.jsx        # Feed article card with save button
│   │   │   ├── RichTextEditor.jsx  # Tiptap editor with image upload
│   │   │   ├── CommentSection.jsx  # Comment list + add comment
│   │   │   └── LoadingSpinner.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global auth state (user, login, logout)
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Landing page (guest) + logged-in feed
│   │   │   ├── Article.jsx         # Full article view, like, clap, save, comments
│   │   │   ├── WriteArticle.jsx    # New post editor
│   │   │   ├── EditArticle.jsx     # Edit existing post (draft or published)
│   │   │   ├── AuthorProfile.jsx   # Public author page
│   │   │   ├── Library.jsx         # Saved articles (reading list)
│   │   │   ├── MyStories.jsx       # My drafts + published posts, import modal
│   │   │   ├── StatsPage.jsx       # View/like/clap stats + audience tab
│   │   │   ├── FollowingPage.jsx   # Followed writers + recommended topics
│   │   │   ├── AdminDashboard.jsx  # Admin panel
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── OurStory.jsx
│   │   ├── utils/
│   │   │   └── axios.js            # Axios instance with base URL + auth header
│   │   ├── App.jsx                 # Routes (public, protected, admin)
│   │   ├── main.jsx                # BrowserRouter with basename for GitHub Pages
│   │   └── index.css               # Tailwind + custom article content styles
│   ├── vite.config.js              # Vite config, proxy, base path
│   ├── tailwind.config.js          # Custom colors: cream, medium-black, medium-green
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** — local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier)
- **Cloudinary** account — [Sign up free](https://cloudinary.com/)

---

### 1. Clone the repository

```bash
git clone https://github.com/RaajaAqib/just-like-medium.git
cd just-like-medium
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5501

# MongoDB Atlas connection string (use direct hosts if SRV DNS fails)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/medium_clone

JWT_SECRET=your_long_random_secret_here
JWT_EXPIRE=30d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev     # Development (nodemon, auto-restart)
npm start       # Production
```

API is available at `http://localhost:5501`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. The Vite dev server proxies `/api/*` to `http://localhost:5501` — no CORS issues in development.

---

### 4. Create the first admin account

Register normally via the UI, then in MongoDB shell or Compass:

```js
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { isAdmin: true } }
)
```

The Admin Dashboard is accessible at `/admin` for admin accounts.

---

## Environment Variables

| Variable                | Where     | Description                                      |
|-------------------------|-----------|--------------------------------------------------|
| `PORT`                  | Backend   | Server port (default `5501`)                     |
| `MONGODB_URI`           | Backend   | MongoDB connection string                        |
| `JWT_SECRET`            | Backend   | Secret key for signing JWT tokens                |
| `JWT_EXPIRE`            | Backend   | Token expiry duration (e.g. `30d`)               |
| `CLOUDINARY_CLOUD_NAME` | Backend   | Your Cloudinary cloud name                       |
| `CLOUDINARY_API_KEY`    | Backend   | Your Cloudinary API key                          |
| `CLOUDINARY_API_SECRET` | Backend   | Your Cloudinary API secret                       |
| `CLIENT_URL`            | Backend   | Frontend URL added to CORS allowlist             |
| `VITE_API_URL`          | Frontend  | Backend API base URL (e.g. `https://api.render.com`) |
| `VITE_BASE_PATH`        | Frontend  | Base path for GitHub Pages (e.g. `/just-like-medium/`) |

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint     | Auth | Description               |
|--------|--------------|------|---------------------------|
| POST   | `/register`  | No   | Register new account      |
| POST   | `/login`     | No   | Login, returns JWT token  |
| GET    | `/me`        | Yes  | Get current user data     |

---

### Posts — `/api/posts`

| Method | Endpoint            | Auth     | Description                           |
|--------|---------------------|----------|---------------------------------------|
| GET    | `/`                 | No       | List published posts (search/tag/page)|
| GET    | `/:slug`            | Optional | Get single post (increments views)    |
| GET    | `/id/:id`           | Yes      | Get post by ID (drafts, author only)  |
| POST   | `/`                 | Yes      | Create post (`multipart/form-data`)   |
| PUT    | `/:id`              | Yes      | Update post                           |
| DELETE | `/:id`              | Yes      | Delete post                           |
| POST   | `/:id/like`         | Yes      | Toggle like + creates notification    |
| POST   | `/:id/clap`         | Yes      | Add clap                              |
| POST   | `/upload-image`     | Yes      | Upload image to Cloudinary for editor |
| GET    | `/admin/all`        | Admin    | All posts (admin only)                |

**Query params for `GET /`:**
- `search` — full-text search by title or tag
- `tag` — filter by tag name
- `author` — filter by author user ID
- `page` / `limit` — pagination (default limit: 10)

---

### Comments — `/api/comments`

| Method | Endpoint       | Auth | Description                            |
|--------|----------------|------|----------------------------------------|
| GET    | `/:postId`     | No   | Get all comments for a post            |
| POST   | `/:postId`     | Yes  | Add comment + creates notification     |
| DELETE | `/:id`         | Yes  | Delete own comment (or admin)          |
| POST   | `/:id/like`    | Yes  | Toggle like on a comment               |

---

### Users — `/api/users`

| Method | Endpoint                   | Auth  | Description                          |
|--------|----------------------------|-------|--------------------------------------|
| GET    | `/:id`                     | No    | Get public profile + published posts |
| GET    | `/me/posts`                | Yes   | Get all own posts (incl. drafts)     |
| GET    | `/me/saved`                | Yes   | Get saved/bookmarked posts           |
| PUT    | `/profile`                 | Yes   | Update name, bio, avatar             |
| PUT    | `/change-password`         | Yes   | Change password                      |
| POST   | `/:id/follow`              | Yes   | Follow / unfollow a user             |
| POST   | `/save-post/:postId`       | Yes   | Save / unsave (toggle) a post        |
| GET    | `/admin/all`               | Admin | List all users                       |
| DELETE | `/admin/:id`               | Admin | Delete user and their posts          |
| PUT    | `/admin/:id/toggle-admin`  | Admin | Grant or revoke admin role           |

---

### Notifications — `/api/notifications`

| Method | Endpoint      | Auth | Description                            |
|--------|---------------|------|----------------------------------------|
| GET    | `/`           | Yes  | Get notifications for current user     |
| PUT    | `/read-all`   | Yes  | Mark all notifications as read         |

Notifications are created automatically when:
- Someone **likes** your post
- Someone **comments** on your post (excluding self-comments)

---

## Deployment

### Backend — Render.com

1. Connect your GitHub repo to [Render](https://render.com)
2. Create a **Web Service** pointing to the `backend/` folder
3. Set **Build command:** `npm install`
4. Set **Start command:** `npm start`
5. Add all environment variables from the table above
6. The service URL (e.g. `https://just-like-medium.onrender.com`) is your `VITE_API_URL`

---

### Frontend — GitHub Pages (via GitHub Actions)

The repository includes a CI/CD workflow at `.github/workflows/deploy.yml` that:
1. Triggers on every push to `main`
2. Builds the frontend with `npm run build`
3. Deploys the `dist/` folder to GitHub Pages

Required GitHub repository secrets:
- `VITE_API_URL` — your Render backend URL (e.g. `https://just-like-medium.onrender.com`)

The `VITE_BASE_PATH` is set automatically from the repository name in the workflow.

To enable GitHub Pages:
1. Go to **Settings → Pages**
2. Set source to **GitHub Actions**

---

## Data Models

### User
```
name, email, password (hashed), bio, avatar, avatarPublicId,
isAdmin, followers[], following[], savedPosts[]
```

### Post
```
title, slug, content (HTML), excerpt, coverImage, coverImagePublicId,
author (ref User), tags[], likes[], claps, views, readTime, published
```

### Comment
```
content, author (ref User), post (ref Post),
likes[], parentComment (ref Comment)
```

### Notification
```
recipient (ref User), fromUser (ref User),
type (like | comment | follow),
post (ref Post), postTitle, postSlug, read
```

---

## Tailwind Custom Colors

| Name              | Hex       | Usage                        |
|-------------------|-----------|------------------------------|
| `cream`           | `#faf9f7` | Landing page background      |
| `medium-black`    | `#242424` | Primary text and buttons     |
| `medium-green`    | `#1a8917` | Accent, publish button, links|
| `medium-gray`     | `#6b6b6b` | Secondary text               |
| `medium-border`   | `#e6e6e6` | Dividers and borders         |

---

## License

MIT — free to use, modify, and distribute.

---

## Author

Built by **Raja Aqib** — [github.com/RaajaAqib](https://github.com/RaajaAqib)

# Just Like Medium — Full-Stack Blogging Platform

A full-stack blogging platform inspired by Medium, built with React + Node.js + MongoDB.

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React 18 (Vite), Tailwind CSS, React Router v6, Axios |
| Editor   | Tiptap (rich text)                      |
| Backend  | Node.js, Express.js                     |
| Database | MongoDB (Mongoose)                      |
| Auth     | JWT (JSON Web Tokens)                   |
| Images   | Cloudinary                              |

---

## Features

- **Authentication** — Register / Login with JWT; protected routes
- **Rich text editor** — Tiptap-powered editor with headings, bold, italic, lists, blockquote, code blocks, links, images
- **Blog posts** — Create, read, update, delete with cover image upload
- **Tags** — Up to 5 tags per post; filter by tag on home page
- **Search** — Search posts by title or tag
- **Likes & Claps** — Heart (toggle) + Medium-style clap counter
- **Comments** — Nested-ready comment system with likes and delete
- **Author profiles** — Bio, avatar, follow/unfollow, post list, edit own profile
- **Admin dashboard** — Manage all posts and users; grant/revoke admin; delete users
- **Pagination** — Server-side pagination on home feed
- **View counter** — Auto-increments on every article visit
- **Read time** — Auto-calculated from word count

---

## Project Structure

```
Just Like Medium/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection helper
│   ├── controllers/
│   │   ├── authController.js      # register, login, getMe
│   │   ├── postController.js      # CRUD, like, clap, admin list
│   │   ├── commentController.js   # CRUD, like
│   │   └── userController.js      # profile, follow, admin ops
│   ├── middleware/
│   │   ├── auth.js                # JWT protect + optionalAuth
│   │   └── adminAuth.js           # adminOnly guard
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   └── Comment.js
│   ├── routes/
│   │   ├── auth.js                # /api/auth
│   │   ├── posts.js               # /api/posts
│   │   ├── comments.js            # /api/comments
│   │   └── users.js               # /api/users
│   ├── utils/
│   │   └── cloudinary.js          # Cloudinary config + multer storage
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── PostCard.jsx
│   │   │   ├── CommentSection.jsx
│   │   │   ├── RichTextEditor.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Global auth state
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Article.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── WriteArticle.jsx
│   │   │   ├── EditArticle.jsx
│   │   │   ├── AuthorProfile.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── utils/
│   │   │   └── axios.js           # Axios instance with interceptors
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free)
- **Cloudinary** account — [Sign up free](https://cloudinary.com/)

---

### 1. Clone / open the project

```bash
cd "Just Like Medium"
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/medium_clone
# Or Atlas: mongodb+srv://<user>:<pass>@cluster.mongodb.net/medium_clone

JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRE=30d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
# Development (auto-restarts)
npm run dev

# Production
npm start
```

The API will be live at `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

The frontend will be live at `http://localhost:5173`

> The Vite dev server proxies `/api/*` to `http://localhost:5000` — no CORS issues during development.

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint           | Auth | Description        |
|--------|--------------------|------|--------------------|
| POST   | `/register`        | No   | Create account     |
| POST   | `/login`           | No   | Login, get JWT     |
| GET    | `/me`              | Yes  | Get current user   |

### Posts — `/api/posts`

| Method | Endpoint              | Auth    | Description                     |
|--------|-----------------------|---------|---------------------------------|
| GET    | `/`                   | No      | List posts (search, tag, page)  |
| GET    | `/:slug`              | Optional| Get single post (increments views)|
| POST   | `/`                   | Yes     | Create post (multipart/form-data)|
| PUT    | `/:id`                | Yes     | Update post                     |
| DELETE | `/:id`                | Yes     | Delete post                     |
| POST   | `/:id/like`           | Yes     | Toggle like                     |
| POST   | `/:id/clap`           | Yes     | Add clap                        |
| GET    | `/admin/all`          | Admin   | All posts (admin)               |

**Query params for GET `/`:**
- `search` — search by title/tag
- `tag` — filter by tag
- `author` — filter by author ID
- `page` / `limit` — pagination

### Comments — `/api/comments`

| Method | Endpoint         | Auth | Description       |
|--------|------------------|------|-------------------|
| GET    | `/:postId`       | No   | Get post comments |
| POST   | `/:postId`       | Yes  | Add comment       |
| DELETE | `/:id`           | Yes  | Delete comment    |
| POST   | `/:id/like`      | Yes  | Toggle like       |

### Users — `/api/users`

| Method | Endpoint                    | Auth  | Description              |
|--------|-----------------------------|-------|--------------------------|
| GET    | `/:id`                      | No    | Get profile + posts      |
| PUT    | `/profile`                  | Yes   | Update name/bio/avatar   |
| PUT    | `/change-password`          | Yes   | Change password          |
| POST   | `/:id/follow`               | Yes   | Follow / unfollow        |
| GET    | `/admin/all`                | Admin | List all users           |
| DELETE | `/admin/:id`                | Admin | Delete user + their posts|
| PUT    | `/admin/:id/toggle-admin`   | Admin | Grant/revoke admin       |

---

## Creating the First Admin

MongoDB shell or Compass — update a user's `isAdmin` field:

```js
// In mongosh
use medium_clone
db.users.updateOne({ email: "your@email.com" }, { $set: { isAdmin: true } })
```

---

## Deployment

### Backend (Railway / Render / Fly.io)

1. Push `backend/` to a git repo
2. Set all environment variables from `.env`
3. Build command: `npm install`  |  Start command: `npm start`

### Frontend (Vercel / Netlify)

1. Push `frontend/` to a git repo
2. Build command: `npm run build`  |  Output dir: `dist`
3. Set env variable:
   ```
   VITE_API_URL=https://your-backend.up.railway.app/api
   ```
4. Update `frontend/src/utils/axios.js` — change `baseURL` to `import.meta.env.VITE_API_URL`

---

## Environment Variables Summary

| Variable                  | Where     | Description                        |
|---------------------------|-----------|------------------------------------|
| `PORT`                    | Backend   | Server port (default 5000)         |
| `MONGODB_URI`             | Backend   | MongoDB connection string          |
| `JWT_SECRET`              | Backend   | Secret for signing tokens          |
| `JWT_EXPIRE`              | Backend   | Token expiry (e.g. `30d`)          |
| `CLOUDINARY_CLOUD_NAME`   | Backend   | Cloudinary cloud name              |
| `CLOUDINARY_API_KEY`      | Backend   | Cloudinary API key                 |
| `CLOUDINARY_API_SECRET`   | Backend   | Cloudinary API secret              |
| `CLIENT_URL`              | Backend   | Frontend URL (for CORS)            |

---

## License

MIT — free to use, modify, and distribute.

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const linkPreviewRoutes  = require('./routes/linkPreview');
const appealRoutes       = require('./routes/appeals');
const listRoutes         = require('./routes/lists');
const developerProfileRoutes = require('./routes/developerProfile');
const topicRoutes            = require('./routes/topics');

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://raajaaqib.github.io',
  'https://just-like-medium-private.pages.dev',
  process.env.CLIENT_URL,
].filter(Boolean).map(o => o.toLowerCase());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin.toLowerCase())) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/link-preview', linkPreviewRoutes);
app.use('/api/appeals',     appealRoutes);
app.use('/api/lists',       listRoutes);
app.use('/api/developer-profile', developerProfileRoutes);
app.use('/api/topics',           topicRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Medium Clone API is running' });
});

// Admin pending counts — single endpoint for sidebar badges
app.get('/api/admin/pending-counts', async (req, res) => {
  try {
    const { protect }   = require('./middleware/auth');
    const { adminOnly } = require('./middleware/adminAuth');
    // Run auth middleware manually
    await new Promise((resolve, reject) => protect(req, res, (err) => err ? reject(err) : resolve()));
    await new Promise((resolve, reject) => adminOnly(req, res, (err) => err ? reject(err) : resolve()));

    const Post    = require('./models/Post');
    const Appeal  = require('./models/Appeal');
    const Comment = require('./models/Comment');

    const User = require('./models/User');
    const [commentReports, storyReports, appeals, submissions, userReportsArr] = await Promise.all([
      Comment.countDocuments({ reported: true, moderationStatus: 'pending' }),
      Post.countDocuments({ reported: true, moderationStatus: 'pending' }),
      Appeal.countDocuments({ status: 'pending' }),
      Post.countDocuments({ submissionStatus: 'pending' }),
      User.aggregate([
        { $match: { reportedUsers: { $exists: true, $ne: [] } } },
        { $unwind: '$reportedUsers' },
        { $group: { _id: '$reportedUsers.user' } },
        { $count: 'total' },
      ]),
    ]);

    const userReports = userReportsArr[0]?.total || 0;
    res.json({ success: true, counts: { reports: commentReports + storyReports + userReports, appeals, submissions } });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Auto-publish scheduled posts every minute
function startScheduledPublisher() {
  const Post = require('./models/Post');
  setInterval(async () => {
    try {
      const result = await Post.updateMany(
        { scheduledAt: { $lte: new Date() }, published: false },
        { $set: { published: true, scheduledAt: null, submissionStatus: 'none' } }
      );
      if (result.modifiedCount > 0) {
        console.log(`Auto-published ${result.modifiedCount} scheduled post(s)`);
      }
    } catch (err) {
      console.error('Scheduled publisher error:', err.message);
    }
  }, 60 * 1000); // every 60 seconds
}

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5501;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    startScheduledPublisher();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

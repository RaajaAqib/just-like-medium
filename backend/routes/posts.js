const express = require('express');
const router = express.Router();
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  clapPost,
  getAllPostsAdmin,
  reportPost,
  getPostReports,
  dismissPostReport,
  deleteReportedPost,
  hidePost,
  warnPostAuthor,
  suspendPostAuthor,
  banPostAuthor,
} = require('../controllers/postController');
const { protect, optionalAuth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const { checkRestrictions } = require('../middleware/checkRestrictions');
const { upload } = require('../utils/cloudinary');

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllPostsAdmin);

// Admin stats
router.get('/admin/stats', protect, adminOnly, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const User = require('../models/User');
    const Comment = require('../models/Comment');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalPosts, totalPublished, totalDrafts, publishedToday,
      totalUsers, totalComments,
      viewsAgg, likesAgg, clapsAgg,
      recentPosts, topPosts, tagAgg
    ] = await Promise.all([
      Post.countDocuments(),
      Post.countDocuments({ published: true }),
      Post.countDocuments({ published: false }),
      Post.countDocuments({ published: true, createdAt: { $gte: today } }),
      User.countDocuments(),
      Comment.countDocuments(),
      Post.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      Post.aggregate([{ $group: { _id: null, total: { $sum: { $size: '$likes' } } } }]),
      Post.aggregate([{ $group: { _id: null, total: { $sum: '$claps' } } }]),
      Post.find({ published: true }).sort({ createdAt: -1 }).limit(7)
        .select('title createdAt views likes').populate('author', 'name'),
      Post.find({ published: true }).sort({ views: -1 }).limit(5)
        .select('title views likes claps slug').populate('author', 'name'),
      Post.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 }
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        totalPosts, totalPublished, totalDrafts, publishedToday,
        totalUsers, totalComments,
        totalViews: viewsAgg[0]?.total || 0,
        totalLikes: likesAgg[0]?.total || 0,
        totalClaps: clapsAgg[0]?.total || 0,
      },
      recentPosts,
      topPosts,
      tagStats: tagAgg,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin toggle featured
router.put('/admin/:id/feature', protect, adminOnly, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.featured = !post.featured;
    await post.save({ validateBeforeSave: false });
    res.json({ success: true, featured: post.featured });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin toggle publish
router.put('/admin/:id/publish', protect, adminOnly, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.published = !post.published;
    await post.save({ validateBeforeSave: false });
    res.json({ success: true, published: post.published });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin get all tags with usage count
router.get('/admin/tags', protect, adminOnly, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const tags = await Post.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, tags });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin delete a tag from all posts
router.delete('/admin/tags/:tag', protect, adminOnly, async (req, res) => {
  try {
    const Post = require('../models/Post');
    await Post.updateMany({ tags: req.params.tag }, { $pull: { tags: req.params.tag } });
    res.json({ success: true, message: `Tag "${req.params.tag}" removed from all posts` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Image upload for editor (must be before /:slug)
router.post('/upload-image', protect, upload.single('coverImage'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: req.file.path });
});

// Get post by ID (for editing drafts — author only)
router.get('/id/:id', protect, async (req, res) => {
  try {
    const post = await require('../models/Post').findById(req.params.id).populate('author', 'name avatar bio isAdmin isVerified');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.author._id.toString() !== req.user._id.toString() && !req.user.isAdmin)
      return res.status(403).json({ success: false, message: 'Not authorized' });
    res.json({ success: true, post });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Admin: reported posts
router.get('/admin/reports',         protect, adminOnly, getPostReports);
router.post('/admin/:id/dismiss',    protect, adminOnly, dismissPostReport);
router.delete('/admin/:id/reported', protect, adminOnly, deleteReportedPost);
router.post('/admin/:id/hide',       protect, adminOnly, hidePost);
router.post('/admin/:id/warn',       protect, adminOnly, warnPostAuthor);
router.post('/admin/:id/suspend',    protect, adminOnly, suspendPostAuthor);
router.post('/admin/:id/ban',        protect, adminOnly, banPostAuthor);

// ── Admin boost / unboost ────────────────────────────────────────────────────
router.post('/admin/:id/boost', protect, adminOnly, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { isBoosted: true, boostedAt: new Date() },
      { new: true }
    );
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/admin/:id/boost', protect, adminOnly, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { isBoosted: false, boostedAt: null },
      { new: true }
    );
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Public (optionalAuth so following feed works when logged in)
router.get('/', optionalAuth, getPosts);
router.get('/:slug', optionalAuth, getPost);

// Protected — write actions blocked for banned/suspended users
router.post('/',      protect, checkRestrictions, upload.single('coverImage'), createPost);
router.put('/:id',   protect, checkRestrictions, upload.single('coverImage'), updatePost);
router.delete('/:id', protect, deletePost);
// Toggle publish/unpublish (owner only)
router.patch('/:id/toggle-publish', protect, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const post = await Post.findOne({ _id: req.params.id, author: req.user._id });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (!post.published && !req.user.isAdmin) {
      // Non-admin trying to publish → submit for review instead
      post.submissionStatus = 'pending';
      await post.save({ validateBeforeSave: false });
      return res.json({ success: true, published: false, submissionStatus: 'pending' });
    }

    post.published = !post.published;
    await post.save({ validateBeforeSave: false });
    res.json({ success: true, published: post.published });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/like',   protect, checkRestrictions, likePost);
router.post('/:id/clap',   protect, checkRestrictions, clapPost);
router.post('/:id/report', protect, reportPost); // reporting itself is always allowed

// ── Submit story for admin review ─────────────────────────────────────────────
router.patch('/:id/submit', protect, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const post = await Post.findOne({ _id: req.params.id, author: req.user._id });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (['pending', 'in-review'].includes(post.submissionStatus)) {
      return res.status(400).json({ success: false, message: 'Already submitted for review' });
    }
    post.submissionStatus = 'pending';
    post.published = false;
    post.scheduledAt = null;
    await post.save({ validateBeforeSave: false });
    res.json({ success: true, submissionStatus: post.submissionStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Withdraw submission ───────────────────────────────────────────────────────
router.patch('/:id/withdraw', protect, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const post = await Post.findOne({ _id: req.params.id, author: req.user._id });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.submissionStatus = 'withdrawn';
    await post.save({ validateBeforeSave: false });
    res.json({ success: true, submissionStatus: post.submissionStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Schedule story ────────────────────────────────────────────────────────────
router.patch('/:id/schedule', protect, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const post = await Post.findOne({ _id: req.params.id, author: req.user._id });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const { scheduledAt } = req.body;
    if (!scheduledAt) return res.status(400).json({ success: false, message: 'scheduledAt is required' });
    const date = new Date(scheduledAt);
    if (date <= new Date()) return res.status(400).json({ success: false, message: 'Scheduled date must be in the future' });
    post.scheduledAt = date;
    post.published = false;
    post.submissionStatus = 'none';
    await post.save({ validateBeforeSave: false });
    res.json({ success: true, scheduledAt: post.scheduledAt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Cancel schedule ───────────────────────────────────────────────────────────
router.patch('/:id/unschedule', protect, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const post = await Post.findOne({ _id: req.params.id, author: req.user._id });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.scheduledAt = null;
    await post.save({ validateBeforeSave: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Admin: update submission status ──────────────────────────────────────────
router.patch('/admin/:id/submission', protect, adminOnly, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const Notification = require('../models/Notification');
    const { status, note } = req.body;
    const validStatuses = ['pending', 'in-review', 'edits-requested', 'approved', 'declined', 'withdrawn'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const post = await Post.findById(req.params.id).populate('author', 'name email');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.submissionStatus = status;
    if (note !== undefined) post.submissionNote = note;
    if (status === 'approved') post.published = true;
    if (status === 'declined') post.published = false;
    await post.save({ validateBeforeSave: false });

    // Notify the author — only for statuses that matter to them
    const notifyStatuses = ['approved', 'declined', 'edits-requested', 'in-review'];
    if (notifyStatuses.includes(status) && post.author) {
      const link = status === 'approved'
        ? `/article/${post.slug}`
        : `/edit/${post._id}`;
      await Notification.create({
        recipient:        post.author._id,
        fromUser:         req.user._id,
        type:             'submission',
        post:             post._id,
        postTitle:        post.title,
        postSlug:         post.slug,
        submissionStatus: status,
        submissionNote:   note || '',
        link,
      });
    }

    res.json({ success: true, submissionStatus: post.submissionStatus, published: post.published });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Admin: get all submissions ────────────────────────────────────────────────
router.get('/admin/submissions', protect, adminOnly, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const { status } = req.query;
    const filter = { submissionStatus: { $ne: 'none' } };
    if (status) filter.submissionStatus = status;
    const posts = await Post.find(filter)
      .populate('author', 'name avatar email isAdmin isVerified')
      .sort({ updatedAt: -1 })
      .select('title slug submissionStatus submissionNote coverImage author updatedAt createdAt readTime');
    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

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
} = require('../controllers/postController');
const { protect, optionalAuth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
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
    const post = await require('../models/Post').findById(req.params.id).populate('author', 'name avatar bio');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.author._id.toString() !== req.user._id.toString() && !req.user.isAdmin)
      return res.status(403).json({ success: false, message: 'Not authorized' });
    res.json({ success: true, post });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Public
router.get('/', getPosts);
router.get('/:slug', optionalAuth, getPost);

// Protected
router.post('/', protect, upload.single('coverImage'), createPost);
router.put('/:id', protect, upload.single('coverImage'), updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);
router.post('/:id/clap', protect, clapPost);

module.exports = router;

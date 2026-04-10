const express = require('express');
const router = express.Router();
const { getComments, createComment, deleteComment, likeComment, reportComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

// Admin: get all comments across all posts
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const Comment = require('../models/Comment');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const total = await Comment.countDocuments();
    const comments = await Comment.find()
      .populate('author', 'name avatar email')
      .populate('post', 'title slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json({ success: true, comments, total, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:postId', getComments);
router.post('/:postId', protect, createComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, likeComment);
router.post('/:id/report', protect, reportComment);

module.exports = router;

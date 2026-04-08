const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  changePassword,
  followUser,
  getAllUsersAdmin,
  deleteUserAdmin,
  toggleAdmin,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const { upload } = require('../utils/cloudinary');

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllUsersAdmin);
router.delete('/admin/:id', protect, adminOnly, deleteUserAdmin);
router.put('/admin/:id/toggle-admin', protect, adminOnly, toggleAdmin);

// Protected
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/:id/follow', protect, followUser);

// Save / unsave a post
router.post('/save-post/:postId', protect, async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user._id);
    const postId = req.params.postId;
    const already = user.savedPosts.some(id => id.toString() === postId);
    if (already) {
      user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
    } else {
      user.savedPosts.push(postId);
    }
    await user.save();
    res.json({ success: true, saved: !already, savedPosts: user.savedPosts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get current user's all posts (including drafts) for My Stories / Stats
router.get('/me/posts', protect, async (req, res) => {
  try {
    const posts = await require('../models/Post').find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .select('-content');
    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get current user's saved posts (library)
router.get('/me/saved', protect, async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user._id)
      .populate({ path: 'savedPosts', populate: { path: 'author', select: 'name avatar' } });
    res.json({ success: true, savedPosts: user.savedPosts || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Public
router.get('/:id', getUserProfile);

module.exports = router;

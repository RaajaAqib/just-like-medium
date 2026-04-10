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
const { checkRestrictions } = require('../middleware/checkRestrictions');
const { upload } = require('../utils/cloudinary');

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllUsersAdmin);
router.delete('/admin/:id', protect, adminOnly, deleteUserAdmin);
router.put('/admin/:id/toggle-admin', protect, adminOnly, toggleAdmin);

// Admin ban/unban user
router.put('/admin/:id/ban', protect, adminOnly, async (req, res) => {
  try {
    const User         = require('../models/User');
    const Notification = require('../models/Notification');
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.banned    = !user.banned;
    user.banReason = user.banned ? (req.body.reason || 'Violated community guidelines') : '';
    await user.save({ validateBeforeSave: false });
    if (user.banned) {
      await Notification.create({
        recipient: user._id, fromUser: req.user._id,
        type: 'moderation', moderationAction: 'ban',
      }).catch(() => {});
    }
    res.json({ success: true, banned: user.banned, banReason: user.banReason });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin warn user directly
router.post('/admin/:id/warn', protect, adminOnly, async (req, res) => {
  try {
    const User         = require('../models/User');
    const Notification = require('../models/Notification');
    const { reason = 'Violation of community guidelines' } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $push: { warnings: { reason, date: new Date(), adminId: req.user._id } } },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await Notification.create({
      recipient: user._id, fromUser: req.user._id,
      type: 'moderation', moderationAction: 'warn',
    }).catch(() => {});
    res.json({ success: true, warnings: user.warnings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin suspend user directly
router.post('/admin/:id/suspend', protect, adminOnly, async (req, res) => {
  try {
    const User         = require('../models/User');
    const Notification = require('../models/Notification');
    const { days = 7, reason = 'Violation of community guidelines' } = req.body;
    const suspendedUntil = new Date(Date.now() + parseInt(days) * 24 * 60 * 60 * 1000);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isSuspended: true,
        suspendedUntil,
        $push: { warnings: { reason: `Suspended ${days}d: ${reason}`, date: new Date(), adminId: req.user._id } },
      },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await Notification.create({
      recipient: user._id, fromUser: req.user._id,
      type: 'moderation', moderationAction: 'suspend',
    }).catch(() => {});
    res.json({ success: true, isSuspended: user.isSuspended, suspendedUntil: user.suspendedUntil });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin remove all restrictions from a user
router.post('/admin/:id/remove-restrictions', protect, adminOnly, async (req, res) => {
  try {
    const User         = require('../models/User');
    const Notification = require('../models/Notification');
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { banned: false, banReason: '', isSuspended: false, suspendedUntil: null, warnings: [] },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await Notification.create({
      recipient: user._id, fromUser: req.user._id,
      type: 'moderation', moderationAction: 'appeal_approved',
    }).catch(() => {});
    res.json({ success: true, message: 'All restrictions removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Protected
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/:id/follow', protect, checkRestrictions, followUser);

// Save / unsave a post
router.post('/save-post/:postId', protect, checkRestrictions, async (req, res) => {
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

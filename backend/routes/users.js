const express = require('express');
const router = express.Router();
const User = require('../models/User');
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

// GET /api/users/admin/reported — all users who have been reported by others
router.get('/admin/reported', protect, adminOnly, async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    // Unwind all reporters' reportedUsers arrays and group by target user
    const pipeline = [
      { $match: { reportedUsers: { $exists: true, $ne: [] } } },
      { $unwind: '$reportedUsers' },
      {
        $group: {
          _id:       '$reportedUsers.user',
          reports:   { $sum: 1 },
          reasons:   { $push: '$reportedUsers.reason' },
          reporters: { $push: { user: '$_id', name: '$name', createdAt: '$reportedUsers.createdAt' } },
          lastReportedAt: { $max: '$reportedUsers.createdAt' },
        },
      },
      { $sort: { reports: -1, lastReportedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from:         'users',
          localField:   '_id',
          foreignField: '_id',
          as:           'targetUser',
        },
      },
      { $unwind: '$targetUser' },
      {
        $project: {
          reports:       1,
          reasons:       1,
          reporters:     1,
          lastReportedAt: 1,
          'targetUser._id':         1,
          'targetUser.name':        1,
          'targetUser.email':       1,
          'targetUser.avatar':      1,
          'targetUser.banned':      1,
          'targetUser.isSuspended': 1,
          'targetUser.suspendedUntil': 1,
          'targetUser.warnings':    1,
        },
      },
    ];

    const [results, totalArr] = await Promise.all([
      User.aggregate(pipeline),
      User.aggregate([
        { $match: { reportedUsers: { $exists: true, $ne: [] } } },
        { $unwind: '$reportedUsers' },
        { $group: { _id: '$reportedUsers.user' } },
        { $count: 'total' },
      ]),
    ]);

    const total = totalArr[0]?.total || 0;
    res.json({ success: true, reportedUsers: results, total, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.delete('/admin/:id', protect, adminOnly, deleteUserAdmin);
router.put('/admin/:id/toggle-admin', protect, adminOnly, toggleAdmin);
router.put('/admin/:id/toggle-verify', protect, adminOnly, async (req, res) => {
  try {
    const User = require('../models/User');
    const Notification = require('../models/Notification');
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isVerified = !user.isVerified;
    await user.save({ validateBeforeSave: false });
    // Notify user when they become verified
    if (user.isVerified) {
      await Notification.create({
        recipient: user._id,
        fromUser:  req.user._id,
        type:      'verified',
        link:      `/profile/${user._id}`,
      });
    }
    res.json({ success: true, isVerified: user.isVerified });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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

// PUT /api/users/me/cover — upload or remove profile cover image
router.put('/me/cover', protect, upload.single('cover'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Remove existing cover from Cloudinary if present
    if (req.body.remove === 'true' || req.body.remove === true) {
      if (user.coverImagePublicId) {
        const { cloudinary } = require('../utils/cloudinary');
        await cloudinary.uploader.destroy(user.coverImagePublicId).catch(() => {});
      }
      user.coverImage = '';
      user.coverImagePublicId = '';
      await user.save({ validateBeforeSave: false });
      return res.json({ success: true, coverImage: '' });
    }

    if (req.file) {
      // Delete old cover
      if (user.coverImagePublicId) {
        const { cloudinary } = require('../utils/cloudinary');
        await cloudinary.uploader.destroy(user.coverImagePublicId).catch(() => {});
      }
      user.coverImage = req.file.path;
      user.coverImagePublicId = req.file.filename;
      await user.save({ validateBeforeSave: false });
      return res.json({ success: true, coverImage: user.coverImage });
    }

    res.status(400).json({ success: false, message: 'No file uploaded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/me/following-data — returns following users + followedTopics + mutedUsers
router.get('/me/following-data', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('following followedTopics mutedUsers')
      .populate('following', 'name avatar bio isVerified isAdmin followers')
      .populate('mutedUsers', 'name avatar bio isVerified isAdmin');
    res.json({
      success: true,
      following: user.following || [],
      followedTopics: user.followedTopics || [],
      mutedUsers: user.mutedUsers || [],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users/topics/follow — toggle follow/unfollow a topic (must be before /:id/follow)
router.post('/topics/follow', protect, async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic?.trim()) return res.status(400).json({ success: false, message: 'Topic required' });
    const name = topic.trim();
    const user = await User.findById(req.user._id).select('followedTopics');
    const topics = user.followedTopics || [];
    const isFollowing = topics.some(t => t.toLowerCase() === name.toLowerCase());
    let updated;
    if (isFollowing) {
      updated = await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { followedTopics: name } },
        { new: true }
      ).select('followedTopics');
    } else {
      updated = await User.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { followedTopics: name } },
        { new: true }
      ).select('followedTopics');
    }
    res.json({ success: true, followedTopics: updated.followedTopics || [], following: !isFollowing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/suggestions — users you might want to follow
router.get('/suggestions', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).select('following mutedUsers');
    const followingIds = (currentUser.following || []).map(id => id.toString());
    const mutedIds = (currentUser.mutedUsers || []).map(id => id.toString());
    const excludeIds = [...followingIds, ...mutedIds, req.user._id.toString()];
    const suggestions = await User.find({ _id: { $nin: excludeIds }, banned: false })
      .select('name avatar bio isVerified isAdmin followers')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ success: true, suggestions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/users/me/history — clear all reading history
router.delete('/me/history', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { readingHistory: [] } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/follow', protect, checkRestrictions, followUser);

// POST /api/users/:id/block — toggle block/unblock a user
router.post('/:id/block', protect, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot block yourself' });
    }
    const user = await User.findById(req.user._id).select('blockedUsers');
    const isBlocked = (user.blockedUsers || []).some(id => id.toString() === targetId);
    if (isBlocked) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { blockedUsers: targetId } });
    } else {
      // Block also unfollows in both directions
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { blockedUsers: targetId },
        $pull:     { following: targetId },
      });
      await User.findByIdAndUpdate(targetId, {
        $pull: { followers: req.user._id, following: req.user._id },
      });
    }
    res.json({ success: true, blocked: !isBlocked });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users/:id/report — report a user
router.post('/:id/report', protect, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot report yourself' });
    }
    const { reason = 'No reason given' } = req.body;
    // Store report on the reporter's record (to prevent duplicate reports)
    const reporter = await User.findById(req.user._id).select('reportedUsers');
    const alreadyReported = (reporter.reportedUsers || []).some(r => r.user?.toString() === targetId);
    if (alreadyReported) {
      return res.status(400).json({ success: false, message: 'You have already reported this user' });
    }
    await User.findByIdAndUpdate(req.user._id, {
      $push: { reportedUsers: { user: targetId, reason } },
    });
    res.json({ success: true, message: 'User reported. Our team will review this shortly.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users/:id/mute — toggle mute/unmute a user
router.post('/:id/mute', protect, async (req, res) => {
  try {
    const targetId = req.params.id;
    const user = await User.findById(req.user._id).select('mutedUsers');
    const isMuted = (user.mutedUsers || []).some(id => id.toString() === targetId);
    let updated;
    if (isMuted) {
      updated = await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { mutedUsers: targetId } },
        { new: true }
      ).select('mutedUsers');
    } else {
      updated = await User.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { mutedUsers: targetId } },
        { new: true }
      ).select('mutedUsers');
    }
    res.json({ success: true, muted: !isMuted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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
      .populate({ path: 'savedPosts', populate: { path: 'author', select: 'name avatar isAdmin isVerified' } });
    res.json({ success: true, savedPosts: user.savedPosts || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Record a post as read (upsert — moves to front, keeps latest 50)
router.post('/history/:postId', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const postId = req.params.postId;
    const user = await User.findById(req.user._id).select('readingHistory');

    // Remove any existing entry for this post, then prepend
    user.readingHistory = user.readingHistory.filter(
      e => e.post.toString() !== postId
    );
    user.readingHistory.unshift({ post: postId, readAt: new Date() });

    // Keep only the 50 most recent entries
    if (user.readingHistory.length > 50) {
      user.readingHistory = user.readingHistory.slice(0, 50);
    }

    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get current user's reading history
router.get('/me/history', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id)
      .populate({
        path: 'readingHistory.post',
        select: 'title slug excerpt coverImage readTime createdAt author',
        populate: { path: 'author', select: 'name avatar isAdmin isVerified' },
      });
    // Filter out entries whose post was deleted
    const history = (user.readingHistory || [])
      .filter(e => e.post != null)
      .map(e => ({ ...e.post.toObject(), readAt: e.readAt }));
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get any user's public activity (their comments on other stories) — public
router.get('/:id/activity', async (req, res) => {
  try {
    const Comment = require('../models/Comment');
    const comments = await Comment.find({ author: req.params.id, isHidden: false })
      .populate({
        path: 'post',
        select: 'title slug coverImage readTime',
        populate: { path: 'author', select: 'name avatar isVerified' },
      })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json({ success: true, activity: comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get current user's responses (comments they wrote)
router.get('/me/responses', protect, async (req, res) => {
  try {
    const Comment = require('../models/Comment');
    const comments = await Comment.find({ author: req.user._id, isHidden: false })
      .populate({
        path: 'post',
        select: 'title slug coverImage readTime',
        populate: { path: 'author', select: 'name avatar' },
      })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, responses: comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Pin / Unpin a post on own profile ─────────────────────────────────────────
const MAX_PINS = 3;

router.post('/me/pin/:postId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('pinnedPosts');
    const postId = req.params.postId;

    // Verify the post belongs to this user
    const Post = require('../models/Post');
    const post = await Post.findOne({ _id: postId, author: req.user._id, published: true });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const pinned = (user.pinnedPosts || []).map(id => id.toString());
    if (pinned.includes(postId)) {
      return res.json({ success: true, pinnedPostIds: pinned }); // already pinned
    }
    if (pinned.length >= MAX_PINS) {
      return res.status(400).json({ success: false, message: `You can pin up to ${MAX_PINS} stories` });
    }

    // Prepend so most-recently pinned is first
    await User.findByIdAndUpdate(req.user._id, { $push: { pinnedPosts: { $each: [postId], $position: 0 } } });
    res.json({ success: true, pinnedPostIds: [postId, ...pinned] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/me/pin/:postId', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { pinnedPosts: req.params.postId } },
      { new: true }
    ).select('pinnedPosts');
    const pinnedPostIds = (user.pinnedPosts || []).map(id => id.toString());
    res.json({ success: true, pinnedPostIds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Public
router.get('/:id', getUserProfile);

module.exports = router;

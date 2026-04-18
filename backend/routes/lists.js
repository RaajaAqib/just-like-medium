const express = require('express');
const router  = express.Router();
const List    = require('../models/List');
const { protect, optionalAuth } = require('../middleware/auth');

// ── Create a list ─────────────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, isPrivate = true } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required' });
    const list = await List.create({ name: name.trim(), description: description?.trim() || '', isPrivate, owner: req.user._id });
    res.status(201).json({ success: true, list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Get current user's lists ──────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const lists = await List.find({ owner: req.user._id })
      .populate({ path: 'posts', select: '_id coverImage' })
      .sort({ updatedAt: -1 });
    res.json({ success: true, lists });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/lists/:id/save — toggle save/unsave a list ─────────────────────
router.post('/:id/save', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).json({ success: false, message: 'List not found' });
    if (list.isPrivate && list.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Cannot save a private list' });
    }
    const user = await User.findById(req.user._id).select('savedLists');
    const alreadySaved = (user.savedLists || []).some(id => id.toString() === req.params.id);
    if (alreadySaved) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { savedLists: req.params.id } });
    } else {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { savedLists: req.params.id } });
    }
    res.json({ success: true, saved: !alreadySaved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/lists/me/saved — get all lists the current user saved ────────────
router.get('/me/saved', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id)
      .select('savedLists')
      .populate({
        path: 'savedLists',
        populate: [
          { path: 'owner', select: 'name avatar isVerified' },
          { path: 'posts', select: '_id coverImage' },
        ],
      });
    res.json({ success: true, lists: user.savedLists || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Get public lists for any user (profile page) ─────────────────────────────
router.get('/user/:userId', async (req, res) => {
  try {
    const lists = await List.find({ owner: req.params.userId, isPrivate: false })
      .populate({ path: 'posts', select: '_id coverImage title' })
      .sort({ updatedAt: -1 });
    res.json({ success: true, lists });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Get a single list (public or owned) ──────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const list = await List.findById(req.params.id)
      .populate('owner', 'name avatar isAdmin isVerified')
      .populate({
        path: 'posts',
        select: 'title slug excerpt coverImage readTime createdAt tags likes claps author',
        populate: { path: 'author', select: 'name avatar isAdmin isVerified' },
      });
    if (!list) return res.status(404).json({ success: false, message: 'List not found' });
    const ownerId = list.owner._id.toString();
    const viewerId = req.user?._id?.toString();
    if (list.isPrivate && ownerId !== viewerId) {
      return res.status(403).json({ success: false, message: 'This list is private' });
    }
    res.json({ success: true, list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Update list (name / description / privacy) ────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.params.id, owner: req.user._id });
    if (!list) return res.status(404).json({ success: false, message: 'List not found' });
    const { name, description, isPrivate } = req.body;
    if (name !== undefined) list.name = name.trim();
    if (description !== undefined) list.description = description.trim();
    if (isPrivate !== undefined) list.isPrivate = isPrivate;
    await list.save();
    res.json({ success: true, list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Delete a list ─────────────────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const list = await List.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!list) return res.status(404).json({ success: false, message: 'List not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Add a post to a list ──────────────────────────────────────────────────────
router.post('/:id/posts/:postId', protect, async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.params.id, owner: req.user._id });
    if (!list) return res.status(404).json({ success: false, message: 'List not found' });
    const already = list.posts.some(p => p.toString() === req.params.postId);
    if (!already) {
      list.posts.push(req.params.postId);
      await list.save();
      // Notify post author (not self-save)
      try {
        const Post = require('../models/Post');
        const Notification = require('../models/Notification');
        const post = await Post.findById(req.params.postId).select('author title slug');
        if (post && post.author.toString() !== req.user._id.toString()) {
          await Notification.create({
            recipient: post.author,
            fromUser:  req.user._id,
            type:      'save',
            post:      post._id,
            postTitle: post.title,
            postSlug:  post.slug,
            link:      `/article/${post.slug}`,
          });
        }
      } catch (_) {} // non-critical
    } else {
      await list.save();
    }
    res.json({ success: true, added: !already });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Remove a post from a list ─────────────────────────────────────────────────
router.delete('/:id/posts/:postId', protect, async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.params.id, owner: req.user._id });
    if (!list) return res.status(404).json({ success: false, message: 'List not found' });
    list.posts = list.posts.filter(p => p.toString() !== req.params.postId);
    await list.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

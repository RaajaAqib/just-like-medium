const Appeal       = require('../models/Appeal');
const User         = require('../models/User');
const Notification = require('../models/Notification');

// ─── POST /api/appeals ────────────────────────────────────────────────────────
const createAppeal = async (req, res) => {
  try {
    const { action, commentContent, reason } = req.body;

    if (!action || !commentContent || !reason) {
      return res.status(400).json({ success: false, message: 'action, commentContent, and reason are required' });
    }

    // Prevent duplicate pending appeals for the same action type
    const existing = await Appeal.findOne({ user: req.user._id, action, status: 'pending' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have a pending appeal for this action type' });
    }

    const appeal = await Appeal.create({
      user: req.user._id,
      action,
      commentContent,
      reason,
    });

    await appeal.populate('user', 'name avatar');
    res.status(201).json({ success: true, appeal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/appeals/my ─────────────────────────────────────────────────────
const getMyAppeals = async (req, res) => {
  try {
    const appeals = await Appeal.find({ user: req.user._id })
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, appeals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: GET /api/appeals/admin ───────────────────────────────────────────
const getAppeals = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const query = status !== 'all' ? { status } : {};
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Appeal.countDocuments(query);

    const appeals = await Appeal.find(query)
      .populate('user',       'name avatar email')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      appeals,
      total,
      totalPages:  Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: PUT /api/appeals/admin/:id/approve ───────────────────────────────
const approveAppeal = async (req, res) => {
  try {
    const appeal = await Appeal.findById(req.params.id);
    if (!appeal) return res.status(404).json({ success: false, message: 'Appeal not found' });
    if (appeal.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Appeal already reviewed' });
    }

    // Reverse the moderation action
    if (appeal.action === 'suspend') {
      await User.findByIdAndUpdate(appeal.user, { isSuspended: false, suspendedUntil: null });
    } else if (appeal.action === 'ban') {
      await User.findByIdAndUpdate(appeal.user, { banned: false, banReason: '' });
    } else if (appeal.action === 'warn') {
      // Remove the most-recent warning
      await User.findByIdAndUpdate(appeal.user, { $pop: { warnings: 1 } });
    }

    await Notification.create({
      recipient:        appeal.user,
      fromUser:         req.user._id,
      type:             'moderation',
      moderationAction: 'appeal_approved',
    });

    appeal.status     = 'approved';
    appeal.adminNote  = req.body.note || '';
    appeal.reviewedBy = req.user._id;
    appeal.reviewedAt = new Date();
    await appeal.save();

    res.json({ success: true, message: 'Appeal approved — moderation action reversed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: PUT /api/appeals/admin/:id/reject ────────────────────────────────
const rejectAppeal = async (req, res) => {
  try {
    const appeal = await Appeal.findById(req.params.id);
    if (!appeal) return res.status(404).json({ success: false, message: 'Appeal not found' });
    if (appeal.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Appeal already reviewed' });
    }

    await Notification.create({
      recipient:        appeal.user,
      fromUser:         req.user._id,
      type:             'moderation',
      moderationAction: 'appeal_rejected',
    });

    appeal.status     = 'rejected';
    appeal.adminNote  = req.body.note || '';
    appeal.reviewedBy = req.user._id;
    appeal.reviewedAt = new Date();
    await appeal.save();

    res.json({ success: true, message: 'Appeal rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createAppeal, getMyAppeals, getAppeals, approveAppeal, rejectAppeal };

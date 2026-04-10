const User = require('../models/User');

/**
 * Middleware that blocks banned or actively-suspended users from performing
 * write actions (post, comment, like, clap, follow, save).
 * Must be placed AFTER the `protect` middleware so req.user is available.
 */
const checkRestrictions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('banned isSuspended suspendedUntil');
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    if (user.banned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been banned. Contact support to appeal.',
      });
    }

    if (user.isSuspended && user.suspendedUntil && user.suspendedUntil > new Date()) {
      return res.status(403).json({
        success: false,
        message: `Your account is suspended until ${user.suspendedUntil.toLocaleDateString()}. You cannot perform this action.`,
      });
    }

    // Auto-lift expired suspension
    if (user.isSuspended) {
      await User.findByIdAndUpdate(req.user._id, { isSuspended: false, suspendedUntil: null });
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { checkRestrictions };

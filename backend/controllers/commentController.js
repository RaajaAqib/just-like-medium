const Comment      = require('../models/Comment');
const Post         = require('../models/Post');
const User         = require('../models/User');
const Notification = require('../models/Notification');

// ─── GET /api/comments/:postId ────────────────────────────────────────────────
const getComments = async (req, res) => {
  try {
    // Top-level comments, oldest first — exclude auto-hidden content
    const topLevel = await Comment.find({
      post: req.params.postId,
      parentComment: null,
      isHidden: { $ne: true },
    })
      .populate('author', 'name avatar')
      .sort({ createdAt: 1 });

    // All replies for this post, oldest first — exclude auto-hidden
    const allReplies = await Comment.find({
      post: req.params.postId,
      parentComment: { $ne: null },
      isHidden: { $ne: true },
    })
      .populate('author', 'name avatar')
      .sort({ createdAt: 1 });

    // Group replies by parentComment id
    const replyMap = {};
    for (const reply of allReplies) {
      const pid = reply.parentComment.toString();
      if (!replyMap[pid]) replyMap[pid] = [];
      replyMap[pid].push(reply.toObject());
    }

    const comments = topLevel.map((c) => ({
      ...c.toObject(),
      replies: replyMap[c._id.toString()] || [],
    }));

    res.json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/comments/:postId ───────────────────────────────────────────────
const createComment = async (req, res) => {
  try {
    const { content, parentComment } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: req.params.postId,
      author: req.user._id,
      content: content.trim(),
      parentComment: parentComment || null,
    });

    await comment.populate('author', 'name avatar');

    if (parentComment) {
      const parentCommentDoc = await Comment.findById(parentComment).select('author');
      if (parentCommentDoc && parentCommentDoc.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: parentCommentDoc.author,
          fromUser:  req.user._id,
          type:      'comment',
          post:      post._id,
          postTitle: post.title,
          postSlug:  post.slug,
        });
      }
    } else {
      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.author,
          fromUser:  req.user._id,
          type:      'comment',
          post:      post._id,
          postTitle: post.title,
          postSlug:  post.slug,
        });
      }
    }

    res.status(201).json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE /api/comments/:id ─────────────────────────────────────────────────
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Comment.deleteMany({ parentComment: comment._id });
    await comment.deleteOne();

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/comments/:id/like ──────────────────────────────────────────────
const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const userId  = req.user._id;
    const isLiked = comment.likes.some((id) => id.toString() === userId.toString());

    if (isLiked) {
      comment.likes = comment.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      comment.likes.push(userId);
    }

    await comment.save({ validateBeforeSave: false });
    res.json({ success: true, liked: !isLiked, likesCount: comment.likes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/comments/:id/report ───────────────────────────────────────────
const reportComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const userId = req.user._id.toString();
    if (comment.reportedBy.some((id) => id.toString() === userId)) {
      return res.status(400).json({ success: false, message: 'You have already reported this comment' });
    }

    comment.reported          = true;
    comment.reportReason      = req.body.reason || 'No reason given';
    comment.moderationStatus  = 'pending';
    comment.reportedBy.push(req.user._id);

    // Auto-hide when report threshold is reached (5+)
    if (comment.reportedBy.length >= 5) {
      comment.isHidden = true;
    }

    await comment.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Comment reported successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: GET /api/comments/admin/reports ───────────────────────────────────
const getReports = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const query = { reported: true };
    if (status !== 'all') query.moderationStatus = status;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Comment.countDocuments(query);

    const comments = await Comment.find(query)
      .populate('author',      'name avatar email')
      .populate('post',        'title slug')
      .populate('reportedBy',  'name email')
      .populate('moderatedBy', 'name')
      .sort({ 'reportedBy': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      comments,
      total,
      totalPages:  Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: POST /api/comments/admin/:id/dismiss ─────────────────────────────
const dismissReport = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    comment.moderationStatus = 'dismissed';
    comment.reported         = false;
    comment.isHidden         = false;
    comment.moderationNote   = req.body.note || 'Report dismissed — content does not violate guidelines';
    comment.moderatedBy      = req.user._id;
    comment.moderatedAt      = new Date();
    await comment.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Report dismissed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: POST /api/comments/admin/:id/warn ────────────────────────────────
const warnCommentAuthor = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id).populate('post', 'title slug _id');
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const { reason = 'Violation of community guidelines' } = req.body;

    await User.findByIdAndUpdate(comment.author, {
      $push: { warnings: { reason, date: new Date(), adminId: req.user._id } },
    });

    await Notification.create({
      recipient:        comment.author,
      fromUser:         req.user._id,
      type:             'moderation',
      moderationAction: 'warn',
      comment:          comment._id,
      post:             comment.post?._id   || null,
      postTitle:        comment.post?.title || '',
      postSlug:         comment.post?.slug  || '',
    });

    comment.moderationStatus = 'actioned';
    comment.moderationNote   = reason;
    comment.moderatedBy      = req.user._id;
    comment.moderatedAt      = new Date();
    await comment.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Warning sent to user' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: POST /api/comments/admin/:id/suspend ─────────────────────────────
const suspendCommentAuthor = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id).populate('post', 'title slug _id');
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const { days = 7, reason = 'Violation of community guidelines' } = req.body;
    const suspendedUntil = new Date(Date.now() + parseInt(days) * 24 * 60 * 60 * 1000);

    await User.findByIdAndUpdate(comment.author, {
      isSuspended:   true,
      suspendedUntil,
      $push: { warnings: { reason: `Suspended ${days}d: ${reason}`, date: new Date(), adminId: req.user._id } },
    });

    await Notification.create({
      recipient:        comment.author,
      fromUser:         req.user._id,
      type:             'moderation',
      moderationAction: 'suspend',
      comment:          comment._id,
      post:             comment.post?._id   || null,
      postTitle:        comment.post?.title || '',
      postSlug:         comment.post?.slug  || '',
    });

    comment.moderationStatus = 'actioned';
    comment.moderationNote   = `Suspended ${days}d: ${reason}`;
    comment.moderatedBy      = req.user._id;
    comment.moderatedAt      = new Date();
    await comment.save({ validateBeforeSave: false });

    res.json({ success: true, message: `User suspended for ${days} days` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: POST /api/comments/admin/:id/ban ─────────────────────────────────
const banCommentAuthor = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id).populate('post', 'title slug _id');
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const { reason = 'Violation of community guidelines' } = req.body;

    await User.findByIdAndUpdate(comment.author, {
      banned:    true,
      banReason: reason,
    });

    await Notification.create({
      recipient:        comment.author,
      fromUser:         req.user._id,
      type:             'moderation',
      moderationAction: 'ban',
      comment:          comment._id,
      post:             comment.post?._id   || null,
      postTitle:        comment.post?.title || '',
      postSlug:         comment.post?.slug  || '',
    });

    comment.moderationStatus = 'actioned';
    comment.moderationNote   = reason;
    comment.moderatedBy      = req.user._id;
    comment.moderatedAt      = new Date();
    await comment.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'User banned from platform' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: DELETE /api/comments/admin/:id/delete-reported ───────────────────
// Delete comment AND mark moderation status (distinct from owner-delete)
const deleteReportedComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id).populate('post', 'title slug _id');
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const { reason = 'Content violated community guidelines', notifyAuthor = true } = req.body;

    if (notifyAuthor) {
      await Notification.create({
        recipient:        comment.author,
        fromUser:         req.user._id,
        type:             'moderation',
        moderationAction: 'delete',
        post:             comment.post?._id   || null,
        postTitle:        comment.post?.title || '',
        postSlug:         comment.post?.slug  || '',
      });
    }

    await Comment.deleteMany({ parentComment: comment._id });
    await comment.deleteOne();

    res.json({ success: true, message: 'Comment deleted by admin' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getComments,
  createComment,
  deleteComment,
  likeComment,
  reportComment,
  getReports,
  dismissReport,
  warnCommentAuthor,
  suspendCommentAuthor,
  banCommentAuthor,
  deleteReportedComment,
};

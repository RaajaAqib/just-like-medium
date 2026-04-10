const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// GET /api/comments/:postId  — oldest first, replies nested under parents
const getComments = async (req, res) => {
  try {
    // 1. Top-level comments, oldest first
    const topLevel = await Comment.find({ post: req.params.postId, parentComment: null })
      .populate('author', 'name avatar')
      .sort({ createdAt: 1 });

    // 2. All replies for this post, oldest first
    const allReplies = await Comment.find({
      post: req.params.postId,
      parentComment: { $ne: null },
    })
      .populate('author', 'name avatar')
      .sort({ createdAt: 1 });

    // 3. Group replies by parentComment id
    const replyMap = {};
    for (const reply of allReplies) {
      const pid = reply.parentComment.toString();
      if (!replyMap[pid]) replyMap[pid] = [];
      replyMap[pid].push(reply.toObject());
    }

    // 4. Attach replies to their parents
    const comments = topLevel.map((c) => ({
      ...c.toObject(),
      replies: replyMap[c._id.toString()] || [],
    }));

    res.json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/comments/:postId
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
      // Notify the parent comment's author when someone replies (skip self-replies)
      const parentCommentDoc = await Comment.findById(parentComment).select('author');
      if (parentCommentDoc && parentCommentDoc.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: parentCommentDoc.author,
          fromUser: req.user._id,
          type: 'comment',
          post: post._id,
          postTitle: post.title,
          postSlug: post.slug,
        });
      }
    } else {
      // Notify post author on new top-level comment (skip self-comments)
      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.author,
          fromUser: req.user._id,
          type: 'comment',
          post: post._id,
          postTitle: post.title,
          postSlug: post.slug,
        });
      }
    }

    res.status(201).json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/comments/:id
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Also delete any replies to this comment
    await Comment.deleteMany({ parentComment: comment._id });
    await comment.deleteOne();

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/comments/:id/like
const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const userId = req.user._id;
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

// POST /api/comments/:id/report
const reportComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const userId = req.user._id.toString();

    // Prevent duplicate reports from same user
    if (comment.reportedBy.some(id => id.toString() === userId)) {
      return res.status(400).json({ success: false, message: 'You have already reported this comment' });
    }

    comment.reported     = true;
    comment.reportReason = req.body.reason || 'No reason given';
    comment.reportedBy.push(req.user._id);
    await comment.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Comment reported successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getComments, createComment, deleteComment, likeComment, reportComment };

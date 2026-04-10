const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    reported:          { type: Boolean, default: false },
    reportReason:      { type: String,  default: '' },
    reportedBy:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    moderationStatus:  { type: String, enum: ['pending', 'dismissed', 'actioned'] },
    isHidden:          { type: Boolean, default: false },
    moderationNote:    { type: String,  default: '' },
    moderatedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    moderatedAt:       { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);

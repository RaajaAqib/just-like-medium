const mongoose = require('mongoose');

const appealSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Snapshot of the comment content at time of appeal (comment may be deleted)
    commentContent: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    action: {
      type: String,
      enum: ['warn', 'suspend', 'ban', 'delete', 'hide-story', 'delete-story'],
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Appeal reason is required'],
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appeal', appealSchema);

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromUser:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null for system/admin notifications
  type: {
    type: String,
    enum: ['like', 'comment', 'reply', 'follow', 'clap', 'save', 'moderation', 'submission', 'verified'],
    required: true,
  },
  post:      { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
  postTitle: { type: String, default: '' },
  postSlug:  { type: String, default: '' },
  comment:   { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  // Moderation
  moderationAction: { type: String, default: null }, // warn | suspend | ban | delete | appeal_approved | appeal_rejected
  // Submission workflow
  submissionStatus: { type: String, default: null }, // approved | declined | edits-requested | in-review
  submissionNote:   { type: String, default: '' },
  // Custom redirect link (overrides auto-generated link)
  link: { type: String, default: null },
  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['like', 'comment', 'follow', 'clap', 'moderation'], required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
  postTitle: { type: String },
  postSlug:  { type: String },
  moderationAction: { type: String, default: null }, // warn | suspend | ban | delete | appeal_approved | appeal_rejected
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    excerpt: {
      type: String,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    coverImage: {
      type: String,
      default: '',
    },
    coverImagePublicId: {
      type: String,
      default: '',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    claps: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    readTime: {
      type: Number, // in minutes
      default: 1,
    },
    published: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    // ── Moderation ──────────────────────────────────────────────────────────
    reported:         { type: Boolean, default: false },
    reportReason:     { type: String,  default: '' },
    reportedBy:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    moderationStatus: { type: String, enum: ['pending', 'dismissed', 'actioned'] },
    moderationNote:   { type: String, default: '' },
    moderatedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    moderatedAt:      { type: Date, default: null },
  },
  { timestamps: true }
);

// Create excerpt and readTime from content
postSchema.pre('save', function (next) {
  // Generate excerpt from content (strip HTML tags)
  if (this.isModified('content') && !this.excerpt) {
    const plainText = this.content.replace(/<[^>]+>/g, '');
    this.excerpt = plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
  }

  // Calculate read time (avg 200 words/min)
  if (this.isModified('content')) {
    const wordCount = this.content.replace(/<[^>]+>/g, '').split(/\s+/).length;
    this.readTime = Math.max(1, Math.ceil(wordCount / 200));
  }

  next();
});

// Text index for search
postSchema.index({ title: 'text', tags: 'text' });

module.exports = mongoose.model('Post', postSchema);

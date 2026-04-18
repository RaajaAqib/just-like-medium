const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    bio: {
      type: String,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    avatarPublicId: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    coverImagePublicId: {
      type: String,
      default: '',
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    readingHistory: [{
      post:   { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
      readAt: { type: Date, default: Date.now },
    }],
    followedTopics: [{ type: String }],
    mutedUsers:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    blockedUsers:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    savedLists:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'List' }],
    reportedUsers:  [{
      user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason:    { type: String },
      createdAt: { type: Date, default: Date.now },
    }],
    banned:           { type: Boolean, default: false },
    banReason:        { type: String,  default: '' },
    isSuspended:      { type: Boolean, default: false },
    suspendedUntil:   { type: Date,    default: null },
    warnings:         [{
      reason:  { type: String },
      date:    { type: Date, default: Date.now },
      adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    }],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

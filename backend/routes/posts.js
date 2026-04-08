const express = require('express');
const router = express.Router();
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  clapPost,
  getAllPostsAdmin,
} = require('../controllers/postController');
const { protect, optionalAuth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const { upload } = require('../utils/cloudinary');

// Admin
router.get('/admin/all', protect, adminOnly, getAllPostsAdmin);

// Public
router.get('/', getPosts);
router.get('/:slug', optionalAuth, getPost);

// Protected
router.post('/', protect, upload.single('coverImage'), createPost);
router.put('/:id', protect, upload.single('coverImage'), updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);
router.post('/:id/clap', protect, clapPost);

module.exports = router;

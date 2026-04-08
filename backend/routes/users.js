const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  changePassword,
  followUser,
  getAllUsersAdmin,
  deleteUserAdmin,
  toggleAdmin,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const { upload } = require('../utils/cloudinary');

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllUsersAdmin);
router.delete('/admin/:id', protect, adminOnly, deleteUserAdmin);
router.put('/admin/:id/toggle-admin', protect, adminOnly, toggleAdmin);

// Protected
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/:id/follow', protect, followUser);

// Public
router.get('/:id', getUserProfile);

module.exports = router;

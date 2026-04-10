const express = require('express');
const router  = express.Router();
const {
  createAppeal,
  getMyAppeals,
  getAppeals,
  approveAppeal,
  rejectAppeal,
} = require('../controllers/appealController');
const { protect }   = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

router.post('/',                    protect, createAppeal);
router.get('/my',                   protect, getMyAppeals);
router.get('/admin',                protect, adminOnly, getAppeals);
router.put('/admin/:id/approve',    protect, adminOnly, approveAppeal);
router.put('/admin/:id/reject',     protect, adminOnly, rejectAppeal);

module.exports = router;

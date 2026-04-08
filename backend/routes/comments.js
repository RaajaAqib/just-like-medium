const express = require('express');
const router = express.Router();
const { getComments, createComment, deleteComment, likeComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.get('/:postId', getComments);
router.post('/:postId', protect, createComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, likeComment);

module.exports = router;

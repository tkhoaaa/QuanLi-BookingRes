const express = require('express');
const router = express.Router();
const adminReviewController = require('../controllers/adminReview.controller');
const { verifyToken, restrictTo } = require('../middlewares/auth.middleware');

router.use(verifyToken, restrictTo('admin'));

router.get('/', adminReviewController.getAllReviews);
router.post('/:id/reply', adminReviewController.replyToReview);
router.delete('/:id', adminReviewController.deleteReview);

module.exports = router;

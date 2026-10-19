const router = require('express').Router();
const { deleteReview, getAllReviews } = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, getAllReviews);
router.delete('/:id', protect, deleteReview);

module.exports = router;

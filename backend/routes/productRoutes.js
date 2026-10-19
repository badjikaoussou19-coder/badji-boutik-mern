const router = require('express').Router();
const c = require('../controllers/productController');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');
const r = require('../controllers/reviewController');
const upload = require('../middleware/upload');

router.get('/', optionalAuth, c.getProducts);
router.post('/upload', protect, adminOnly, upload.single('image'), c.uploadImage); // avant /:id
router.get('/:id', optionalAuth, c.getProduct);
router.get('/:id/related', c.getRelated);
router.get('/:id/reviews', r.getProductReviews);
router.post('/:id/reviews', protect, r.saveReview);
router.post('/:id/duplicate', protect, adminOnly, c.duplicateProduct);
router.post('/', protect, adminOnly, c.createProduct);
router.put('/:id', protect, adminOnly, c.updateProduct);
router.delete('/:id', protect, adminOnly, c.deleteProduct);

module.exports = router;

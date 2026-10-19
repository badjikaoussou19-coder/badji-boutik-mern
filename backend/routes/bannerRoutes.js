const router = require('express').Router();
const c = require('../controllers/bannerController');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, c.getBanners);
router.post('/', protect, adminOnly, c.createBanner);
router.put('/:id', protect, adminOnly, c.updateBanner);
router.delete('/:id', protect, adminOnly, c.deleteBanner);

module.exports = router;

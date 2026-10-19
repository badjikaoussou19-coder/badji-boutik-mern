const router = require('express').Router();
const { getStats, getSummary } = require('../controllers/statsController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, getStats);
router.get('/summary', protect, adminOnly, getSummary);

module.exports = router;

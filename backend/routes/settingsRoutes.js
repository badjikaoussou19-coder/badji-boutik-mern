const router = require('express').Router();
const c = require('../controllers/settingsController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', c.getSettings);
router.put('/', protect, adminOnly, c.updateSettings);

module.exports = router;

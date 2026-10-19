const router = require('express').Router();
const c = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, c.getUsers);
router.get('/:id', protect, adminOnly, c.getUser);
router.put('/:id', protect, adminOnly, c.updateUser);

module.exports = router;

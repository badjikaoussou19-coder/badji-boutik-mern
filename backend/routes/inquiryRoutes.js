const router = require('express').Router();
const c = require('../controllers/inquiryController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', protect, c.createInquiry);
router.get('/mine', protect, c.getMyInquiries); // avant /:id
router.get('/', protect, adminOnly, c.getInquiries);
router.get('/:id', protect, c.getInquiry);
router.post('/:id/messages', protect, c.addMessage);
router.put('/:id', protect, adminOnly, c.updateInquiry);

module.exports = router;

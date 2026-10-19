const router = require('express').Router();
const c = require('../controllers/supplierController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get('/', c.getSuppliers);
router.post('/', c.createSupplier);
router.put('/:id', c.updateSupplier);
router.delete('/:id', c.deleteSupplier);

module.exports = router;

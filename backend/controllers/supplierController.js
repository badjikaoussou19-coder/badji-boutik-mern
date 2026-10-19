const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

const FIELDS = ['name', 'verified', 'city', 'country', 'yearsActive', 'rating', 'responseHours', 'onTimeRate', 'repurchaseRate', 'markets'];

const pick = (body) => {
  const out = {};
  FIELDS.forEach((f) => body[f] !== undefined && (out[f] = body[f]));
  if (typeof out.markets === 'string') out.markets = out.markets.split(',').map((s) => s.trim()).filter(Boolean);
  return out;
};

// GET /api/suppliers (admin) — avec le nombre de produits
exports.getSuppliers = asyncHandler(async (req, res) => {
  const [list, counts] = await Promise.all([
    Supplier.find().sort('name').lean(),
    Product.aggregate([{ $match: { supplier: { $ne: null } } }, { $group: { _id: '$supplier', count: { $sum: 1 } } }]),
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json(list.map((s) => ({ ...s, products: map.get(String(s._id)) || 0 })));
});

exports.createSupplier = asyncHandler(async (req, res) => res.status(201).json(await Supplier.create(pick(req.body))));

exports.updateSupplier = asyncHandler(async (req, res) => {
  const s = await Supplier.findById(req.params.id);
  if (!s) {
    res.status(404);
    throw new Error('Vendeur introuvable');
  }
  Object.entries(pick(req.body)).forEach(([k, v]) => (s[k] = v));
  await s.save();
  res.json(s);
});

exports.deleteSupplier = asyncHandler(async (req, res) => {
  const s = await Supplier.findById(req.params.id);
  if (!s) {
    res.status(404);
    throw new Error('Vendeur introuvable');
  }
  await Product.updateMany({ supplier: s._id }, { supplier: null });
  await s.deleteOne();
  res.json({ message: 'Vendeur supprimé' });
});

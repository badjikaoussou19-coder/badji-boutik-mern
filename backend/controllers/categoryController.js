const Category = require('../models/Category');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/categories — avec le nombre de produits visibles (menus et filtres)
exports.getCategories = asyncHandler(async (req, res) => {
  const [cats, counts] = await Promise.all([
    Category.find().sort('name').lean(),
    Product.aggregate([{ $match: { published: { $ne: false } } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json(cats.map((c) => ({ ...c, count: map.get(String(c._id)) || 0 })));
});

// POST /api/categories (admin)
exports.createCategory = asyncHandler(async (req, res) => {
  res.status(201).json(await Category.create({ name: req.body.name, icon: req.body.icon || '' }));
});

// PUT /api/categories/:id (admin)
exports.updateCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) {
    res.status(404);
    throw new Error('Catégorie introuvable');
  }
  if (req.body.name !== undefined) cat.name = req.body.name;
  if (req.body.icon !== undefined) cat.icon = req.body.icon;
  await cat.save();
  res.json(cat);
});

// DELETE /api/categories/:id (admin)
exports.deleteCategory = asyncHandler(async (req, res) => {
  if (await Product.exists({ category: req.params.id })) {
    res.status(400);
    throw new Error('Impossible de supprimer : des produits utilisent cette catégorie');
  }
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Catégorie supprimée' });
});

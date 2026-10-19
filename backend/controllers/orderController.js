const Order = require('../models/Order');
const Product = require('../models/Product');
const Counter = require('../models/Counter');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { evaluateCoupon } = require('../utils/coupon');
const { computeShipping } = require('../utils/pricing');
const asyncHandler = require('../utils/asyncHandler');

const nextOrderNumber = async () => {
  const c = await Counter.findOneAndUpdate({ _id: 'order' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return 1000 + c.seq; // #1001, #1002, ...
};

const giveBackStock = async (items) => {
  for (const it of items) await Product.updateOne({ _id: it.product }, { $inc: { stock: it.quantity, sold: -it.quantity } });
};

const releaseCoupon = (filter) => Coupon.updateOne({ ...filter, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });

// POST /api/orders — le prix (y compris les prix dégressifs), la livraison et le total sont recalculés côté serveur
exports.createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Le panier est vide');
  }
  const a = shippingAddress || {};
  if (!a.fullName || !a.phone || !a.address || !a.city) {
    res.status(400);
    throw new Error('Adresse de livraison incomplète');
  }

  const wanted = new Map();
  for (const i of items) {
    const q = parseInt(i.quantity, 10);
    if (!i.product || !(q > 0)) {
      res.status(400);
      throw new Error('Article invalide dans le panier');
    }
    wanted.set(String(i.product), (wanted.get(String(i.product)) || 0) + q);
  }

  const settings = await Settings.get();
  const reserved = [];
  let claimed = null;
  try {
    const orderItems = [];
    const shipItems = [];
    for (const [id, qty] of wanted) {
      const current = await Product.findById(id);
      if (!current || current.published === false) {
        res.status(400);
        throw new Error('Un produit du panier est introuvable');
      }
      if (qty < (current.moq || 1)) {
        res.status(400);
        throw new Error(`Quantité minimum de ${current.moq} pour « ${current.name} »`);
      }
      // décrémente le stock seulement s'il est suffisant (opération atomique)
      const p = await Product.findOneAndUpdate({ _id: id, stock: { $gte: qty } }, { $inc: { stock: -qty, sold: qty } }, { new: true });
      if (!p) {
        res.status(400);
        throw new Error(`Stock insuffisant pour « ${current.name} » (${current.stock} disponible)`);
      }
      reserved.push({ product: p._id, quantity: qty });
      orderItems.push({ product: p._id, name: p.name, price: p.unitPrice(qty), image: p.image, quantity: qty });
      shipItems.push({ freeShipping: p.freeShipping });
    }

    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // Code promo : vérifié et recalculé côté serveur, utilisation réservée de façon atomique
    let discount = 0;
    let couponCode = '';
    if (req.body.couponCode) {
      const coupon = await Coupon.findOne({ code: String(req.body.couponCode).trim().toUpperCase() });
      const r = evaluateCoupon(coupon, subtotal);
      if (!r.ok) {
        res.status(400);
        throw new Error(r.message);
      }
      claimed = await Coupon.findOneAndUpdate(
        { _id: coupon._id, active: true, $or: [{ maxUses: 0 }, { $expr: { $lt: ['$usedCount', '$maxUses'] } }] },
        { $inc: { usedCount: 1 } },
        { new: true }
      );
      if (!claimed) {
        res.status(400);
        throw new Error("Ce code promo n'est plus disponible");
      }
      discount = r.discount;
      couponCode = coupon.code;
    }

    const shippingFee = computeShipping(settings, shipItems, subtotal);
    const paymentMethod = Order.PAYMENTS.includes(req.body.paymentMethod) ? req.body.paymentMethod : Order.PAYMENTS[0];

    const order = await Order.create({
      orderNumber: await nextOrderNumber(),
      user: req.user._id,
      items: orderItems,
      subtotal,
      discount,
      couponCode,
      shippingFee,
      paymentMethod,
      totalAmount: subtotal - discount + shippingFee,
      shippingAddress: { fullName: a.fullName, phone: a.phone, address: a.address, city: a.city },
      history: [{ status: 'En attente' }],
    });
    res.status(201).json(order);
  } catch (err) {
    await giveBackStock(reserved);
    if (claimed) await releaseCoupon({ _id: claimed._id });
    throw err;
  }
});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Construit le filtre des commandes (admin) : statut, recherche (n°, client), période
async function orderFilter(q) {
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.from || q.to) {
    filter.createdAt = {};
    if (q.from) filter.createdAt.$gte = new Date(q.from);
    if (q.to) filter.createdAt.$lte = new Date(new Date(q.to).getTime() + 86400000 - 1);
  }
  const term = String(q.q || '').trim().replace(/^#/, '');
  if (term) {
    const or = [];
    if (/^\d+$/.test(term)) or.push({ orderNumber: Number(term) });
    const rx = { $regex: escapeRegex(term), $options: 'i' };
    const users = await User.find({ $or: [{ name: rx }, { email: rx }] }).select('_id').limit(100);
    if (users.length) or.push({ user: { $in: users.map((u) => u._id) } });
    or.push({ 'shippingAddress.fullName': rx }, { 'shippingAddress.phone': rx });
    filter.$or = or;
  }
  return filter;
}

// GET /api/orders (admin) — toutes les commandes (tableau) ou paginées avec ?page=
exports.getOrders = asyncHandler(async (req, res) => {
  const filter = await orderFilter(req.query);
  const query = Order.find(filter).sort('-createdAt').populate('user', 'name email phone');
  if (!req.query.page) return res.json(await query);

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 15, 1), 100);
  const { status, ...withoutStatus } = req.query; // les compteurs par statut ignorent le filtre de statut
  const [total, byStatus] = await Promise.all([
    Order.countDocuments(filter),
    Order.aggregate([{ $match: await orderFilter(withoutStatus) }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  const pages = Math.max(Math.ceil(total / limit), 1);
  const page = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), pages);
  const items = await query.skip((page - 1) * limit).limit(limit);
  res.json({ items, total, page, pages, counts: Object.fromEntries(byStatus.map((s) => [s._id, s.count])) });
});

// GET /api/orders/export (admin) — fichier CSV (ouvrable dans Excel)
exports.exportOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find(await orderFilter(req.query)).sort('-createdAt').populate('user', 'name email');
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['N°', 'Date', 'Client', 'Email', 'Téléphone', 'Ville', 'Articles', 'Sous-total', 'Remise', 'Livraison', 'Total', 'Statut', 'Paiement'];
  const rows = orders.map((o) =>
    [
      o.orderNumber,
      o.createdAt.toISOString().slice(0, 10),
      o.shippingAddress.fullName,
      o.user?.email || '',
      o.shippingAddress.phone,
      o.shippingAddress.city,
      o.items.map((i) => `${i.name} x${i.quantity}`).join(' | '),
      o.subtotal,
      o.discount,
      o.shippingFee || 0,
      o.totalAmount,
      o.status,
      o.paymentMethod || '',
    ]
      .map(cell)
      .join(';')
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="commandes.csv"');
  res.send('\ufeff' + [head.map(cell).join(';'), ...rows].join('\r\n'));
});

// GET /api/orders/mine — commandes du client connecté
exports.getMyOrders = asyncHandler(async (req, res) => {
  res.json(await Order.find({ user: req.user._id }).sort('-createdAt'));
});

// GET /api/orders/:id
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) {
    res.status(404);
    throw new Error('Commande introuvable');
  }
  if (req.user.role !== 'admin' && String(order.user._id) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Vous n'avez pas accès à cette commande");
  }
  res.json(order);
});

// PUT /api/orders/:id — admin : change le statut et/ou la note interne ; client : annule une commande « En attente »
exports.updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Commande introuvable');
  }
  const { status, adminNote } = req.body;

  if (req.user.role === 'admin' && adminNote !== undefined) {
    order.adminNote = String(adminNote).slice(0, 1000);
    if (status === undefined) {
      await order.save();
      return res.json(order);
    }
  }
  if (!Order.STATUSES.includes(status)) {
    res.status(400);
    throw new Error(`Statut invalide. Valeurs possibles : ${Order.STATUSES.join(', ')}`);
  }

  if (req.user.role !== 'admin') {
    if (String(order.user) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Vous n'avez pas accès à cette commande");
    }
    if (status !== 'Annulée' || order.status !== 'En attente') {
      res.status(403);
      throw new Error('Vous pouvez uniquement annuler une commande en attente');
    }
  }
  if (order.status === 'Annulée') {
    res.status(400);
    throw new Error('Une commande annulée ne peut plus être modifiée');
  }
  if (order.status === 'Livrée' && status === 'Annulée') {
    res.status(400);
    throw new Error('Une commande livrée ne peut pas être annulée');
  }

  if (status === 'Annulée') {
    await giveBackStock(order.items); // le stock est remis en vente
    if (order.couponCode) await releaseCoupon({ code: order.couponCode }); // l'utilisation du code est rendue
  }
  if (order.status !== status) {
    order.status = status;
    order.history.push({ status });
  }
  await order.save();
  res.json(order);
});

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// Vérifie le token JWT et charge l'utilisateur
exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Non autorisé : veuillez vous connecter');
  }
  let decoded;
  try {
    decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    res.status(401);
    throw new Error('Session expirée, veuillez vous reconnecter');
  }
  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error('Utilisateur introuvable');
  }
  if (user.blocked) {
    res.status(403);
    throw new Error('Ce compte est suspendu. Contactez le support.');
  }
  req.user = user;
  next();
});

// Charge l'utilisateur s'il y a un token valide, sans jamais refuser la requête
exports.optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && !user.blocked) req.user = user;
    } catch {
      /* token invalide : on continue comme visiteur */
    }
  }
  next();
});

// Gestion des rôles : réservé à l'administrateur
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403);
  throw new Error("Accès réservé à l'administrateur");
};

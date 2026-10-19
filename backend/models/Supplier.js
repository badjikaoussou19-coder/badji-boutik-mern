const mongoose = require('mongoose');

// Vendeur / fournisseur affiché sur la fiche produit (style Alibaba)
const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Le nom du vendeur est obligatoire'], unique: true, trim: true },
    verified: { type: Boolean, default: false },
    city: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'Sénégal' },
    yearsActive: { type: Number, min: 0, default: 1 },
    rating: { type: Number, min: 0, max: 5, default: 5 },
    responseHours: { type: Number, min: 0, default: 4 }, // temps de réponse moyen (heures)
    onTimeRate: { type: Number, min: 0, max: 100, default: 95 }, // livraisons dans les délais (%)
    repurchaseRate: { type: Number, min: 0, max: 100, default: 20 }, // taux de réachat (%)
    markets: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);

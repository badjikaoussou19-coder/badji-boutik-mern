const mongoose = require('mongoose');

// Réglages de la boutique (un seul document)
const settingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'main' },
    shopName: { type: String, default: 'Boutik' },
    announcement: { type: String, default: '' }, // bandeau en haut du site (vide = masqué)
    shippingFee: { type: Number, min: 0, default: 0 }, // frais de livraison standard (FCFA)
    freeShippingThreshold: { type: Number, min: 0, default: 0 }, // 0 = pas de seuil
    returnDays: { type: Number, min: 0, default: 7 },
    supportPhone: { type: String, default: '' },
    supportEmail: { type: String, default: '' },
    lowStockThreshold: { type: Number, min: 0, default: 5 },
  },
  { timestamps: true }
);

settingsSchema.statics.get = async function () {
  return (await this.findById('main')) || new this({ _id: 'main' });
};

module.exports = mongoose.model('Settings', settingsSchema);

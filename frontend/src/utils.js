export const fcfa = (n) => `${new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))} FCFA`;
export const num = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

export const formatDateTime = (d) =>
  new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export const STATUSES = ['En attente', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée'];
export const PAYMENTS = ['Paiement à la livraison (espèces)', 'Wave à la livraison', 'Orange Money à la livraison'];

// Prix unitaire selon la quantité (prix dégressifs) — même règle que le serveur
export const unitPriceFor = (item, qty) => {
  let price = item.price;
  let best = 0;
  for (const t of item.priceTiers || []) if (qty >= t.minQty && t.minQty > best) { best = t.minQty; price = t.price; }
  return price;
};

// Frais de livraison — même règle que le serveur (aperçu seulement, le serveur recalcule)
export const shippingFor = (settings, items, subtotal) => {
  const fee = settings?.shippingFee || 0;
  if (fee <= 0 || items.length === 0) return 0;
  if (items.every((i) => i.freeShipping)) return 0;
  const threshold = settings?.freeShippingThreshold || 0;
  return threshold > 0 && subtotal >= threshold ? 0 : fee;
};

// Vente flash encore active ?
export const flashActive = (p) => Boolean(p?.flashSaleEnds && new Date(p.flashSaleEnds) > new Date());

// Fourchette de prix affichée quand il y a des prix dégressifs
export const priceRange = (p) => {
  const prices = [p.price, ...(p.priceTiers || []).map((t) => t.price)];
  return { min: Math.min(...prices), max: Math.max(...prices), tiered: (p.priceTiers || []).length > 0 };
};

export const compact = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.', ',')} k` : String(n || 0));

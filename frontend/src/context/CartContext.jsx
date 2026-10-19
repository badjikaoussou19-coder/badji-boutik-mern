import { createContext, useContext, useEffect, useState } from 'react';
import { unitPriceFor } from '../utils.js';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const snapshot = (p, quantity) => ({
  _id: p._id,
  name: p.name,
  price: p.price,
  image: p.image,
  stock: p.stock,
  moq: p.moq || 1,
  priceTiers: p.priceTiers || [],
  freeShipping: Boolean(p.freeShipping),
  quantity,
});

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart')) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => localStorage.setItem('cart', JSON.stringify(items)), [items]);

  // La quantité minimum de commande (MOQ) s'applique dès l'ajout
  const add = (product, quantity = 1) =>
    setItems((prev) => {
      const moq = product.moq || 1;
      const found = prev.find((i) => i._id === product._id);
      if (found) {
        return prev.map((i) =>
          i._id === product._id ? { ...snapshot(product, Math.min(i.quantity + quantity, product.stock)) } : i
        );
      }
      return [...prev, snapshot(product, Math.min(Math.max(quantity, moq), product.stock))];
    });

  const remove = (id) => setItems((prev) => prev.filter((i) => i._id !== id));

  const setQuantity = (id, quantity) =>
    setItems((prev) =>
      prev.map((i) => (i._id === id ? { ...i, quantity: Math.max(i.moq || 1, Math.min(quantity, i.stock)) } : i))
    );

  const clear = () => setItems([]);

  const unitPrice = (i) => unitPriceFor(i, i.quantity);
  const total = items.reduce((sum, i) => sum + unitPrice(i) * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQuantity, clear, total, count, unitPrice }}>{children}</CartContext.Provider>
  );
}

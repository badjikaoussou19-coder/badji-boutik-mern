import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import ProductImage from '../components/ProductImage.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { fcfa, PAYMENTS, shippingFor } from '../utils.js';

export default function Cart() {
  const { items, remove, setQuantity, clear, total, unitPrice } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [checkout, setCheckout] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [coupon, setCoupon] = useState(null); // { code, discount }
  const [couponMsg, setCouponMsg] = useState('');
  const [payment, setPayment] = useState(PAYMENTS[0]);
  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
  });

  const applyCoupon = async (e) => {
    e.preventDefault();
    setCouponMsg('');
    try {
      const { data } = await api.post('/coupons/validate', { code: codeInput, subtotal: total });
      setCoupon({ code: data.code, discount: data.discount });
      setCodeInput('');
    } catch (err) {
      setCoupon(null);
      setCouponMsg(errMsg(err));
    }
  };

  // le panier change : on revérifie le code (minimum de commande, montant de la remise)
  useEffect(() => {
    if (!coupon) return;
    api
      .post('/coupons/validate', { code: coupon.code, subtotal: total })
      .then(({ data }) => setCoupon({ code: data.code, discount: data.discount }))
      .catch((err) => {
        setCoupon(null);
        setCouponMsg(errMsg(err));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const discount = coupon?.discount || 0;
  const shipping = shippingFor(settings, items, total);
  const threshold = settings.freeShippingThreshold;
  const missing = threshold > 0 && shipping > 0 ? threshold - total : 0;
  const grand = total - discount + shipping;

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const order = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/orders', {
        items: items.map((i) => ({ product: i._id, quantity: i.quantity })),
        shippingAddress: form,
        couponCode: coupon?.code,
        paymentMethod: payment,
      });
      clear();
      navigate('/mes-commandes', { state: { created: data.orderNumber } });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <h1>Mon panier</h1>
        <p className="empty">Votre panier est vide. <Link to="/produits">Parcourir les produits</Link></p>
      </>
    );
  }

  // Indication du prochain palier de prix dégressif
  const nextTier = (i) => (i.priceTiers || []).filter((t) => t.minQty > i.quantity).sort((a, b) => a.minQty - b.minQty)[0];

  return (
    <>
      <h1>Mon panier</h1>
      {threshold > 0 && !(items.length && items.every((i) => i.freeShipping)) && (
        <div className="card ship-progress">
          {missing > 0 ? <p>Plus que <strong>{fcfa(missing)}</strong> pour profiter de la <strong>livraison gratuite</strong>.</p> : <p className="text-green"><strong>✔ Votre commande bénéficie de la livraison gratuite.</strong></p>}
          <div className="bar"><span style={{ width: `${Math.min((total / threshold) * 100, 100)}%` }} /></div>
        </div>
      )}
      <div className="cart-layout">
        <div className="card cart-list">
          {items.map((i) => {
            const nt = nextTier(i);
            return (
              <div className="cart-row" key={i._id}>
                <ProductImage product={i} className="thumb" />
                <div className="cart-info">
                  <Link to={`/produits/${i._id}`}><strong>{i.name}</strong></Link>
                  <span className="muted">{fcfa(unitPrice(i))} × {i.quantity}{i.priceTiers?.length > 0 && unitPrice(i) < i.price ? ' (prix dégressif)' : ''}</span>
                  {i.moq > 1 && <span className="small muted">Quantité minimum : {i.moq}</span>}
                  {nt && <span className="small text-green">Dès {nt.minQty} unités : {fcfa(nt.price)} l'unité</span>}
                  {i.freeShipping && <span className="small text-green">Livraison gratuite</span>}
                </div>
                <div className="qty">
                  <button onClick={() => setQuantity(i._id, i.quantity - 1)} aria-label="Diminuer la quantité">−</button>
                  <span>{i.quantity}</span>
                  <button onClick={() => setQuantity(i._id, i.quantity + 1)} aria-label="Augmenter la quantité">+</button>
                </div>
                <strong className="line-total">{fcfa(unitPrice(i) * i.quantity)}</strong>
                <button className="btn btn-ghost btn-small" onClick={() => remove(i._id)}>Supprimer</button>
              </div>
            );
          })}
        </div>

        <aside className="card summary">
          <h2>Récapitulatif</h2>
          {user && (
            coupon ? (
              <p className="alert alert-ok coupon-applied">
                Code <strong>{coupon.code}</strong> appliqué
                <button className="btn btn-ghost btn-small" onClick={() => setCoupon(null)}>Retirer</button>
              </p>
            ) : (
              <form className="coupon-form" onSubmit={applyCoupon}>
                <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="Code promo" aria-label="Code promo" />
                <button className="btn btn-small" disabled={!codeInput.trim()}>Appliquer</button>
              </form>
            )
          )}
          {couponMsg && <p className="alert alert-error">{couponMsg}</p>}
          <div className="sum-row"><span>Sous-total</span><span>{fcfa(total)}</span></div>
          {discount > 0 && <div className="sum-row text-green"><span>Remise</span><span>− {fcfa(discount)}</span></div>}
          <div className="sum-row"><span>Livraison</span><span>{shipping > 0 ? fcfa(shipping) : 'Gratuite'}</span></div>
          <div className="total-row"><span>Total</span><strong>{fcfa(grand)}</strong></div>

          {!checkout ? (
            user ? (
              <button className="btn btn-primary block" onClick={() => setCheckout(true)}>Passer la commande</button>
            ) : (
              <button className="btn btn-primary block" onClick={() => navigate('/connexion', { state: { from: '/panier' } })}>
                Se connecter pour commander
              </button>
            )
          ) : (
            <form onSubmit={order} className="form">
              <h3>Adresse de livraison</h3>
              <label>Nom complet<input name="fullName" value={form.fullName} onChange={change} required /></label>
              <label>Téléphone<input name="phone" value={form.phone} onChange={change} required /></label>
              <label>Adresse<input name="address" value={form.address} onChange={change} required /></label>
              <label>Ville<input name="city" value={form.city} onChange={change} required /></label>
              <h3>Mode de paiement</h3>
              {PAYMENTS.map((p) => (
                <label key={p} className="check radio"><input type="radio" name="payment" checked={payment === p} onChange={() => setPayment(p)} /> {p}</label>
              ))}
              {error && <p className="alert alert-error">{error}</p>}
              <button className="btn btn-primary block" disabled={loading}>{loading ? 'Envoi…' : `Confirmer la commande · ${fcfa(grand)}`}</button>
            </form>
          )}
          <button className="btn btn-ghost block" onClick={clear}>Vider le panier</button>
          <p className="small muted">🔒 Vous payez à la réception. Retours sous {settings.returnDays} jours.</p>
        </aside>
      </div>
    </>
  );
}

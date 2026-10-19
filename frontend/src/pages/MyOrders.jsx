import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import OrderTimeline from '../components/OrderTimeline.jsx';
import { useCart } from '../context/CartContext.jsx';
import { fcfa, formatDate } from '../utils.js';

export default function MyOrders() {
  const location = useLocation();
  const { add } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () =>
    api
      .get('/orders/mine')
      .then((r) => setOrders(r.data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const cancel = async (id) => {
    if (!window.confirm('Annuler cette commande ?')) return;
    try {
      await api.put(`/orders/${id}`, { status: 'Annulée' });
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  // « Acheter à nouveau » : remet dans le panier les produits encore disponibles
  const reorder = async (o) => {
    setMsg('');
    const ids = o.items.map((i) => i.product);
    try {
      const { data } = await api.get('/products', { params: { ids: ids.join(',') } });
      let n = 0;
      o.items.forEach((i) => {
        const p = data.find((x) => x._id === i.product);
        if (p && p.stock > 0) {
          add(p, Math.min(i.quantity, p.stock));
          n += 1;
        }
      });
      setMsg(n ? `${n} produit${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''} au panier.` : "Ces produits ne sont plus disponibles.");
    } catch (e) {
      setError(errMsg(e));
    }
  };

  return (
    <>
      <h1>Mes commandes</h1>
      {location.state?.created && (
        <p className="alert alert-ok">Commande #{location.state.created} enregistrée. Nous vous contacterons pour la livraison.</p>
      )}
      {msg && <p className="alert alert-ok">{msg} <Link to="/panier">Voir le panier</Link></p>}
      {error && <p className="alert alert-error">{error}</p>}
      {loading ? (
        <p className="empty">Chargement…</p>
      ) : orders.length === 0 ? (
        <p className="empty">Vous n'avez pas encore passé de commande. <Link to="/produits">Voir les produits</Link></p>
      ) : (
        <div className="stack">
          {orders.map((o) => (
            <article className="card order" key={o._id}>
              <div className="order-head">
                <div><span className="muted small">Commande passée le</span><br />{formatDate(o.createdAt)}</div>
                <div><span className="muted small">Total</span><br />{fcfa(o.totalAmount)}</div>
                <div><span className="muted small">Livrer à</span><br />{o.shippingAddress.fullName}</div>
                <div className="right"><span className="muted small">Commande n° {o.orderNumber}</span><br /><StatusBadge status={o.status} /></div>
              </div>
              <OrderTimeline order={o} />
              <ul className="order-items">
                {o.items.map((i) => (
                  <li key={i.product}>
                    <Link to={`/produits/${i.product}`}>{i.name} × {i.quantity}</Link>
                    <span>{fcfa(i.price * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="order-foot">
                <span className="muted small">
                  {o.shippingAddress.address}, {o.shippingAddress.city}
                  {o.shippingFee > 0 && ` · livraison ${fcfa(o.shippingFee)}`}
                  {o.discount > 0 && ` · code ${o.couponCode} : − ${fcfa(o.discount)}`}
                  {o.paymentMethod && ` · ${o.paymentMethod}`}
                </span>
              </div>
              <div className="row">
                <button className="btn btn-small btn-primary" onClick={() => reorder(o)}>Acheter à nouveau</button>
                <Link className="btn btn-small" to={`/facture/${o._id}`}>Facture</Link>
                {o.status === 'En attente' && <button className="btn btn-ghost btn-small" onClick={() => cancel(o._id)}>Annuler la commande</button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

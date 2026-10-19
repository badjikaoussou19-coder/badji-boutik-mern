import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import ProductImage from '../components/ProductImage.jsx';
import ProductRow from '../components/ProductRow.jsx';
import Countdown from '../components/Countdown.jsx';
import Modal from '../components/Modal.jsx';
import InquiryForm from '../components/InquiryForm.jsx';
import SupplierCard from '../components/SupplierCard.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import FavoriteButton from '../components/FavoriteButton.jsx';
import Stars from '../components/Stars.jsx';
import { getRecent, pushRecent } from '../hooks.js';
import { fcfa, num, formatDate, unitPriceFor, flashActive } from '../utils.js';

const shortDate = (offset) => new Date(Date.now() + offset * 86400000).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { user, isAdmin } = useAuth();
  const { settings } = useSettings();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [recent, setRecent] = useState([]);
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [reviewMsg, setReviewMsg] = useState({ type: '', text: '' });
  const [photo, setPhoto] = useState(0);
  const [modal, setModal] = useState(null); // 'devis' | 'question'

  const loadAll = () => {
    api.get(`/products/${id}`).then((r) => {
      setProduct(r.data);
      setQty((q) => Math.max(r.data.moq || 1, q));
    }).catch((e) => setError(errMsg(e)));
    api.get(`/products/${id}/reviews`).then((r) => setReviews(r.data)).catch(() => {});
  };

  useEffect(() => {
    setProduct(null);
    setError('');
    setAdded(false);
    setPhoto(0);
    setQty(1);
    loadAll();
    api.get(`/products/${id}/related`).then((r) => setRelated(r.data)).catch(() => setRelated([]));
    const ids = getRecent().filter((x) => x !== id);
    if (ids.length) api.get('/products', { params: { ids: ids.join(',') } }).then((r) => setRecent(r.data)).catch(() => {});
    else setRecent([]);
    pushRecent(id);
    window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const photos = useMemo(() => (product ? [product.image, ...(product.images || [])].filter(Boolean) : []), [product]);
  const breakdown = useMemo(() => [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => r.rating === n).length })), [reviews]);

  const sendReview = async (e) => {
    e.preventDefault();
    setReviewMsg({ type: '', text: '' });
    try {
      await api.post(`/products/${id}/reviews`, form);
      setReviewMsg({ type: 'ok', text: 'Merci, votre avis est publié.' });
      loadAll();
    } catch (err) {
      setReviewMsg({ type: 'error', text: errMsg(err) });
    }
  };

  const removeReview = async (reviewId) => {
    if (!window.confirm('Supprimer cet avis ?')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      loadAll();
    } catch (err) {
      setReviewMsg({ type: 'error', text: errMsg(err) });
    }
  };

  if (error) return <p className="alert alert-error">{error}</p>;
  if (!product) return <p className="empty">Chargement…</p>;

  const out = product.stock <= 0;
  const moq = product.moq || 1;
  const unit = unitPriceFor(product, qty);
  const tiers = [{ minQty: 1, price: product.price }, ...(product.priceTiers || [])].sort((a, b) => a.minQty - b.minQty);
  const flash = flashActive(product);
  const threshold = settings.freeShippingThreshold;
  const shipText = product.freeShipping ? 'Livraison gratuite' : settings.shippingFee > 0 ? `${fcfa(settings.shippingFee)}${threshold > 0 ? ` — gratuite dès ${fcfa(threshold)} d'achats` : ''}` : 'Livraison offerte';
  const setQtyClamped = (v) => setQty(Math.max(moq, Math.min(product.stock, Number(v) || moq)));

  const addToCart = () => {
    add(product, qty);
    setAdded(true);
  };

  return (
    <>
      <nav className="breadcrumb" aria-label="Fil d'Ariane">
        <Link to="/">Accueil</Link> › <Link to={`/produits?category=${product.category?._id}`}>{product.category?.name}</Link> › <span>{product.name}</span>
      </nav>

      <div className="pd-grid">
        <div className="pd-gallery card">
          {photos.length > 1 && (
            <div className="thumbs">
              {photos.map((src, i) => (
                <button key={src + i} className={i === photo ? 'on' : ''} onClick={() => setPhoto(i)} onMouseEnter={() => setPhoto(i)} aria-label={`Photo ${i + 1}`}>
                  <ProductImage product={product} src={src} />
                </button>
              ))}
            </div>
          )}
          <div className="main-photo">
            <ProductImage product={product} src={photos[photo]} className="detail-img" />
            {product.discountPercent > 0 && <span className="badge-discount">−{product.discountPercent} %</span>}
          </div>
        </div>

        <div className="pd-info card">
          <div className="title-row">
            <h1>{product.name}</h1>
            <FavoriteButton productId={product._id} />
          </div>
          {product.brand && <p className="muted">Marque : <strong>{product.brand}</strong></p>}
          <p className="rating-line">
            {product.ratingCount > 0 ? (
              <>
                <Stars value={product.ratingAvg} size="1.15rem" />
                <a href="#avis">{product.ratingAvg} / 5 · {num(product.ratingCount)} avis</a>
              </>
            ) : <span className="muted">Aucun avis pour l'instant</span>}
            {product.sold > 0 && <span className="muted"> | {num(product.sold)} vendus</span>}
          </p>
          {flash && <p className="flash-banner">⚡ Vente Flash <Countdown until={product.flashSaleEnds} /></p>}

          <div className="pd-price">
            {product.discountPercent > 0 && <span className="badge-discount inline">−{product.discountPercent} %</span>}
            <span className="price big">{fcfa(unit)}</span>
            {product.oldPrice > product.price && <s className="old-price">{fcfa(product.oldPrice)}</s>}
            <span className="muted small"> / unité{tiers.length > 1 ? ` pour ${qty} unité${qty > 1 ? 's' : ''}` : ''}</span>
          </div>

          {tiers.length > 1 && (
            <div className="tier-table" role="table" aria-label="Prix selon la quantité">
              {tiers.map((t, i) => {
                const next = tiers[i + 1];
                const active = unit === t.price && qty >= t.minQty && (!next || qty < next.minQty);
                return (
                  <div key={t.minQty} className={`tier ${active ? 'on' : ''}`} role="row">
                    <span className="muted small">{next ? `${t.minQty} – ${next.minQty - 1} unités` : `≥ ${t.minQty} unités`}</span>
                    <strong>{fcfa(t.price)}</strong>
                  </div>
                );
              })}
            </div>
          )}
          {moq > 1 && <p className="alert alert-warn">Commande minimum : <strong>{moq} unités</strong></p>}

          {product.specs?.length > 0 && (
            <>
              <h2 className="h-sm">Caractéristiques</h2>
              <dl className="specs">
                {product.specs.map((s) => (
                  <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>
                ))}
              </dl>
            </>
          )}
        </div>

        <aside className="pd-buy card">
          <h3>Livraison</h3>
          <p className={product.freeShipping ? 'text-green' : ''}><strong>{shipText}</strong></p>
          <p className="small muted">Livraison estimée : {shortDate(2)} – {shortDate(5)}</p>
          <p className={out ? 'text-red' : 'text-green'}><strong>{out ? 'Produit épuisé' : product.stock <= 5 ? `Plus que ${product.stock} en stock` : 'En stock'}</strong></p>

          {!out && !isAdmin && (
            <>
              <label>Quantité
                <div className="qty">
                  <button onClick={() => setQtyClamped(qty - 1)} aria-label="Diminuer la quantité">−</button>
                  <input type="number" min={moq} max={product.stock} value={qty} onChange={(e) => setQty(e.target.value === '' ? '' : Number(e.target.value))} onBlur={(e) => setQtyClamped(e.target.value)} aria-label="Quantité" />
                  <button onClick={() => setQtyClamped(qty + 1)} aria-label="Augmenter la quantité">+</button>
                </div>
              </label>
              <div className="total-row"><span>Sous-total</span><strong>{fcfa(unit * (Number(qty) || moq))}</strong></div>
              <button className="btn btn-primary block" onClick={addToCart}>Ajouter au panier</button>
              <button className="btn btn-accent block" onClick={() => { add(product, qty); navigate('/panier'); }}>Acheter maintenant</button>
              {added && <p className="alert alert-ok">Ajouté au panier. <Link to="/panier">Voir le panier</Link></p>}
            </>
          )}
          {!isAdmin && (
            <div className="contact-btns">
              <button className="btn block" onClick={() => setModal('devis')}>Demander un devis</button>
              <button className="btn block" onClick={() => setModal('question')}>💬 Discuter avec le vendeur</button>
            </div>
          )}

          <div className="protect">
            <h3>Protection des commandes</h3>
            <p>🔒 <strong>Paiement à la livraison</strong><br /><span className="muted small">Espèces, Wave ou Orange Money à la réception.</span></p>
            <p>↩️ <strong>Protection de remboursement</strong><br /><span className="muted small">Signalez un problème sous {settings.returnDays} jours après la livraison.</span></p>
            <p>📦 <strong>Suivi de commande</strong><br /><span className="muted small">Confirmation, expédition et livraison dans « Mes commandes ».</span></p>
          </div>
        </aside>
      </div>

      <SupplierCard supplier={product.supplier} />

      <section className="card pd-desc">
        <h2>Description</h2>
        <p>{product.description || 'Aucune description.'}</p>
      </section>

      <section className="reviews card" id="avis">
        <h2>Avis des clients</h2>
        {reviews.length > 0 && (
          <div className="rating-breakdown">
            <div className="big-score"><strong>{product.ratingAvg}</strong><Stars value={product.ratingAvg} size="1.3rem" /><span className="muted small">{num(product.ratingCount)} avis</span></div>
            <div className="bars">
              {breakdown.map(({ n, count }) => (
                <div key={n} className="bar-row"><span>{n} ★</span><div className="bar"><span style={{ width: `${(count / reviews.length) * 100}%` }} /></div><span className="muted small">{Math.round((count / reviews.length) * 100)} %</span></div>
              ))}
            </div>
          </div>
        )}
        {reviews.length === 0 && <p className="muted">Aucun avis pour le moment.</p>}
        <div className="stack">
          {reviews.map((r) => (
            <article className="review" key={r._id}>
              <div className="review-head">
                <strong>{r.user?.name || 'Client'}</strong>
                <Stars value={r.rating} />
                <span className="muted small">{formatDate(r.createdAt)}</span>
                <span className="mini-tag mini-orange">Achat vérifié</span>
                {(isAdmin || r.user?._id === user?._id) && (
                  <button className="btn btn-ghost btn-small" onClick={() => removeReview(r._id)}>Supprimer</button>
                )}
              </div>
              {r.comment && <p>{r.comment}</p>}
            </article>
          ))}
        </div>

        {user && !isAdmin && (
          <form className="form review-form" onSubmit={sendReview}>
            <h3>Donner mon avis</h3>
            <Stars value={form.rating} onChange={(n) => setForm({ ...form, rating: n })} size="1.6rem" />
            <label>Commentaire (facultatif)
              <textarea rows="3" maxLength="1000" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
            </label>
            {reviewMsg.text && <p className={`alert alert-${reviewMsg.type}`}>{reviewMsg.text}</p>}
            <button className="btn btn-primary">Publier</button>
            <p className="muted small">Vous pouvez noter un produit une fois votre commande livrée. Un nouvel envoi remplace votre avis.</p>
          </form>
        )}
        {!user && <p className="muted"><Link to="/connexion">Connectez-vous</Link> pour donner votre avis.</p>}
      </section>

      <ProductRow title="Autres recommandations pour vous" products={related} />
      <ProductRow title="Consultés récemment" products={recent} />

      {modal && (
        <Modal title={modal === 'devis' ? `Demander un devis — ${product.name}` : `Discuter avec ${product.supplier?.name || 'le vendeur'}`} onClose={() => setModal(null)}>
          <InquiryForm product={product} type={modal} defaultQuantity={qty > 1 ? qty : undefined} onSent={() => {}} />
        </Modal>
      )}
    </>
  );
}

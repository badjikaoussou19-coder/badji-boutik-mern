import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import HeroCarousel from '../components/HeroCarousel.jsx';
import ProductRow from '../components/ProductRow.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { getRecent } from '../hooks.js';

const get = (url, params) => api.get(url, { params }).then((r) => r.data).catch(() => []);

const TRUST = [
  ['🚚', 'Livraison partout au Sénégal', 'Suivi de commande en ligne'],
  ['💳', 'Paiement à la livraison', 'Espèces, Wave ou Orange Money'],
  ['↩️', 'Retours simples', 'Remboursement si le produit ne convient pas'],
  ['💬', 'Vendeurs réactifs', 'Questions et devis en quelques heures'],
];

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState({ flash: [], best: [], fresh: [], free: [], featured: [], recent: [] });

  useEffect(() => {
    get('/banners').then(setBanners);
    get('/categories').then(setCategories);
    const recentIds = getRecent();
    Promise.all([
      get('/products', { flash: 1, sort: 'flash', limit: 12 }),
      get('/products', { sort: 'best', limit: 12 }),
      get('/products', { sort: 'new', limit: 12 }),
      get('/products', { freeShipping: 1, limit: 12 }),
      get('/products', { featured: 1, limit: 12 }),
      recentIds.length ? get('/products', { ids: recentIds.join(',') }) : Promise.resolve([]),
    ]).then(([flash, best, fresh, free, featured, recent]) => {
      const order = new Map(recentIds.map((id, i) => [id, i]));
      setData({ flash, best, fresh, free, featured, recent: [...recent].sort((a, b) => order.get(a._id) - order.get(b._id)) });
    });
  }, []);

  // « Tuiles » de catégories : 4 miniatures de produits par catégorie (style Amazon)
  const tiles = categories.filter((c) => c.count > 0).slice(0, 4);

  return (
    <>
      <HeroCarousel banners={banners} />

      <div className="tiles">
        {tiles.map((c) => {
          const items = data.best.filter((p) => p.category?._id === c._id).slice(0, 4);
          return (
            <section className="card tile" key={c._id}>
              <h3>{c.icon} {c.name}</h3>
              <div className="tile-grid">
                {(items.length ? items : data.fresh.filter((p) => p.category?._id === c._id).slice(0, 4)).map((p) => (
                  <Link key={p._id} to={`/produits/${p._id}`} title={p.name}><ProductImage product={p} /></Link>
                ))}
              </div>
              <Link to={`/produits?category=${c._id}`}>Voir tout ({c.count})</Link>
            </section>
          );
        })}
      </div>

      <ProductRow title="⚡ Ventes Flash" products={data.flash} to="/produits?flash=1" />
      <ProductRow title="🏆 Meilleures ventes" products={data.best} to="/produits?sort=best" ranked />

      <section className="rfq-banner card">
        <div>
          <h2>Besoin de grandes quantités ?</h2>
          <p>Décrivez votre besoin, nos vendeurs vous répondent avec un devis. Les prix baissent avec la quantité.</p>
        </div>
        <Link to="/demande-devis" className="btn btn-accent">Demander un devis</Link>
      </section>

      <ProductRow title="Nouveautés" products={data.fresh} to="/produits?sort=new" />
      <ProductRow title="Livraison gratuite" products={data.free} to="/produits?freeShipping=1" />
      <ProductRow title="Sélection de la boutique" products={data.featured} to="/produits" />
      <ProductRow title="Consultés récemment" products={data.recent} />

      <section className="trust">
        {TRUST.map(([icon, title, text]) => (
          <div key={title}><span aria-hidden="true">{icon}</span><strong>{title}</strong><span className="muted small">{text}</span></div>
        ))}
      </section>
    </>
  );
}

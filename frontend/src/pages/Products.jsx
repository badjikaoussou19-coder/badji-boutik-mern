import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import Pagination from '../components/Pagination.jsx';
import Stars from '../components/Stars.jsx';
import { num } from '../utils.js';

const SORTS = [
  ['new', 'Nouveautés'],
  ['best', 'Meilleures ventes'],
  ['rating', 'Mieux notés'],
  ['price_asc', 'Prix croissant'],
  ['price_desc', 'Prix décroissant'],
];

const TITLES = { flash: '⚡ Ventes Flash', freeShipping: 'Livraison gratuite', promo: 'Promotions' };

export default function Products() {
  const [params, setParams] = useSearchParams();
  const get = (k) => params.get(k) || '';
  const search = get('search');
  const category = get('category');
  const sort = get('sort') || 'new';
  const page = Number(get('page')) || 1;
  const minPrice = get('minPrice');
  const maxPrice = get('maxPrice');
  const minRating = get('minRating');
  const flags = { freeShipping: get('freeShipping') === '1', inStock: get('inStock') === '1', promo: get('promo') === '1', flash: get('flash') === '1' };

  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [categories, setCategories] = useState([]);
  const [price, setPrice] = useState({ min: minPrice, max: maxPrice });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setPrice({ min: minPrice, max: maxPrice });
  }, [minPrice, maxPrice]);

  const query = params.toString();
  useEffect(() => {
    setLoading(true);
    const q = Object.fromEntries(params.entries());
    api
      .get('/products', { params: { ...q, page, limit: 12 } })
      .then((r) => {
        setData(r.data);
        setError('');
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const update = (next) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v && v !== '0' ? p.set(k, v) : p.delete(k)));
    if (!('page' in next)) p.delete('page');
    setParams(p);
  };

  const toggle = (k) => update({ [k]: flags[k] ? '' : '1' });
  const activeCat = categories.find((c) => c._id === category);
  const title = search ? `Résultats pour « ${search} »` : activeCat?.name || Object.entries(TITLES).find(([k]) => flags[k])?.[1] || (sort === 'best' ? '🏆 Meilleures ventes' : sort === 'new' && [...params.keys()].length === 1 ? 'Nouveautés' : 'Tous les produits');
  const hasFilters = category || search || minPrice || maxPrice || minRating || Object.values(flags).some(Boolean);

  const filters = (
    <aside className="filters card" aria-label="Filtres">
      <h3>Affiner par</h3>

      <h4>Catégorie</h4>
      <ul className="cat-list">
        <li><button className={!category ? 'active' : ''} onClick={() => update({ category: '' })}>Toutes les catégories</button></li>
        {categories.map((c) => (
          <li key={c._id}>
            <button className={category === c._id ? 'active' : ''} onClick={() => update({ category: c._id })}>
              <span>{c.icon} {c.name}</span><span className="muted small">{c.count}</span>
            </button>
          </li>
        ))}
      </ul>

      <h4>Avis des clients</h4>
      <ul className="cat-list">
        {[4, 3, 2].map((n) => (
          <li key={n}>
            <button className={Number(minRating) === n ? 'active' : ''} onClick={() => update({ minRating: Number(minRating) === n ? '' : String(n) })}>
              <Stars value={n} /> <span className="small">et plus</span>
            </button>
          </li>
        ))}
      </ul>

      <h4>Prix (FCFA)</h4>
      <form className="price-filter" onSubmit={(e) => { e.preventDefault(); update({ minPrice: price.min, maxPrice: price.max }); }}>
        <input type="number" min="0" placeholder="Min" value={price.min} onChange={(e) => setPrice({ ...price, min: e.target.value })} aria-label="Prix minimum" />
        <input type="number" min="0" placeholder="Max" value={price.max} onChange={(e) => setPrice({ ...price, max: e.target.value })} aria-label="Prix maximum" />
        <button className="btn btn-small">OK</button>
      </form>

      <h4>Livraison et offres</h4>
      <label className="check"><input type="checkbox" checked={flags.freeShipping} onChange={() => toggle('freeShipping')} /> Livraison gratuite</label>
      <label className="check"><input type="checkbox" checked={flags.flash} onChange={() => toggle('flash')} /> Ventes Flash</label>
      <label className="check"><input type="checkbox" checked={flags.promo} onChange={() => toggle('promo')} /> En promotion</label>
      <label className="check"><input type="checkbox" checked={flags.inStock} onChange={() => toggle('inStock')} /> En stock uniquement</label>

      {hasFilters && <button className="btn btn-small block" onClick={() => setParams({})}>Effacer les filtres</button>}
    </aside>
  );

  return (
    <>
      <div className="results-head card">
        <div>
          <h1>{title}</h1>
          <span className="muted">{loading ? 'Chargement…' : `${num(data.total)} résultat${data.total > 1 ? 's' : ''}`}</span>
        </div>
        <div className="results-tools">
          <button className="btn btn-small filters-toggle" onClick={() => setShowFilters((s) => !s)}>Filtres</button>
          <label className="inline">Trier par
            <select value={sort} onChange={(e) => update({ sort: e.target.value === 'new' ? '' : e.target.value })}>
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="catalog">
        <div className={`filters-wrap ${showFilters ? 'open' : ''}`}>{filters}</div>
        <section>
          {error && <p className="alert alert-error">{error}</p>}
          {loading ? (
            <div className="grid">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton" />)}</div>
          ) : data.items.length === 0 ? (
            <p className="empty">Aucun produit ne correspond à votre recherche.</p>
          ) : (
            <div className="grid">{data.items.map((p) => <ProductCard key={p._id} product={p} />)}</div>
          )}
          <Pagination page={data.page || 1} pages={data.pages || 1} onChange={(p) => { update({ page: String(p) }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </section>
      </div>
    </>
  );
}

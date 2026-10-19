import { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

// En-tête à deux étages (style Amazon / Alibaba) : recherche par catégorie, compte, panier, puis liens rapides
export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setDrawer(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set('search', q.trim());
    if (cat) p.set('category', cat);
    navigate(`/produits?${p.toString()}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {settings.announcement && <div className="announcement">{settings.announcement}</div>}
      <header className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="brand">{settings.shopName || 'Boutik'}</Link>

          <div className="deliver">
            <span className="muted-light small">Livraison à</span>
            <strong>📍 {user?.city ? `${user.city}, Sénégal` : 'Sénégal'}</strong>
          </div>

          <form className="nav-search" onSubmit={submit} role="search">
            <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Catégorie">
              <option value="">Toutes</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un produit, une marque…" aria-label="Rechercher" />
            <button aria-label="Rechercher">🔍</button>
          </form>

          <div className="nav-actions">
            <div className="account">
              <Link to={user ? '/profil' : '/connexion'} className="account-link">
                <span className="small">Bonjour, {user ? user.name.split(' ')[0] : 'identifiez-vous'}</span>
                <strong>Compte et listes ▾</strong>
              </Link>
              <div className="dropdown">
                {user ? (
                  <>
                    {isAdmin ? <Link to="/admin">Espace administrateur</Link> : (
                      <>
                        <Link to="/mes-commandes">Mes commandes</Link>
                        <Link to="/mes-devis">Mes demandes de devis</Link>
                        <Link to="/favoris">Mes favoris</Link>
                      </>
                    )}
                    <Link to="/profil">Mon profil</Link>
                    <button onClick={handleLogout}>Déconnexion</button>
                  </>
                ) : (
                  <>
                    <Link to="/connexion" className="btn btn-primary">Se connecter</Link>
                    <span className="small muted">Nouveau client ? <Link to="/inscription">Créer un compte</Link></span>
                  </>
                )}
              </div>
            </div>
            {user && !isAdmin && (
              <NavLink to="/mes-commandes" className="orders-link"><span className="small">Retours</span><strong>et commandes</strong></NavLink>
            )}
            {!isAdmin && (
              <NavLink to="/panier" className="cart-link" aria-label={`Panier (${count} article${count > 1 ? 's' : ''})`}>
                <span className="cart-icon">🛒<span className="badge-count">{count}</span></span>
                <strong>Panier</strong>
              </NavLink>
            )}
          </div>
        </div>

        <nav className="subbar">
          <div className="container subbar-inner">
            <button className="all-btn" onClick={() => setDrawer(true)}>☰ Toutes</button>
            <NavLink to="/produits?flash=1">Ventes Flash</NavLink>
            <NavLink to="/produits?sort=best">Meilleures ventes</NavLink>
            <NavLink to="/produits?sort=new">Nouveautés</NavLink>
            <NavLink to="/produits?freeShipping=1">Livraison gratuite</NavLink>
            <NavLink to="/demande-devis">Demander un devis</NavLink>
            {user && !isAdmin && <NavLink to="/favoris">Favoris</NavLink>}
            <span className="spacer" />
            <NavLink to="/aide">Centre d'aide</NavLink>
          </div>
        </nav>
      </header>

      {drawer && (
        <div className="drawer-overlay" onClick={() => setDrawer(false)}>
          <aside className="drawer" onClick={(e) => e.stopPropagation()} aria-label="Catégories">
            <div className="drawer-head">
              <strong>Bonjour, {user ? user.name.split(' ')[0] : 'identifiez-vous'}</strong>
              <button className="btn-ghost" onClick={() => setDrawer(false)} aria-label="Fermer">✕</button>
            </div>
            <h3>Toutes les catégories</h3>
            <Link to="/produits" onClick={() => setDrawer(false)}>🛍️ Tous les produits</Link>
            {categories.map((c) => (
              <Link key={c._id} to={`/produits?category=${c._id}`} onClick={() => setDrawer(false)}>
                <span>{c.icon || '📦'} {c.name}</span><span className="muted small">{c.count}</span>
              </Link>
            ))}
            <h3>Offres et services</h3>
            <Link to="/produits?flash=1" onClick={() => setDrawer(false)}>⚡ Ventes Flash</Link>
            <Link to="/produits?sort=best" onClick={() => setDrawer(false)}>🏆 Meilleures ventes</Link>
            <Link to="/demande-devis" onClick={() => setDrawer(false)}>📝 Demander un devis</Link>
            <Link to="/aide" onClick={() => setDrawer(false)}>❓ Centre d'aide</Link>
          </aside>
        </div>
      )}
    </>
  );
}

import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

const GROUPS = [
  ['Pilotage', [['/admin', '📊', 'Tableau de bord', null, true]]],
  [
    'Catalogue',
    [
      ['/admin/produits', '📦', 'Produits', 'lowStock'],
      ['/admin/categories', '🗂️', 'Catégories'],
      ['/admin/vendeurs', '🏪', 'Vendeurs'],
      ['/admin/bannieres', '🖼️', 'Bannières'],
    ],
  ],
  [
    'Ventes',
    [
      ['/admin/commandes', '🧾', 'Commandes', 'pendingOrders'],
      ['/admin/devis', '💬', 'Devis et messages', 'openInquiries'],
      ['/admin/promos', '🏷️', 'Codes promo'],
      ['/admin/avis', '⭐', 'Avis clients'],
    ],
  ],
  ['Clients', [['/admin/clients', '👥', 'Clients']]],
  ['Configuration', [['/admin/parametres', '⚙️', 'Paramètres']]],
];

// Structure de l'espace administrateur : barre latérale, barre du haut, contenu
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    setOpen(false);
    api.get('/stats/summary').then((r) => setSummary(r.data)).catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    const t = setInterval(() => api.get('/stats/summary').then((r) => setSummary(r.data)).catch(() => {}), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={`adm ${open ? 'menu-open' : ''}`}>
      <aside className="adm-side" aria-label="Navigation de l'administration">
        <Link to="/admin" className="adm-brand">{settings.shopName || 'Boutik'} <span>Admin</span></Link>
        <nav>
          {GROUPS.map(([group, links]) => (
            <div key={group} className="adm-group">
              <span className="adm-group-title">{group}</span>
              {links.map(([to, icon, label, badge, end]) => (
                <NavLink key={to} to={to} end={Boolean(end)}>
                  <span aria-hidden="true">{icon}</span>
                  <span className="grow">{label}</span>
                  {badge && summary[badge] > 0 && <span className={`adm-badge ${badge === 'lowStock' ? 'warn' : ''}`} title={badge === 'lowStock' ? 'Produits en stock bas' : ''}>{summary[badge]}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      {open && <div className="adm-backdrop" onClick={() => setOpen(false)} />}

      <div className="adm-main">
        <header className="adm-top">
          <button className="btn adm-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu">☰</button>
          <span className="grow" />
          <Link to="/" className="btn btn-small">Voir la boutique ↗</Link>
          <span className="adm-user"><span className="avatar">{user.name[0]}</span>{user.name}</span>
          <button className="btn btn-small btn-ghost" onClick={() => { logout(); navigate('/'); }}>Déconnexion</button>
        </header>
        <main className="adm-content"><Outlet /></main>
      </div>
    </div>
  );
}

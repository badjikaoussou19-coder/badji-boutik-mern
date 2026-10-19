import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext.jsx';

export default function Footer() {
  const { settings } = useSettings();
  return (
    <footer className="footer">
      <button className="to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Retour en haut</button>
      <div className="container footer-cols">
        <div>
          <h4>Acheter</h4>
          <Link to="/produits">Tous les produits</Link>
          <Link to="/produits?flash=1">Ventes Flash</Link>
          <Link to="/produits?sort=best">Meilleures ventes</Link>
          <Link to="/produits?freeShipping=1">Livraison gratuite</Link>
        </div>
        <div>
          <h4>Pour les professionnels</h4>
          <Link to="/demande-devis">Demander un devis</Link>
          <Link to="/mes-devis">Mes demandes</Link>
          <Link to="/produits?sort=best">Prix dégressifs</Link>
        </div>
        <div>
          <h4>Aide</h4>
          <Link to="/aide">Centre d'aide</Link>
          <Link to="/mes-commandes">Suivre ma commande</Link>
          <Link to="/profil">Mon compte</Link>
        </div>
        <div>
          <h4>Contact</h4>
          {settings.supportPhone && <span>{settings.supportPhone}</span>}
          {settings.supportEmail && <span>{settings.supportEmail}</span>}
          <span>Paiement à la livraison : espèces, Wave, Orange Money</span>
        </div>
      </div>
      <div className="container footer-bottom">© {new Date().getFullYear()} {settings.shopName} — Dakar, Sénégal</div>
    </footer>
  );
}

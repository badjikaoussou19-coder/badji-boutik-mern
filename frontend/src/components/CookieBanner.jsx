import { useState } from 'react';

// Bandeau de consentement aux cookies (choix mémorisé dans le navigateur)
export default function CookieBanner() {
  const [choice, setChoice] = useState(() => localStorage.getItem('cookie-consent'));
  const [details, setDetails] = useState(false);
  if (choice) return null;

  const save = (value) => {
    localStorage.setItem('cookie-consent', value);
    setChoice(value);
  };

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookies et confidentialité">
      <div className="container">
        <h3>Cookies et confidentialité</h3>
        <p>
          Boutik utilise le stockage de votre navigateur pour garder votre panier, votre connexion et les produits consultés récemment.
          Avec votre accord, nous pourrons aussi mesurer l'audience du site pour l'améliorer.
        </p>
        {details && (
          <ul className="small muted">
            <li><strong>Essentiels</strong> : panier, session, préférences — toujours actifs.</li>
            <li><strong>Mesure d'audience</strong> : facultatifs, activés seulement si vous acceptez.</li>
          </ul>
        )}
        <div className="row">
          <button className="btn btn-primary" onClick={() => save('all')}>Accepter</button>
          <button className="btn" onClick={() => save('essential')}>Refuser</button>
          <button className="btn btn-ghost link-btn" onClick={() => setDetails((d) => !d)}>{details ? 'Masquer' : 'Personnaliser'}</button>
        </div>
      </div>
    </div>
  );
}

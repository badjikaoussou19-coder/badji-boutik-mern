import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext.jsx';
import { fcfa } from '../utils.js';

// Centre d'aide : réponses aux questions fréquentes (les valeurs viennent des réglages de la boutique)
export default function Help() {
  const { settings } = useSettings();
  const faq = [
    ['Comment passer commande ?', "Ajoutez des produits au panier, puis cliquez sur « Passer la commande ». Il faut un compte client : l'inscription prend une minute."],
    ['Comment payer ?', 'Le paiement se fait à la livraison : en espèces, avec Wave ou avec Orange Money. Vous choisissez le mode au moment de la commande.'],
    ['Quels sont les frais de livraison ?', settings.shippingFee > 0 ? `${fcfa(settings.shippingFee)} par commande${settings.freeShippingThreshold > 0 ? `, gratuits dès ${fcfa(settings.freeShippingThreshold)} d'achats` : ''}. Certains produits sont en livraison gratuite.` : 'La livraison est offerte.'],
    ['Comment suivre ma commande ?', "Dans « Mes commandes », vous voyez chaque étape : en attente, confirmée, expédiée, livrée. Vous pouvez annuler tant qu'elle est en attente."],
    ['Puis-je retourner un produit ?', `Oui, signalez le problème sous ${settings.returnDays} jours après la livraison via une demande dans « Mes demandes », ou contactez-nous.`],
    ["Qu'est-ce que la quantité minimum (MOQ) ?", "Certains produits se vendent par lots : la quantité minimum est indiquée sur la fiche. Plus vous commandez, plus le prix unitaire baisse (prix dégressifs)."],
    ['Comment obtenir un devis ?', 'Depuis la fiche produit, ou la page « Demander un devis » pour un besoin sur mesure. Le vendeur vous répond dans « Mes demandes ».'],
  ];
  return (
    <div className="card help">
      <h1>Centre d'aide</h1>
      {faq.map(([q, a]) => (
        <details key={q}><summary>{q}</summary><p>{a}</p></details>
      ))}
      <p className="muted">Une autre question ? <Link to="/demande-devis">Écrivez-nous</Link>{settings.supportEmail && <> ou à {settings.supportEmail}</>}{settings.supportPhone && <> · {settings.supportPhone}</>}.</p>
    </div>
  );
}

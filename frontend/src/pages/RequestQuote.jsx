import { Link } from 'react-router-dom';
import InquiryForm from '../components/InquiryForm.jsx';

// « Demander un devis » (style Alibaba) : décrire un besoin sans produit précis
export default function RequestQuote() {
  return (
    <div className="rfq">
      <section className="card rfq-main">
        <h1>Demander un devis</h1>
        <p className="muted">Dites-nous ce que vous cherchez : nos vendeurs vous répondent avec un prix, un délai et les options de livraison.</p>
        <InquiryForm type="devis" />
      </section>
      <aside className="card rfq-side">
        <h2>Comment ça marche ?</h2>
        <ol>
          <li><strong>Décrivez votre besoin</strong> : produit, quantité, budget.</li>
          <li><strong>Recevez une réponse</strong> du vendeur dans « Mes demandes ».</li>
          <li><strong>Commandez</strong> au prix convenu avec livraison suivie.</li>
        </ol>
        <p className="small muted">Pour un produit du catalogue, utilisez plutôt le bouton « Demander un devis » de sa fiche. <Link to="/mes-devis">Voir mes demandes</Link></p>
      </aside>
    </div>
  );
}

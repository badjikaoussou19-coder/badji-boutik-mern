import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

// Formulaire de demande : devis (RFQ) ou question au vendeur. Utilisé sur la fiche produit et sur /demande-devis.
export default function InquiryForm({ product, type = 'devis', onSent, defaultQuantity }) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    productName: product?.name || '',
    quantity: defaultQuantity || (product?.moq > 1 ? product.moq : ''),
    budget: '',
    message: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (!user) {
    return (
      <p className="muted">
        <Link to="/connexion" state={{ from: window.location.pathname }}>Connectez-vous</Link> ou <Link to="/inscription">créez un compte</Link> pour contacter le vendeur.
      </p>
    );
  }
  if (isAdmin) return <p className="muted">Connectez-vous avec un compte client pour envoyer une demande.</p>;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/inquiries', {
        type,
        product: product?._id,
        productName: form.productName,
        subject: product ? (type === 'question' ? `${product.name} — question` : `Devis : ${product.name}`) : `Devis : ${form.productName}`,
        quantity: Number(form.quantity) || 0,
        budget: Number(form.budget) || 0,
        message: form.message,
      });
      setSent(true);
      onSent?.(data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="alert alert-ok">
        Votre demande est envoyée. Le vendeur vous répond dans « <Link to="/mes-devis">Mes demandes</Link> ».
        <button className="btn btn-ghost btn-small" onClick={() => navigate('/mes-devis')}>Voir mes demandes</button>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={submit}>
      {!product && (
        <label>Produit recherché
          <input name="productName" value={form.productName} onChange={change} placeholder="Ex. : 200 T-shirts floqués" required />
        </label>
      )}
      <div className="two-cols">
        <label>Quantité souhaitée<input name="quantity" type="number" min="1" value={form.quantity} onChange={change} /></label>
        {type === 'devis' && <label>Budget (FCFA, facultatif)<input name="budget" type="number" min="0" value={form.budget} onChange={change} /></label>}
      </div>
      <label>{type === 'question' ? 'Votre question' : 'Détails de votre demande'}
        <textarea name="message" rows="4" maxLength="2000" value={form.message} onChange={change} required
          placeholder={type === 'question' ? 'Posez votre question au vendeur…' : 'Décrivez ce dont vous avez besoin : personnalisation, délai, lieu de livraison…'} />
      </label>
      {error && <p className="alert alert-error">{error}</p>}
      <button className="btn btn-primary" disabled={loading}>{loading ? 'Envoi…' : type === 'question' ? 'Envoyer la question' : 'Envoyer la demande'}</button>
    </form>
  );
}

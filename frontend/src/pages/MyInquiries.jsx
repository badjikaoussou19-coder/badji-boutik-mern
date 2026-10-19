import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import InquiryThread from '../components/InquiryThread.jsx';
import { fcfa, formatDate, num } from '../utils.js';

const TONE = { Ouvert: 'tag-amber', Répondu: 'tag-green', Clos: '' };

// Messagerie du client : devis et questions envoyés aux vendeurs
export default function MyInquiries() {
  const [list, setList] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadList = () => api.get('/inquiries/mine').then((r) => { setList(r.data); return r.data; }).catch((e) => setError(errMsg(e)));
  const open = (id) => api.get(`/inquiries/${id}`).then((r) => { setCurrent(r.data); loadList(); }).catch((e) => setError(errMsg(e)));

  useEffect(() => {
    loadList().then((d) => d?.length && open(d[0]._id)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async (text) => {
    try {
      const { data } = await api.post(`/inquiries/${current._id}/messages`, { text });
      setCurrent(data);
      loadList();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  return (
    <>
      <div className="results-head card">
        <div><h1>Mes demandes de devis et messages</h1><span className="muted">Échangez avec le vendeur : prix, quantités, délais.</span></div>
        <Link to="/demande-devis" className="btn btn-primary">Nouvelle demande de devis</Link>
      </div>
      {error && <p className="alert alert-error">{error}</p>}
      {loading ? (
        <p className="empty">Chargement…</p>
      ) : list.length === 0 ? (
        <p className="empty">Aucune demande pour le moment. <Link to="/demande-devis">Demander un devis</Link></p>
      ) : (
        <div className="inbox card">
          <ul className="inbox-list">
            {list.map((q) => (
              <li key={q._id}>
                <button className={current?._id === q._id ? 'active' : ''} onClick={() => open(q._id)}>
                  <strong>{q.subject}{q.unreadByClient && <span className="dot-new" aria-label="Nouvelle réponse" />}</strong>
                  <span className="muted small">{q.messages.at(-1)?.text.slice(0, 60)}</span>
                  <span className="small"><span className={`tag ${TONE[q.status]}`}>{q.status}</span> <span className="muted">{formatDate(q.updatedAt)}</span></span>
                </button>
              </li>
            ))}
          </ul>
          <section className="inbox-main">
            {current && (
              <>
                <header>
                  <h2>{current.subject}</h2>
                  <p className="muted small">
                    {current.type === 'devis' ? 'Demande de devis' : 'Question'}
                    {current.quantity > 0 && ` · ${num(current.quantity)} unités`}
                    {current.budget > 0 && ` · budget ${fcfa(current.budget)}`}
                    {current.product && <> · <Link to={`/produits/${current.product}`}>voir le produit</Link></>}
                  </p>
                </header>
                <InquiryThread inquiry={current} viewer="client" onSend={send} disabled={current.status === 'Clos'} />
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

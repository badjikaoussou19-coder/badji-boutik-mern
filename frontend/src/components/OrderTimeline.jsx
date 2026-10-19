import { formatDateTime } from '../utils.js';

const FLOW = ['En attente', 'Confirmée', 'Expédiée', 'Livrée'];

// Suivi de commande : étapes franchies, avec la date quand elle est connue
export default function OrderTimeline({ order }) {
  if (order.status === 'Annulée') {
    const at = order.history?.find((h) => h.status === 'Annulée')?.at;
    return <p className="tag tag-red">Commande annulée{at ? ` le ${formatDateTime(at)}` : ''}</p>;
  }
  const reached = FLOW.indexOf(order.status);
  return (
    <ol className="timeline" aria-label="Suivi de commande">
      {FLOW.map((s, i) => {
        const at = order.history?.find((h) => h.status === s)?.at || (i === 0 ? order.createdAt : null);
        return (
          <li key={s} className={i <= reached ? 'done' : ''}>
            <span className="dot" />
            <strong>{s}</strong>
            {i <= reached && at && <span className="muted small">{formatDateTime(at)}</span>}
          </li>
        );
      })}
    </ol>
  );
}

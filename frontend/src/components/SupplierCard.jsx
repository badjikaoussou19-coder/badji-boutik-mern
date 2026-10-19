// Fiche vendeur (style Alibaba) : vérifié, ancienneté, note, réactivité, livraison, réachat, marchés
export default function SupplierCard({ supplier }) {
  if (!supplier) return null;
  return (
    <section className="card supplier-card">
      <div className="supplier-head">
        <div className="supplier-logo" aria-hidden="true">{supplier.name[0]}</div>
        <div>
          <strong>{supplier.name}</strong>
          <div className="muted small">{[supplier.city, supplier.country].filter(Boolean).join(', ')} · {supplier.yearsActive} an{supplier.yearsActive > 1 ? 's' : ''}</div>
        </div>
        {supplier.verified && <span className="verified">✔ Vérifié</span>}
      </div>
      <div className="supplier-stats">
        <div><strong>{supplier.rating?.toFixed(1)}/5</strong><span>Note de la boutique</span></div>
        <div><strong>≤ {supplier.responseHours} h</strong><span>Temps de réponse</span></div>
        <div><strong>≥ {supplier.onTimeRate} %</strong><span>Livraison dans les délais</span></div>
        <div><strong>{supplier.repurchaseRate} %</strong><span>Taux de réachat</span></div>
      </div>
      {supplier.markets?.length > 0 && <p className="small muted">Marchés principaux : <strong>{supplier.markets.join(', ')}</strong></p>}
    </section>
  );
}

// Pagination simple : précédent, pages proches, suivant
export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const list = [];
  for (let p = 1; p <= pages; p++) if (p === 1 || p === pages || Math.abs(p - page) <= 1) list.push(p);
  const withGaps = list.flatMap((p, i) => (i > 0 && p - list[i - 1] > 1 ? ['…' + p, p] : [p]));

  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="btn btn-small" disabled={page <= 1} onClick={() => onChange(page - 1)}>‹ Précédent</button>
      {withGaps.map((p) =>
        typeof p === 'string' ? <span key={p} className="muted">…</span> : (
          <button key={p} className={`btn btn-small ${p === page ? 'btn-primary' : ''}`} aria-current={p === page ? 'page' : undefined} onClick={() => onChange(p)}>{p}</button>
        )
      )}
      <button className="btn btn-small" disabled={page >= pages} onClick={() => onChange(page + 1)}>Suivant ›</button>
    </nav>
  );
}

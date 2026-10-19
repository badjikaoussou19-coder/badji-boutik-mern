import { Link } from 'react-router-dom';
import ProductImage from './ProductImage.jsx';
import Countdown from './Countdown.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import FavoriteButton from './FavoriteButton.jsx';
import Stars from './Stars.jsx';
import { fcfa, num, priceRange, flashActive } from '../utils.js';

// Carte produit : badge de remise, ancien prix, note, quantité minimum, ventes, livraison gratuite, vendeur vérifié
export default function ProductCard({ product, rank }) {
  const { add } = useCart();
  const { isAdmin } = useAuth();
  const out = product.stock <= 0;
  const { min, max, tiered } = priceRange(product);
  const flash = flashActive(product);
  const moq = product.moq || 1;

  return (
    <article className="card product-card">
      <div className="card-media">
        <Link to={`/produits/${product._id}`}>
          <ProductImage product={product} />
        </Link>
        <FavoriteButton productId={product._id} />
        {product.discountPercent > 0 && <span className="badge-discount">−{product.discountPercent} %</span>}
        {rank && <span className="badge-rank">#{rank}</span>}
      </div>
      <div className="product-body">
        {flash && <Countdown until={product.flashSaleEnds} compact />}
        <h3><Link to={`/produits/${product._id}`}>{product.name}</Link></h3>
        {product.ratingCount > 0 && (
          <span className="rating-line"><Stars value={product.ratingAvg} /> <span className="muted small">({num(product.ratingCount)})</span></span>
        )}
        <div className="price-line">
          <strong className="price">{tiered ? `${num(min)} – ${num(max)} FCFA` : fcfa(product.price)}</strong>
          {product.oldPrice > product.price && <s className="old-price">{fcfa(product.oldPrice)}</s>}
        </div>
        <div className="meta-line">
          {moq > 1 && <span>MOQ : {moq} pièces</span>}
          {product.sold > 0 && <span>{num(product.sold)} vendus</span>}
        </div>
        <div className="chip-line">
          {product.freeShipping && <span className="mini-tag mini-green">Livraison gratuite</span>}
          {product.supplier?.verified && <span className="mini-tag mini-blue">✔ Vérifié</span>}
        </div>
        <div className="product-foot">
          {out ? (
            <span className="tag tag-red">Épuisé</span>
          ) : (
            !isAdmin && <button className="btn btn-small btn-primary" onClick={() => add(product, moq)}>Ajouter au panier</button>
          )}
        </div>
      </div>
    </article>
  );
}

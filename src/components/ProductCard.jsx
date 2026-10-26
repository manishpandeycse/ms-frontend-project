import { Link } from 'react-router-dom';
import { money } from '../utils/format';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductCard({ p }) {
  const { add } = useCart();
  const { user } = useAuth();
  const canBuy = !user || user.role === 'customer';
  return (
    <article className="card product">
      <Link to={`/products/${p._id}`} className="thumb">{p.images?.[0] ? <img src={p.images[0]} alt={p.name} /> : <span>{p.name[0]}</span>}</Link>
      <div className="body">
        <small className="muted">{p.category} · {p.retailer?.shopName}</small>
        <Link to={`/products/${p._id}`}><h3>{p.name}</h3></Link>
        <div className="row between">
          <strong>{money(p.price)}</strong>
          {canBuy && <button className="btn sm" disabled={p.stock < 1} onClick={() => add(p)}>{p.stock < 1 ? 'Sold out' : 'Add to cart'}</button>}
        </div>
      </div>
    </article>
  );
}

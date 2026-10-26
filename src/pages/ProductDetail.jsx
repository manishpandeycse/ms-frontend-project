import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { errMsg, money } from '../utils/format';

export default function ProductDetail() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const { add } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => { api.get(`/products/${id}`).then((r) => setP(r.data.product)).catch((e) => setError(errMsg(e))); }, [id]);
  if (error) return <p className="error">{error}</p>;
  if (!p) return <p className="muted">Loading...</p>;

  return (
    <div className="detail">
      <div className="thumb big">{p.images?.[0] ? <img src={p.images[0]} alt={p.name} /> : <span>{p.name[0]}</span>}</div>
      <div className="stack">
        <small className="muted">{p.category} · sold by {p.retailer?.shopName}</small>
        <h1>{p.name}</h1>
        <p>{p.description}</p>
        <h2>{money(p.price)}</h2>
        <small className={p.stock < 5 ? 'warn' : 'muted'}>{p.stock < 1 ? 'Out of stock' : `${p.stock} in stock`}</small>
        {(!user || user.role === 'customer') && (
          <div className="row gap">
            <input type="number" min="1" max={Math.min(p.stock, 20)} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} style={{ width: 80 }} />
            <button className="btn" disabled={p.stock < 1} onClick={() => { add(p, qty); nav('/cart'); }}>Add to cart</button>
          </div>
        )}
      </div>
    </div>
  );
}

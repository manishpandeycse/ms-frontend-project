import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { money } from '../utils/format';

export default function Cart() {
  const { items, setQty, remove, subtotal } = useCart();
  const nav = useNavigate();
  if (!items.length) return <div className="pad"><h2>Your cart is empty</h2><p className="muted">Browse the shop and add something you like.</p><Link className="btn" to="/">Browse products</Link></div>;
  return (
    <section>
      <h1>Your cart</h1>
      <div className="stack">
        {items.map((i) => (
          <div className="card pad row between wrap" key={i.id}>
            <div><strong>{i.name}</strong><div className="muted">{money(i.price)} each</div></div>
            <div className="row gap">
              <input type="number" min="1" max={Math.min(i.stock, 20)} value={i.qty} onChange={(e) => setQty(i.id, Number(e.target.value) || 1)} style={{ width: 80 }} />
              <strong>{money(i.price * i.qty)}</strong>
              <button className="link" onClick={() => remove(i.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div className="row between pad"><h3>Subtotal</h3><h3>{money(subtotal)}</h3></div>
      <small className="muted">Shipping and GST are calculated by the server at checkout.</small>
      <div className="row"><button className="btn" onClick={() => nav('/checkout')}>Continue to checkout</button></div>
    </section>
  );
}

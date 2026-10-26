import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { errMsg, money } from '../utils/format';
import { StatusTag } from '../components/OrderList';

// Confirms the payment with the server, then polls until the status settles.
export default function OrderSuccess() {
  const { id } = useParams();
  const { clear } = useCart();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const tries = useRef(0);

  useEffect(() => {
    let live = true;
    let timer;
    const tick = async () => {
      try {
        let { data } = await api.get(`/orders/${id}`);
        if (data.order.status === 'pending_payment' && data.order.payment.provider === 'stripe') {
          ({ data } = await api.post('/payments/stripe/confirm', { orderId: id }));
        }
        if (!live) return;
        setOrder(data.order);
        if (data.order.status === 'pending_payment' && tries.current++ < 8) timer = setTimeout(tick, 2500);
        else if (data.order.status !== 'pending_payment') clear();
      } catch (e) { if (live) setError(errMsg(e)); }
    };
    tick();
    return () => { live = false; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!order) return <p className="muted pad">Confirming your payment...</p>;
  const ok = !['pending_payment', 'cancelled', 'expired'].includes(order.status);

  return (
    <section className="narrow stack">
      <h1>{ok ? 'Thank you, your order is confirmed' : order.status === 'pending_payment' ? 'Waiting for payment confirmation' : 'This order was not completed'}</h1>
      <div className="card pad stack">
        <div className="row between"><span>Order #{order._id.slice(-8).toUpperCase()}</span><StatusTag status={order.status} /></div>
        <div className="row between"><span>Total</span><strong>{money(order.total, order.currency)}</strong></div>
      </div>
      {order.status === 'pending_payment' && <p className="muted">Your bank is still confirming. This page updates automatically; you will not be charged twice.</p>}
      <div className="row gap"><Link className="btn" to="/orders">View my orders</Link><Link className="btn ghost" to="/">Keep shopping</Link></div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import OrderList from '../components/OrderList';
import { errMsg } from '../utils/format';

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const load = () => api.get('/orders').then((r) => setOrders(r.data.items)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);

  const cancel = async (id) => { try { await api.post(`/orders/${id}/cancel`); load(); } catch (e) { setError(errMsg(e)); } };

  return (
    <section>
      <h1>My orders</h1>
      {error && <p className="error">{error}</p>}
      {orders && <OrderList orders={orders} renderActions={(o) => o.status === 'pending_payment' && (
        <>
          {o.payment.provider === 'stripe' && <Link className="btn sm" to={`/orders/${o._id}/success`}>Check payment status</Link>}
          <button className="link" onClick={() => cancel(o._id)}>Cancel order</button>
        </>
      )} />}
    </section>
  );
}

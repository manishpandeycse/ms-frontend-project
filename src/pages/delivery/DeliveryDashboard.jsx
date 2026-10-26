import { useEffect, useState } from 'react';
import api from '../../api/client';
import OrderList from '../../components/OrderList';
import { errMsg } from '../../utils/format';

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const load = () => api.get('/orders').then((r) => setOrders(r.data.items)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);
  const deliver = async (id) => { try { await api.patch(`/orders/${id}/status`, { status: 'delivered' }); load(); } catch (e) { setError(errMsg(e)); } };
  return (
    <section>
      <h1>Deliveries</h1>
      {error && <p className="error">{error}</p>}
      <OrderList orders={orders} showCustomer renderActions={(o) => o.status === 'shipped' && <button className="btn sm" onClick={() => deliver(o._id)}>Mark delivered</button>} />
    </section>
  );
}

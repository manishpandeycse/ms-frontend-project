import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';
import OrderList from '../../components/OrderList';
import { errMsg, money } from '../../utils/format';

function Overview() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/admin/stats').then((r) => setS(r.data)).catch(() => {}); }, []);
  if (!s) return <p className="muted">Loading...</p>;
  const cards = [['Users', s.users], ['Active retailers', s.retailers], ['Retailers awaiting approval', s.pendingRetailers], ['Live products', s.products], ['Orders', s.orders], ['Revenue', money(s.revenue)]];
  return <div className="grid stats">{cards.map(([k, v]) => <div className="card pad" key={k}><small className="muted">{k}</small><h2>{v}</h2></div>)}</div>;
}

function Users() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(() => api.get('/admin/users', { params: { q: q || undefined } }).then((r) => setUsers(r.data.items)).catch((e) => setError(errMsg(e))), [q]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const patch = async (id, body) => { setError(''); try { await api.patch(`/admin/users/${id}`, body); load(); } catch (e) { setError(errMsg(e)); } };

  return (
    <div className="stack">
      <input placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
      {error && <p className="error">{error}</p>}
      <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th /></tr></thead>
        <tbody>{users.map((u) => (
          <tr key={u.id}>
            <td>{u.name}{u.shopName && <small className="muted"><br />{u.shopName}</small>}</td>
            <td>{u.email}</td>
            <td><select value={u.role} onChange={(e) => patch(u.id, { role: e.target.value })}>
              {['customer', 'retailer', 'delivery', 'admin'].map((r) => <option key={r}>{r}</option>)}</select></td>
            <td>{u.isActive ? 'Active' : 'Deactivated'}{u.role === 'retailer' && <small className="muted"><br />{u.retailerStatus}</small>}</td>
            <td className="row gap">
              {u.role === 'retailer' && u.retailerStatus !== 'approved' && <button className="btn sm" onClick={() => patch(u.id, { retailerStatus: 'approved' })}>Approve</button>}
              {u.role === 'retailer' && u.retailerStatus === 'pending' && <button className="btn ghost sm" onClick={() => patch(u.id, { retailerStatus: 'rejected' })}>Reject</button>}
              <button className="link" onClick={() => patch(u.id, { isActive: !u.isActive })}>{u.isActive ? 'Deactivate' : 'Reactivate'}</button>
            </td>
          </tr>))}
        </tbody>
      </table></div>
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const load = () => api.get('/orders').then((r) => setOrders(r.data.items)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);
  const refund = async (id) => {
    if (!window.confirm('Refund this order to the customer?')) return;
    try { await api.post(`/admin/orders/${id}/refund`); load(); } catch (e) { setError(errMsg(e)); }
  };
  return (
    <div className="stack">
      {error && <p className="error">{error}</p>}
      <OrderList orders={orders} showCustomer renderActions={(o) => ['paid', 'processing', 'refund_required'].includes(o.status) && <button className="btn ghost sm" onClick={() => refund(o._id)}>Refund</button>} />
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const tabs = { overview: <Overview />, users: <Users />, orders: <Orders /> };
  return (
    <section>
      <h1>Admin</h1>
      <div className="tabs">{Object.keys(tabs).map((t) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}</div>
      {tabs[tab]}
    </section>
  );
}

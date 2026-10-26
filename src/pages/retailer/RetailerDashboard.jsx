import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import OrderList from '../../components/OrderList';
import { errMsg, money } from '../../utils/format';

const EMPTY = { name: '', description: '', price: '', stock: '', category: '', image: '' };

export default function RetailerDashboard() {
  const { user } = useAuth();
  const approved = user.retailerStatus === 'approved';
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    if (!approved) return;
    api.get('/products/mine').then((r) => setProducts(r.data.items)).catch((e) => setError(errMsg(e)));
    api.get('/orders').then((r) => setOrders(r.data.items)).catch((e) => setError(errMsg(e)));
  };
  useEffect(load, [approved]);

  const submit = async (e) => {
    e.preventDefault(); setError('');
    const body = {
      name: form.name, description: form.description, category: form.category,
      price: Math.round(Number(form.price) * 100), stock: Number(form.stock),
      images: form.image ? [form.image] : [],
    };
    try {
      if (editing) await api.patch(`/products/${editing}`, body); else await api.post('/products', body);
      setForm(EMPTY); setEditing(null); load();
    } catch (err) { setError(errMsg(err)); }
  };
  const edit = (p) => { setEditing(p._id); setForm({ name: p.name, description: p.description, price: p.price / 100, stock: p.stock, category: p.category, image: p.images?.[0] || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const remove = async (id) => { if (window.confirm('Remove this product from the shop?')) { try { await api.delete(`/products/${id}`); load(); } catch (e) { setError(errMsg(e)); } } };
  const setStatus = async (id, status) => { try { await api.patch(`/orders/${id}/status`, { status }); load(); } catch (e) { setError(errMsg(e)); } };
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (!approved) {
    return <section className="narrow"><h1>Retailer dashboard</h1><p className="warn">{user.retailerStatus === 'rejected' ? 'Your retailer application was not approved. Contact support for details.' : 'Your shop is awaiting admin approval. You can list products as soon as it is approved.'}</p></section>;
  }

  return (
    <section className="stack">
      <h1>{user.shopName}</h1>
      {error && <p className="error">{error}</p>}
      <form className="card pad stack" onSubmit={submit}>
        <h3>{editing ? 'Edit product' : 'Add a product'}</h3>
        <div className="row gap wrap">
          <label>Name<input required value={form.name} onChange={f('name')} /></label>
          <label>Category<input required value={form.category} onChange={f('category')} /></label>
          <label>Price (INR)<input required type="number" min="1" step="0.01" value={form.price} onChange={f('price')} /></label>
          <label>Stock<input required type="number" min="0" step="1" value={form.stock} onChange={f('stock')} /></label>
        </div>
        <label>Image URL (optional)<input type="url" value={form.image} onChange={f('image')} /></label>
        <label>Description<textarea rows="3" value={form.description} onChange={f('description')} /></label>
        <div className="row gap"><button className="btn">{editing ? 'Save changes' : 'Add product'}</button>{editing && <button type="button" className="link" onClick={() => { setEditing(null); setForm(EMPTY); }}>Cancel edit</button>}</div>
      </form>

      <h2>Your products</h2>
      <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Price</th><th>Stock</th><th>Status</th><th /></tr></thead>
        <tbody>{products.map((p) => (
          <tr key={p._id}><td>{p.name}</td><td>{money(p.price)}</td><td>{p.stock}</td><td>{p.isActive ? 'Live' : 'Removed'}</td>
            <td className="row gap"><button className="link" onClick={() => edit(p)}>Edit</button>{p.isActive && <button className="link" onClick={() => remove(p._id)}>Remove</button>}</td></tr>))}
        </tbody>
      </table></div>

      <h2>Orders to fulfil</h2>
      <OrderList orders={orders} showCustomer renderActions={(o) => (
        <>
          {o.status === 'paid' && <button className="btn sm" onClick={() => setStatus(o._id, 'processing')}>Start processing</button>}
          {o.status === 'processing' && <button className="btn sm" onClick={() => setStatus(o._id, 'shipped')}>Mark shipped</button>}
        </>
      )} />
    </section>
  );
}

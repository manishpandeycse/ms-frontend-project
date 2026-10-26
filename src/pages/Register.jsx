import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../utils/format';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'customer', shopName: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const payload = { ...f, shopName: f.role === 'retailer' ? f.shopName : undefined };
      const u = await register(payload);
      nav(u.role === 'retailer' ? '/retailer' : '/', { replace: true });
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <form className="narrow stack" onSubmit={submit}>
      <h1>Create your account</h1>
      <label>I want to<select value={f.role} onChange={set('role')}><option value="customer">Shop as a customer</option><option value="retailer">Sell as a retailer</option></select></label>
      <label>Full name<input required value={f.name} onChange={set('name')} /></label>
      {f.role === 'retailer' && <label>Shop name<input required value={f.shopName} onChange={set('shopName')} /></label>}
      <label>Email<input type="email" required autoComplete="email" value={f.email} onChange={set('email')} /></label>
      <label>Password<input type="password" required autoComplete="new-password" minLength={8} value={f.password} onChange={set('password')} /></label>
      <small className="muted">At least 8 characters with upper-case, lower-case and a number.</small>
      {f.role === 'retailer' && <small className="muted">Retailer accounts are reviewed by an admin before you can list products.</small>}
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
      <small className="muted">Already registered? <Link to="/login">Sign in</Link></small>
    </form>
  );
}

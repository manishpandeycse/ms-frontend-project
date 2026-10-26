import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const HOME_BY_ROLE = { admin: '/admin', retailer: '/retailer', delivery: '/delivery' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const nav = useNavigate();

  return (
    <header className="nav">
      <Link to="/" className="brand">ShopNest</Link>
      <nav>
        <NavLink to="/">Shop</NavLink>
        {(!user || user.role === 'customer') && <NavLink to="/cart">Cart{count > 0 && <span className="badge">{count}</span>}</NavLink>}
        {user?.role === 'customer' && <NavLink to="/orders">My orders</NavLink>}
        {user && HOME_BY_ROLE[user.role] && <NavLink to={HOME_BY_ROLE[user.role]}>Dashboard</NavLink>}
        {user ? (
          <button className="link" onClick={async () => { await logout(); nav('/'); }}>Sign out ({user.name.split(' ')[0]})</button>
        ) : (
          <>
            <NavLink to="/login">Sign in</NavLink>
            <NavLink to="/register" className="pill">Create account</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}

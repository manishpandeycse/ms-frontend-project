import { Link, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import RetailerDashboard from './pages/retailer/RetailerDashboard';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute roles={['customer']} />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id/success" element={<OrderSuccess />} />
          </Route>
          <Route element={<ProtectedRoute roles={['admin']} />}><Route path="/admin" element={<AdminDashboard />} /></Route>
          <Route element={<ProtectedRoute roles={['retailer', 'admin']} />}><Route path="/retailer" element={<RetailerDashboard />} /></Route>
          <Route element={<ProtectedRoute roles={['delivery', 'admin']} />}><Route path="/delivery" element={<DeliveryDashboard />} /></Route>

          <Route path="*" element={<div className="pad"><h2>Page not found</h2><Link to="/">Back to the shop</Link></div>} />
        </Routes>
      </main>
    </>
  );
}

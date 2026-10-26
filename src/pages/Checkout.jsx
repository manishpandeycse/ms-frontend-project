import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { errMsg, money } from '../utils/format';

const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve();
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = resolve;
  s.onerror = () => reject(new Error('Could not load Razorpay. Check your connection and try again.'));
  document.body.appendChild(s);
});

function StripeForm({ order, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  const pay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || busy) return;
    setBusy(true); onError('');
    const { error } = await stripe.confirmPayment({
      elements, redirect: 'if_required',
      confirmParams: { return_url: `${window.location.origin}/orders/${order._id}/success` },
    });
    if (error) { onError(error.message || 'Payment failed. Please try another payment method.'); setBusy(false); return; }
    // Paid without redirect: the success page confirms with the server and waits for the webhook if needed
    nav(`/orders/${order._id}/success`);
  };

  return (
    <form onSubmit={pay} className="stack">
      <PaymentElement />
      <button className="btn" disabled={!stripe || busy}>{busy ? 'Processing...' : `Pay ${money(order.total, order.currency)}`}</button>
    </form>
  );
}

export default function Checkout() {
  const { items, subtotal } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [provider, setProvider] = useState('razorpay');
  const [addr, setAddr] = useState({ fullName: user?.name || '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'IN' });
  const [session, setSession] = useState(null); // { order, payment, stripePromise }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const field = (k, label, props = {}) => (
    <label>{label}<input value={addr[k]} onChange={(e) => setAddr({ ...addr, [k]: e.target.value })} {...props} /></label>
  );

  const startPayment = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const body = { provider, shippingAddress: { ...addr, line2: addr.line2 || undefined }, items: items.map((i) => ({ productId: i.id, qty: i.qty })) };
      const { data } = await api.post('/orders', body);
      if (provider === 'stripe') {
        setSession({ ...data, stripePromise: loadStripe(data.payment.publishableKey) });
      } else {
        setSession(data);
        await openRazorpay(data);
      }
    } catch (err) {
      setError(errMsg(err));
    } finally { setBusy(false); }
  };

  const verifyWithRetry = async (payload, attempts = 3) => {
    for (let i = 0; i < attempts; i += 1) {
      try { await api.post('/payments/razorpay/verify', payload); return; } catch (e) {
        if (i === attempts - 1) return; // webhook will still settle it; success page keeps polling
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  };

  const openRazorpay = async ({ order, payment }) => {
    await loadRazorpay();
    const rz = new window.Razorpay({
      key: payment.keyId, amount: payment.amount, currency: payment.currency, order_id: payment.razorpayOrderId,
      name: 'ShopNest', description: `Order ${order._id.slice(-8).toUpperCase()}`,
      prefill: { name: addr.fullName, email: user?.email, contact: addr.phone },
      theme: { color: '#0f766e' },
      handler: async (resp) => { await verifyWithRetry(resp); nav(`/orders/${order._id}/success`); },
      modal: { ondismiss: () => setError('Payment window closed. You can reopen it below or cancel the order.') },
    });
    rz.on('payment.failed', (r) => setError(r.error?.description || 'Payment failed. You can try again.'));
    rz.open();
  };

  const cancel = async () => {
    try { await api.post(`/orders/${session.order._id}/cancel`); } catch (e) { setError(errMsg(e)); return; }
    setSession(null); setError('');
  };

  if (!items.length && !session) return <p className="pad">Your cart is empty.</p>;

  if (session) {
    return (
      <section className="narrow stack">
        <h1>Complete payment</h1>
        <p className="muted">Order total {money(session.order.total, session.order.currency)} (items {money(session.order.itemsTotal)}, shipping {money(session.order.shipping)}, GST {money(session.order.tax)}). Stock is held for 30 minutes.</p>
        {error && <p className="error">{error}</p>}
        {session.payment.provider === 'stripe' ? (
          <Elements stripe={session.stripePromise} options={{ clientSecret: session.payment.clientSecret }}>
            <StripeForm order={session.order} onError={setError} />
          </Elements>
        ) : (
          <button className="btn" onClick={() => openRazorpay(session).catch((e) => setError(errMsg(e)))}>Open Razorpay checkout</button>
        )}
        <button className="link" onClick={cancel}>Cancel order and edit cart</button>
      </section>
    );
  }

  return (
    <form className="narrow stack" onSubmit={startPayment}>
      <h1>Checkout</h1>
      <div className="card pad stack">
        <h3>Shipping address</h3>
        {field('fullName', 'Full name', { required: true })}
        {field('phone', 'Phone', { required: true, inputMode: 'tel' })}
        {field('line1', 'Address line 1', { required: true })}
        {field('line2', 'Address line 2 (optional)')}
        <div className="row gap">{field('city', 'City', { required: true })}{field('state', 'State', { required: true })}</div>
        {field('postalCode', 'PIN code', { required: true })}
      </div>
      <div className="card pad stack">
        <h3>Payment method</h3>
        <label className="radio"><input type="radio" checked={provider === 'razorpay'} onChange={() => setProvider('razorpay')} /> Razorpay (UPI, cards, netbanking, wallets)</label>
        <label className="radio"><input type="radio" checked={provider === 'stripe'} onChange={() => setProvider('stripe')} /> Stripe (international cards and more)</label>
      </div>
      <div className="row between"><strong>Items</strong><strong>{money(subtotal)}</strong></div>
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Preparing secure payment...' : 'Continue to payment'}</button>
    </form>
  );
}

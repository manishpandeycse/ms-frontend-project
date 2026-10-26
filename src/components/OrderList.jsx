import { money } from '../utils/format';

const LABEL = {
  pending_payment: 'Awaiting payment', paid: 'Paid', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered',
  cancelled: 'Cancelled', expired: 'Expired', refunded: 'Refunded', refund_required: 'Refund needed',
};
export const StatusTag = ({ status }) => <span className={`tag ${status}`}>{LABEL[status] || status}</span>;

export default function OrderList({ orders, renderActions, showCustomer }) {
  if (!orders.length) return <p className="muted">No orders yet.</p>;
  return (
    <div className="stack">
      {orders.map((o) => (
        <article className="card pad" key={o._id}>
          <div className="row between wrap">
            <div>
              <strong>#{o._id.slice(-8).toUpperCase()}</strong>
              <small className="muted"> · {new Date(o.createdAt).toLocaleString()}</small>
              {showCustomer && o.user && <small className="muted"> · {o.user.name} ({o.user.email})</small>}
            </div>
            <StatusTag status={o.status} />
          </div>
          <ul className="lines">
            {o.items.map((i) => <li key={i.product}><span>{i.qty} × {i.name}</span><span>{money(i.price * i.qty, o.currency)}</span></li>)}
          </ul>
          <div className="row between wrap">
            <small className="muted">{o.shippingAddress?.city}, {o.shippingAddress?.state} · paid via {o.payment?.provider}</small>
            <strong>{money(o.total, o.currency)}</strong>
          </div>
          {renderActions && <div className="row gap">{renderActions(o)}</div>}
        </article>
      ))}
    </div>
  );
}

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);
const KEY = 'mn_cart_v1';

// Cart holds only display data; the server re-prices everything at checkout.
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable */ } }, [items]);

  const add = (p, qty = 1) => setItems((cur) => {
    const found = cur.find((i) => i.id === p._id);
    const max = Math.min(p.stock, 20);
    if (found) return cur.map((i) => (i.id === p._id ? { ...i, qty: Math.min(i.qty + qty, max) } : i));
    return [...cur, { id: p._id, name: p.name, price: p.price, stock: p.stock, image: p.images?.[0], qty: Math.min(qty, max) }];
  });
  const setQty = (id, qty) => setItems((cur) => cur.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.stock, 20)) } : i)));
  const remove = (id) => setItems((cur) => cur.filter((i) => i.id !== id));
  const clear = () => setItems([]);

  const value = useMemo(() => ({
    items, add, setQty, remove, clear,
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.qty * i.price, 0),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

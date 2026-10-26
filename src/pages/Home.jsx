import { useEffect, useState } from 'react';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import { errMsg } from '../utils/format';

export default function Home() {
  const [params, setParams] = useState({ q: '', category: '', sort: 'newest', page: 1 });
  const [data, setData] = useState({ items: [], pages: 1 });
  const [cats, setCats] = useState([]);
  const [state, setState] = useState({ loading: true, error: '' });

  useEffect(() => { api.get('/products/categories').then((r) => setCats(r.data.categories)).catch(() => {}); }, []);
  useEffect(() => {
    let live = true;
    setState({ loading: true, error: '' });
    const t = setTimeout(() => {
      api.get('/products', { params: { ...params, limit: 12 } })
        .then((r) => live && setData(r.data))
        .catch((e) => live && setState({ loading: false, error: errMsg(e) }))
        .finally(() => live && setState((s) => ({ ...s, loading: false })));
    }, 250); // debounce typing
    return () => { live = false; clearTimeout(t); };
  }, [params]);

  const set = (patch) => setParams((p) => ({ ...p, page: 1, ...patch }));

  return (
    <section>
      <div className="hero">
        <h1>Your World of Shopping.</h1>
        <p className="muted">Everything You Love, All in One Place.</p>
      </div>
      <div className="row gap wrap filters">
        <input placeholder="Search products" value={params.q} onChange={(e) => set({ q: e.target.value })} />
        <select value={params.category} onChange={(e) => set({ category: e.target.value })}>
          <option value="">All categories</option>
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={params.sort} onChange={(e) => set({ sort: e.target.value })}>
          <option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option>
        </select>
      </div>
      {state.error && <p className="error">{state.error}</p>}
      {state.loading ? <p className="muted">Loading products...</p> : data.items.length === 0 ? <p className="muted">No products match your search. Try a different keyword or category.</p> : (
        <div className="grid">{data.items.map((p) => <ProductCard key={p._id} p={p} />)}</div>
      )}
      <div className="row gap center">
        <button className="btn ghost sm" disabled={params.page <= 1} onClick={() => setParams((p) => ({ ...p, page: p.page - 1 }))}>Previous</button>
        <small className="muted">Page {params.page} of {data.pages}</small>
        <button className="btn ghost sm" disabled={params.page >= data.pages} onClick={() => setParams((p) => ({ ...p, page: p.page + 1 }))}>Next</button>
      </div>
    </section>
  );
}

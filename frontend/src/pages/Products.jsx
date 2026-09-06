import { useState, useEffect, useCallback, useRef } from 'react';
import { Package, Plus, Pencil, Trash2, Search, X, Check, AlertTriangle, ChevronLeft, ChevronRight, Filter, Tag, DollarSign, BarChart2, Image, ToggleLeft } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Food', 'Books', 'Sports', 'Home', 'Beauty', 'Other'];
const PER_PAGE = 8;

const fmtCurr = (n) => '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

/* ─── Stock badge ─────────────────────────────────────────────── */
function StockBadge({ stock }) {
  const s = stock === 0
    ? { label: 'Out of stock', color: '#ff4d6d', bg: 'rgba(255,77,109,0.1)', border: 'rgba(255,77,109,0.2)' }
    : stock <= 5
    ? { label: `Low (${stock})`, color: '#f5a623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.2)' }
    : { label: `${stock} in stock`, color: '#00e5a0', bg: 'rgba(0,229,160,0.1)', border: 'rgba(0,229,160,0.2)' };
  return <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>{s.label}</span>;
}

/* ─── Status badge ────────────────────────────────────────────── */
function StatusBadge({ status }) {
  return status === 'active'
    ? <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)', color: '#00e5a0' }}>Active</span>
    : <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: 'rgba(74,85,104,0.15)', border: '1px solid rgba(74,85,104,0.2)', color: '#4a5568' }}>Inactive</span>;
}

/* ─── Category badge ──────────────────────────────────────────── */
const CAT_ACCENT = {
  Electronics: '#00d4ff', Clothing: '#ec4899', Food: '#f97316', Books: '#06b6d4',
  Sports: '#00e5a0', Home: '#f5a623', Beauty: '#e879f9', Other: '#4a5568',
};
function CatBadge({ cat }) {
  const c = CAT_ACCENT[cat] || '#4a5568';
  return <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: `${c}14`, border: `1px solid ${c}28`, color: c, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{cat}</span>;
}

/* ─── Product Modal ───────────────────────────────────────────── */
function ProductModal({ mode, product, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: product?.name || '', description: product?.description || '',
    price: product?.price ?? '', category: product?.category || 'Electronics',
    stock: product?.stock ?? '', imageUrl: product?.imageUrl || '',
    status: product?.status || 'active',
  });
  const [touched, setTouched] = useState({ name: false, price: false, stock: false, imageUrl: false });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleBlur = (field) => setTouched(t => ({ ...t, [field]: true }));

  const isNameValid = form.name.trim().length >= 2;
  const isPriceValid = form.price !== '' && !isNaN(Number(form.price)) && Number(form.price) >= 0;
  const isStockValid = form.stock === '' || (!isNaN(Number(form.stock)) && Number(form.stock) >= 0 && Number.isInteger(Number(form.stock)));
  const isImageValid = !form.imageUrl || /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))|(https?:\/\/.*)$/i.test(form.imageUrl.trim());

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true, price: true, stock: true, imageUrl: true });

    if (!isNameValid) return toast.error('Product name must be at least 2 characters');
    if (!isPriceValid) return toast.error('Please enter a valid price (positive number)');
    if (!isStockValid) return toast.error('Stock must be a non-negative whole number');
    if (!isImageValid) return toast.error('Please enter a valid Image URL');

    onSubmit({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock) || 0,
      imageUrl: form.imageUrl.trim(),
    });
  };

  const labelStyle = { display: 'block', fontFamily: 'Sora, sans-serif', fontSize: 10, fontWeight: 700, color: '#2d3748', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 };
  const inputCls = { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '10px 14px', color: '#f0f6fc', fontFamily: 'Sora, sans-serif', fontSize: 13 };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="modal-enter" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, width: '100%', maxWidth: 460, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: '#0d1117', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {mode === 'create' ? <Plus size={15} style={{ color: '#00e5a0' }} /> : <Pencil size={15} style={{ color: '#00e5a0' }} />}
            </div>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, color: '#f0f6fc' }}>{mode === 'create' ? 'Add Product' : 'Edit Product'}</h2>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4a5568' }}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Product Name *</label>
            <div style={{ position: 'relative' }}>
              <Package size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: touched.name && !isNameValid ? '#ff4d6d' : '#2d3748' }} />
              <input
                type="text"
                placeholder="e.g. iPhone 15 Pro"
                required
                value={form.name}
                onChange={e => set('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                className="input-field"
                style={{
                  paddingLeft: 34,
                  borderColor: touched.name ? (isNameValid ? 'rgba(0, 229, 160, 0.4)' : 'rgba(255, 77, 109, 0.5)') : undefined,
                }}
              />
            </div>
            {touched.name && !isNameValid && (
              <p style={{ fontSize: 11, color: '#ff4d6d', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <X size={12} /> Name must be at least 2 characters
              </p>
            )}
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea placeholder="Optional description..." value={form.description} onChange={e => set('description', e.target.value)} rows={2} style={{ ...inputCls, resize: 'none' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Price (₹) *</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={12} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: touched.price && !isPriceValid ? '#ff4d6d' : '#2d3748' }} />
                <input
                  type="number"
                  placeholder="999"
                  min="0"
                  step="0.01"
                  required
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  onBlur={() => handleBlur('price')}
                  className="input-field"
                  style={{
                    paddingLeft: 32,
                    borderColor: touched.price ? (isPriceValid ? 'rgba(0, 229, 160, 0.4)' : 'rgba(255, 77, 109, 0.5)') : undefined,
                  }}
                />
              </div>
              {touched.price && !isPriceValid && (
                <p style={{ fontSize: 11, color: '#ff4d6d', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <X size={12} /> Positive price required
                </p>
              )}
            </div>
            <div>
              <label style={labelStyle}>Stock</label>
              <div style={{ position: 'relative' }}>
                <BarChart2 size={12} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: touched.stock && !isStockValid ? '#ff4d6d' : '#2d3748' }} />
                <input
                  type="number"
                  placeholder="100"
                  min="0"
                  value={form.stock}
                  onChange={e => set('stock', e.target.value)}
                  onBlur={() => handleBlur('stock')}
                  className="input-field"
                  style={{
                    paddingLeft: 32,
                    borderColor: touched.stock ? (isStockValid ? 'rgba(0, 229, 160, 0.4)' : 'rgba(255, 77, 109, 0.5)') : undefined,
                  }}
                />
              </div>
              {touched.stock && !isStockValid && (
                <p style={{ fontSize: 11, color: '#ff4d6d', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <X size={12} /> Valid whole number
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Category *</label>
              <div style={{ position: 'relative' }}>
                <Tag size={12} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#2d3748', zIndex: 1 }} />
                <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field" style={{ paddingLeft: 32, cursor: 'pointer' }}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c} style={{ background: '#0d1117' }}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <div style={{ position: 'relative' }}>
                <ToggleLeft size={12} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#2d3748', zIndex: 1 }} />
                <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field" style={{ paddingLeft: 32, cursor: 'pointer' }}>
                  <option value="active" style={{ background: '#0d1117' }}>Active</option>
                  <option value="inactive" style={{ background: '#0d1117' }}>Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Image URL</label>
            <div style={{ position: 'relative' }}>
              <Image size={12} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: touched.imageUrl && !isImageValid ? '#ff4d6d' : '#2d3748' }} />
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={form.imageUrl}
                onChange={e => set('imageUrl', e.target.value)}
                onBlur={() => handleBlur('imageUrl')}
                className="input-field"
                style={{
                  paddingLeft: 32,
                  borderColor: touched.imageUrl && !isImageValid ? 'rgba(255, 77, 109, 0.5)' : undefined,
                }}
              />
            </div>
            {touched.imageUrl && !isImageValid && (
              <p style={{ fontSize: 11, color: '#ff4d6d', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <X size={12} /> Please enter a valid URL
              </p>
            )}
            {form.imageUrl && isImageValid && (
              <div style={{ marginTop: 10, width: 56, height: 56, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                <img src={form.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, color: '#4a5568', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px 16px', background: '#00e5a0', border: 'none', borderRadius: 9, color: '#080c14', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: loading ? 0.6 : 1, transition: 'all 0.15s' }}>
              {loading ? <><span className="spinner" style={{ borderTopColor: '#080c14' }} /> Saving...</> : <><Check size={14} />{mode === 'create' ? 'Add Product' : 'Save Changes'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Delete Modal ────────────────────────────────────────────── */
function DeleteModal({ product, onClose, onConfirm, loading }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="modal-enter" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, width: '100%', maxWidth: 360, padding: 24, boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={16} style={{ color: '#ff4d6d' }} />
          </div>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 700, color: '#f0f6fc' }}>Delete Product</h2>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
          <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, color: '#8b9ab0' }}>{product.name}</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2d3748' }}>{fmtCurr(product.price)} · {product.category}</p>
        </div>
        <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, color: '#4a5568', marginBottom: 20, lineHeight: 1.6 }}>
          This action <span style={{ color: '#ff4d6d', fontWeight: 700 }}>cannot be undone</span>.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, color: '#4a5568', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '10px', background: '#ff4d6d', border: 'none', borderRadius: 9, color: 'white', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: loading ? 0.6 : 1 }}>
            {loading ? <><span className="spinner" /> Deleting...</> : <><Trash2 size={14} /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Products Main Page ──────────────────────────────────────── */
export default function Products() {
  const { user: me } = useAuth();
  const isSuperAdmin = me?.role === 'superadmin';
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const timer = useRef(null);
  const [debSearch, setDebSearch] = useState('');
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setDebSearch(search); setPage(1); }, 400);
    return () => clearTimeout(timer.current);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit: PER_PAGE, ...(debSearch && { search: debSearch }), ...(category !== 'All' && { category }) });
      const res = await api.get(`/products?${p}`);
      setProducts(res.data.products || []);
      setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [page, debSearch, category]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const doCreate = async (data) => {
    setActionLoading(true);
    try { await api.post('/products', data); toast.success('Product added!'); setModal(null); fetchProducts(); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };
  const doUpdate = async (data) => {
    setActionLoading(true);
    try { await api.put(`/products/${selected._id}`, data); toast.success('Product updated!'); setModal(null); fetchProducts(); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };
  const doDelete = async () => {
    setActionLoading(true);
    try { await api.delete(`/products/${selected._id}`); toast.success('Product deleted!'); setModal(null); fetchProducts(); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const cardStyle = { background: '#111720', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' };
  const thStyle = { padding: '12px 20px', textAlign: 'left', fontFamily: 'Sora, sans-serif', fontSize: 10, fontWeight: 700, color: '#2d3748', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' };
  const tdStyle = { padding: '13px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }} className="fade-up">
        <div>
          <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 11, fontWeight: 700, color: '#00e5a0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>— Inventory</p>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#f0f6fc', letterSpacing: '-0.03em', marginBottom: 4 }}>Products</h1>
          <p style={{ fontSize: 13, color: '#4a5568' }}>Manage inventory with full CRUD.</p>
        </div>
        <button onClick={() => setModal('create')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#00e5a0', border: 'none', borderRadius: 10, color: '#080c14', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 24px rgba(0,229,160,0.3)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Table card */}
      <div className="fade-up" style={{ ...cardStyle, animationDelay: '0.1s', animationFillMode: 'both' }}>
        {/* Filters bar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Filter size={12} style={{ color: '#2d3748' }} />
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => { setCategory(c); setPage(1); }} style={{
                padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                fontFamily: 'Sora, sans-serif', fontSize: 11, fontWeight: 600,
                background: category === c ? 'rgba(0,229,160,0.1)' : 'rgba(255,255,255,0.03)',
                border: category === c ? '1px solid rgba(0,229,160,0.2)' : '1px solid rgba(255,255,255,0.06)',
                color: category === c ? '#00e5a0' : '#4a5568', transition: 'all 0.15s',
              }}>{c}</button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#2d3748' }} />
            <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '8px 14px', paddingLeft: 32, color: '#f0f6fc', fontFamily: 'Sora, sans-serif', fontSize: 12, width: 190 }} />
            {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#2d3748', display: 'flex', padding: 0 }}><X size={12} /></button>}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(0,229,160,0.15)', borderTopColor: '#00e5a0', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
          </div>
        ) : products.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', textAlign: 'center' }}>
            <Package size={28} style={{ color: '#2d3748', marginBottom: 10 }} />
            <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, color: '#4a5568', fontWeight: 600 }}>No products found</p>
            <a href="#" onClick={e => { e.preventDefault(); setModal('create'); }} style={{ fontFamily: 'Sora, sans-serif', fontSize: 12, color: '#00e5a0', textDecoration: 'none', marginTop: 8 }}>Add your first product →</a>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p._id} className="table-row">
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {p.imageUrl ? (
                            <div style={{ width: 36, height: 36, borderRadius: 9, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                              <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                            </div>
                          ) : (
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 11, color: '#00e5a0', flexShrink: 0 }}>
                              {getInitials(p.name)}
                            </div>
                          )}
                          <div>
                            <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, color: '#8b9ab0', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                            {p.description && <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 11, color: '#2d3748', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}><CatBadge cat={p.category} /></td>
                      <td style={tdStyle}><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: '#8b9ab0' }}>{fmtCurr(p.price)}</span></td>
                      <td style={tdStyle}><StockBadge stock={p.stock} /></td>
                      <td style={tdStyle}><StatusBadge status={p.status} /></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => { setSelected(p); setModal('edit'); }} style={{ width: 30, height: 30, background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4a5568', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,160,0.12)'; e.currentTarget.style.color = '#00e5a0'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,229,160,0.06)'; e.currentTarget.style.color = '#4a5568'; }}>
                            <Pencil size={13} />
                          </button>
                          {isSuperAdmin && (
                            <button onClick={() => { setSelected(p); setModal('delete'); }} style={{ width: 30, height: 30, background: 'rgba(255,77,109,0.06)', border: '1px solid rgba(255,77,109,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4a5568', transition: 'all 0.15s' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,109,0.12)'; e.currentTarget.style.color = '#ff4d6d'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,77,109,0.06)'; e.currentTarget.style.color = '#4a5568'; }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 11, color: '#2d3748' }}>
                  {((page-1)*PER_PAGE)+1}–{Math.min(page*PER_PAGE, pagination.total)} of {pagination.total}
                </p>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4a5568', opacity: page===1?0.4:1 }}><ChevronLeft size={14} /></button>
                  {Array.from({length: pagination.pages}, (_, i) => (
                    <button key={i} onClick={() => setPage(i+1)} style={{ width: 30, height: 30, background: page===i+1?'#00e5a0':'rgba(255,255,255,0.03)', border: page===i+1?'1px solid #00e5a0':'1px solid rgba(255,255,255,0.07)', borderRadius: 7, color: page===i+1?'#080c14':'#4a5568', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i+1}</button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p+1))} disabled={page===pagination.pages} style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4a5568', opacity: page===pagination.pages?0.4:1 }}><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {modal === 'create' && <ProductModal mode="create" onClose={() => setModal(null)} onSubmit={doCreate} loading={actionLoading} />}
      {modal === 'edit' && selected && <ProductModal mode="edit" product={selected} onClose={() => setModal(null)} onSubmit={doUpdate} loading={actionLoading} />}
      {modal === 'delete' && selected && <DeleteModal product={selected} onClose={() => setModal(null)} onConfirm={doDelete} loading={actionLoading} />}
    </div>
  );
}

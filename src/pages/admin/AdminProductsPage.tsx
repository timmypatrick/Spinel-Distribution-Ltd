import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, Edit2, Trash2, CheckCircle, 
  XCircle, Filter, ChevronLeft, ChevronRight, X 
} from 'lucide-react';
import { api } from '../../services/api';
import { Product, Category, Brand } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';

export const AdminProductsPage: React.FC = () => {
  const { success, error } = useToast();
  const { formatPrice } = useCurrency();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [description, setDescription] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [compareAtPriceUsd, setCompareAtPriceUsd] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [condition, setCondition] = useState('NEW');
  const [image, setImage] = useState('');
  const [specsJson, setSpecsJson] = useState('{}');
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminProducts(page, 15, search, selectedCat);
      setProducts(data.products);
      setTotalCount(data.total);
    } catch (err) {
      console.error('Failed to load admin products:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMeta = async () => {
    try {
      const [catsData, brandsData] = await Promise.all([
        api.getCategories(),
        api.getBrands()
      ]);
      setCategories(catsData.categories);
      setBrands(brandsData.brands);
    } catch (err) {
      console.error('Failed to load categories/brands:', err);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, search, selectedCat]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setCategoryId(categories[0]?.id || '');
    setBrandId(brands[0]?.id || '');
    setDescription('');
    setPriceUsd('');
    setCompareAtPriceUsd('');
    setStockQuantity('10');
    setCondition('NEW');
    setImage('https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80');
    setSpecsJson(JSON.stringify({ "Ports": "48x 1GbE PoE+", "Stacking": "480 Gbps" }, null, 2));
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setCategoryId(p.category_id);
    setBrandId(p.brand_id || '');
    setDescription(p.description);
    setPriceUsd(String(p.price_usd));
    setCompareAtPriceUsd(p.compare_at_price_usd ? String(p.compare_at_price_usd) : '');
    setStockQuantity(String(p.stock_quantity));
    setCondition(p.condition);
    setImage(p.image);
    setSpecsJson(JSON.stringify(p.specifications || {}, null, 2));
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let parsedSpecs = {};
      try {
        parsedSpecs = JSON.parse(specsJson);
      } catch (err) {
        throw new Error('Specifications must be valid JSON');
      }

      const payload = {
        name,
        sku,
        category_id: categoryId,
        brand_id: brandId || undefined,
        description,
        price_usd: Number(priceUsd),
        compare_at_price_usd: compareAtPriceUsd ? Number(compareAtPriceUsd) : undefined,
        stock_quantity: Number(stockQuantity),
        condition: condition as any,
        image,
        specifications: parsedSpecs,
        is_active: true
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        success(`Product ${sku} updated successfully`);
      } else {
        await api.createProduct(payload);
        success(`Product ${sku} created successfully`);
      }

      setIsModalOpen(false);
      loadProducts();
    } catch (err: unknown) {
      error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, pSku: string) => {
    if (!window.confirm(`Are you sure you want to archive product ${pSku}?`)) return;
    try {
      await api.deleteProduct(id);
      success(`Product ${pSku} deleted.`);
      loadProducts();
    } catch (err: unknown) {
      error((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Catalogue Inventory</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Total of {totalCount} items in active enterprise inventory
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by SKU, product name, or brand..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <select
            value={selectedCat}
            onChange={(e) => {
              setSelectedCat(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            <option value="">All Departments</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-slate-400 font-mono">
          Page {page} • Showing {products.length} of {totalCount}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold">
            <tr>
              <th className="p-3.5">Image & Name</th>
              <th className="p-3.5">SKU</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Brand</th>
              <th className="p-3.5 text-right">Price (USD)</th>
              <th className="p-3.5 text-center">Stock</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={8} className="p-4">
                    <div className="h-4 bg-slate-800 rounded w-3/4" />
                  </td>
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  No products found matching criteria.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                  <td className="p-3.5 flex items-center gap-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-10 h-10 object-contain bg-slate-950 rounded border border-slate-800 p-1 shrink-0"
                    />
                    <div className="font-semibold text-white line-clamp-1 max-w-xs">{p.name}</div>
                  </td>
                  <td className="p-3.5 font-mono text-amber-400 font-semibold">{p.sku}</td>
                  <td className="p-3.5 text-slate-400">{p.category_name}</td>
                  <td className="p-3.5 text-slate-400">{p.brand_name || 'N/A'}</td>
                  <td className="p-3.5 text-right font-bold text-white">${p.price_usd.toFixed(2)}</td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                      p.stock_quantity > 10 ? 'text-emerald-400 bg-emerald-500/10' :
                      p.stock_quantity > 0 ? 'text-amber-400 bg-amber-500/10' :
                      'text-rose-400 bg-rose-500/10'
                    }`}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                        title="Edit Product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.sku)}
                        className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded font-semibold text-xs flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <span className="text-slate-400 text-xs font-mono">Page {page}</span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 15 >= totalCount}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded font-semibold text-xs flex items-center gap-1"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden text-xs">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">
                {editingProduct ? `Edit Product: ${editingProduct.sku}` : 'Add New Hardware SKU'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:ring-1 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Stock Keeping Unit (SKU) *</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingProduct)}
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="e.g. CSCO-C9300-48P"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:ring-1 focus:ring-amber-400 focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Department / Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:ring-1 focus:ring-amber-400 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Manufacturer Brand</label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:ring-1 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="">Select Brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Price (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={priceUsd}
                    onChange={(e) => setPriceUsd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:ring-1 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Compare-At Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={compareAtPriceUsd}
                    onChange={(e) => setCompareAtPriceUsd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:ring-1 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:ring-1 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Image URL</label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:ring-1 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:ring-1 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Specifications (JSON format)</label>
                <textarea
                  rows={3}
                  value={specsJson}
                  onChange={(e) => setSpecsJson(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-emerald-400 font-mono text-[11px] focus:ring-1 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded shadow"
                >
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

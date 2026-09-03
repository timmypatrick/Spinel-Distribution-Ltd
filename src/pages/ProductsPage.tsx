import React, { useState, useEffect } from 'react';
import { 
  Filter, ChevronRight, Star, X, Check, ArrowUpDown, 
  ChevronLeft, SlidersHorizontal, PackageSearch 
} from 'lucide-react';
import { Product, Category, Brand, ProductFilterParams } from '../types';
import { ProductCard } from '../components/ProductCard';
import { api } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

interface ProductsPageProps {
  categories: Category[];
  brands: Brand[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  searchQuery: string;
  onSelectProduct: (slug: string) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  categories,
  brands,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSelectProduct
}) => {
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);

  // Filter states
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [condition, setCondition] = useState<string>('');
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: ProductFilterParams = {
        page,
        limit: 20,
        sort_by: sortBy as any
      };
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedBrand) params.brand_id = selectedBrand;
      if (searchQuery) params.search = searchQuery;
      if (minPrice) params.min_price = Number(minPrice);
      if (maxPrice) params.max_price = Number(maxPrice);
      if (inStockOnly) params.availability = 'IN_STOCK';
      if (condition) params.condition = condition;
      if (minRating) params.min_rating = minRating;

      const data = await api.getProducts(params);
      setProducts(data.products);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, selectedCategory, selectedBrand, inStockOnly, condition, minRating, sortBy, searchQuery]);

  const handleApplyPriceFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleClearFilters = () => {
    onSelectCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setCondition('');
    setMinRating(undefined);
    setSortBy('featured');
    setPage(1);
  };

  const activeCategoryObj = categories.find(c => c.id === selectedCategory);
  const hasActiveFilters = Boolean(selectedCategory || selectedBrand || minPrice || maxPrice || inStockOnly || condition || minRating || searchQuery);

  return (
    <div className="bg-[#eaeded] min-h-screen pb-16">
      {/* Search Header Banner */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-8">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-bold text-slate-900 text-sm">
              {searchQuery ? `Results for "${searchQuery}"` : activeCategoryObj ? activeCategoryObj.name : 'All Enterprise Hardware'}
            </span>
            {/* Requirement 10: "The public website MUST NOT display the total number of products in the catalogue." */}
            <span className="text-slate-400">| Page {page}</span>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-100 border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Avg. Customer Review</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>

            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="lg:hidden flex items-center gap-1 bg-slate-100 border border-slate-300 px-3 py-1 rounded font-semibold text-slate-800"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-6 flex gap-6">
        {/* Amazon-style Left Facet Filter Sidebar */}
        <aside className={`lg:w-64 shrink-0 space-y-6 ${mobileFiltersOpen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden lg:block'}`}>
          {mobileFiltersOpen && (
            <div className="flex items-center justify-between border-b pb-3 mb-4 lg:hidden">
              <h3 className="font-bold text-base text-slate-900">Filters</h3>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-1 text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear all filters</span>
            </button>
          )}

          {/* Department / Category Facet */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-xs">
            <h4 className="font-bold text-slate-900 mb-2.5 text-sm">Department</h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => {
                    onSelectCategory('');
                    setPage(1);
                  }}
                  className={`w-full text-left py-1 px-1.5 rounded transition-colors ${
                    !selectedCategory ? 'font-bold text-amber-700 bg-amber-50' : 'text-slate-700 hover:text-amber-700'
                  }`}
                >
                  All Departments
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      onSelectCategory(cat.id);
                      setPage(1);
                    }}
                    className={`w-full text-left py-1 px-1.5 rounded transition-colors ${
                      selectedCategory === cat.id ? 'font-bold text-amber-700 bg-amber-50' : 'text-slate-700 hover:text-amber-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Brands Facet */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-xs">
            <h4 className="font-bold text-slate-900 mb-2.5 text-sm">Featured Brands</h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => {
                    setSelectedBrand('');
                    setPage(1);
                  }}
                  className={`w-full text-left py-1 px-1.5 rounded transition-colors ${
                    !selectedBrand ? 'font-bold text-amber-700 bg-amber-50' : 'text-slate-700 hover:text-amber-700'
                  }`}
                >
                  All Brands
                </button>
              </li>
              {brands.map((brand) => (
                <li key={brand.id}>
                  <button
                    onClick={() => {
                      setSelectedBrand(brand.id);
                      setPage(1);
                    }}
                    className={`w-full text-left py-1 px-1.5 rounded transition-colors ${
                      selectedBrand === brand.id ? 'font-bold text-amber-700 bg-amber-50' : 'text-slate-700 hover:text-amber-700'
                    }`}
                  >
                    {brand.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Price Range Facet */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-xs">
            <h4 className="font-bold text-slate-900 mb-2.5 text-sm">Price (USD)</h4>
            <form onSubmit={handleApplyPriceFilter} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min $"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 p-1.5 border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  placeholder="Max $"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 p-1.5 border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold rounded transition-colors"
              >
                Go
              </button>
            </form>
          </div>

          {/* Availability & Condition */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-xs space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">Availability & Condition</h4>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  setPage(1);
                }}
                className="rounded text-amber-500 focus:ring-amber-400"
              />
              <span>In Stock Only</span>
            </label>

            <div className="pt-2 border-t border-slate-100">
              <span className="font-semibold text-slate-600 mb-1.5 block">Condition:</span>
              <div className="space-y-1">
                {['', 'NEW', 'REFURBISHED', 'OPEN_BOX'].map((c) => (
                  <button
                    key={c || 'all'}
                    onClick={() => {
                      setCondition(c);
                      setPage(1);
                    }}
                    className={`block w-full text-left py-0.5 ${
                      condition === c ? 'font-bold text-amber-700' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {c ? c.replace('_', ' ') : 'All Conditions'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Reviews Rating Facet */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-xs">
            <h4 className="font-bold text-slate-900 mb-2 text-sm">Customer Review</h4>
            <div className="space-y-1.5">
              {[4, 3, 2].map((stars) => (
                <button
                  key={stars}
                  onClick={() => {
                    setMinRating(minRating === stars ? undefined : stars);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1.5 w-full py-0.5 ${
                    minRating === stars ? 'font-bold text-amber-700' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < stars ? 'fill-amber-400' : 'fill-slate-200 text-slate-200'}`}
                      />
                    ))}
                  </div>
                  <span>& Up</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Results Grid */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse space-y-3">
                  <div className="h-44 bg-slate-100 rounded" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                  <div className="h-6 bg-slate-200 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
              <PackageSearch className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">No products found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No matching items matched your current filters. Try resetting the criteria or searching for different keywords.
              </p>
              <button
                onClick={handleClearFilters}
                className="mt-4 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-lg transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onSelect={onSelectProduct}
                  />
                ))}
              </div>

              {/* Public Pagination Bar (Requirement 10: NO total item count displayed!) */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between text-xs">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded border ${
                    page <= 1
                      ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300 font-semibold'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <span className="font-semibold text-slate-700">
                  Page {page}
                </span>

                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={!hasMore}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded border ${
                    !hasMore
                      ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300 font-semibold'
                  }`}
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

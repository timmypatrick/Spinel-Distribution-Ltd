import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { OrdersPage } from './pages/OrdersPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { AuthPage } from './pages/AuthPage';
import { AutomatedTestsPage } from './pages/AutomatedTestsPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminImportPage } from './pages/admin/AdminImportPage';
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { api } from './services/api';
import { Category, Brand, Product, Order } from './types';

const MainAppContent: React.FC = () => {
  const { user, isAdmin } = useAuth();

  // Navigation State
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [adminTab, setAdminTab] = useState<string>('dashboard');

  // Shared Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string>('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [catsRes, brandsRes, prodsRes] = await Promise.all([
          api.getCategories(),
          api.getBrands(),
          api.getProducts({ limit: 10, sort_by: 'featured' })
        ]);
        setCategories(catsRes.categories);
        setBrands(brandsRes.brands);
        setFeaturedProducts(prodsRes.products);
      } catch (err) {
        console.error('Failed to load initial storefront data:', err);
      }
    };
    loadInitialData();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setSearchQuery('');
    setCurrentPage('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (slug: string) => {
    setSelectedProductSlug(slug);
    setCurrentPage('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderCompleted = (order: Order) => {
    setCompletedOrder(order);
    setCurrentPage('order-success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If in Admin Section
  if (currentPage === 'admin') {
    return (
      <AdminLayout
        currentTab={adminTab}
        onSelectTab={setAdminTab}
        onExitAdmin={() => {
          setCurrentPage('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        {adminTab === 'dashboard' && <AdminDashboardPage onNavigateTab={setAdminTab} />}
        {adminTab === 'products' && <AdminProductsPage />}
        {adminTab === 'import' && <AdminImportPage />}
        {adminTab === 'inventory' && <AdminInventoryPage />}
        {adminTab === 'orders' && <AdminOrdersPage />}
        {adminTab === 'users' && <AdminUsersPage />}
        {adminTab === 'settings' && <AdminSettingsPage />}
        {adminTab === 'audit' && <AdminAuditPage />}
        {adminTab === 'tests' && <AutomatedTestsPage onNavigate={setCurrentPage} />}
      </AdminLayout>
    );
  }

  // Full-screen Automated Tests Page (accessible from footer or nav)
  if (currentPage === 'tests') {
    return <AutomatedTestsPage onNavigate={setCurrentPage} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#eaeded] font-sans antialiased text-slate-900 selection:bg-amber-400 selection:text-slate-950">
      {/* Amazon-style Global Navigation Bar */}
      <Header
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onNavigate={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Flyout Quick Cart Drawer */}
      <CartDrawer
        onNavigate={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Active Page View */}
      <div className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            categories={categories}
            featuredProducts={featuredProducts}
            onSelectCategory={handleSelectCategory}
            onSelectProduct={handleSelectProduct}
            onNavigate={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentPage === 'products' && (
          <ProductsPage
            categories={categories}
            brands={brands}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentPage === 'product-detail' && (
          <ProductDetailPage
            slug={selectedProductSlug}
            onBack={() => setCurrentPage('products')}
            onNavigate={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentPage === 'cart' && (
          <CartPage
            onNavigate={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage
            onOrderCompleted={handleOrderCompleted}
            onNavigate={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentPage === 'order-success' && completedOrder && (
          <OrderSuccessPage
            order={completedOrder}
            onNavigate={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentPage === 'orders' && (
          <OrdersPage
            onNavigate={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentPage === 'invoices' && (
          <InvoicesPage
            onNavigate={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentPage === 'auth' && (
          <AuthPage
            onSuccess={() => setCurrentPage('home')}
            onNavigate={(page) => setCurrentPage(page)}
          />
        )}
      </div>

      {/* Global Enterprise Footer */}
      <Footer
        onNavigate={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <MainAppContent />
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

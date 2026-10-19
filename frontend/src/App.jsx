import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import CookieBanner from './components/CookieBanner.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';
import Home from './pages/Home.jsx';
import Products from './pages/Products.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import MyOrders from './pages/MyOrders.jsx';
import Profile from './pages/Profile.jsx';
import Favorites from './pages/Favorites.jsx';
import MyInquiries from './pages/MyInquiries.jsx';
import RequestQuote from './pages/RequestQuote.jsx';
import Help from './pages/Help.jsx';
import Invoice from './pages/Invoice.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import AdminProductForm from './pages/admin/AdminProductForm.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminCustomers from './pages/admin/AdminCustomers.jsx';
import AdminReviews from './pages/admin/AdminReviews.jsx';
import AdminInquiries from './pages/admin/AdminInquiries.jsx';
import AdminCoupons from './pages/admin/AdminCoupons.jsx';
import AdminSuppliers from './pages/admin/AdminSuppliers.jsx';
import AdminBanners from './pages/admin/AdminBanners.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';

// Mise en page de la boutique : en-tête, contenu, pied de page
function StoreLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return (
    <>
      <Navbar />
      <main className="container page">
        <Outlet />
      </main>
      <Footer />
      <CookieBanner />
    </>
  );
}

const client = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/produits" element={<Products />} />
        <Route path="/produits/:id" element={<ProductDetail />} />
        <Route path="/panier" element={<Cart />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="/inscription" element={<Register />} />
        <Route path="/aide" element={<Help />} />
        <Route path="/demande-devis" element={<RequestQuote />} />

        <Route path="/mes-commandes" element={client(<MyOrders />)} />
        <Route path="/mes-devis" element={client(<MyInquiries />)} />
        <Route path="/favoris" element={client(<Favorites />)} />
        <Route path="/profil" element={client(<Profile />)} />
        <Route path="/facture/:id" element={client(<Invoice />)} />

        <Route path="*" element={<p className="empty">Cette page n'existe pas.</p>} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="produits" element={<AdminProducts />} />
        <Route path="produits/nouveau" element={<AdminProductForm />} />
        <Route path="produits/:id" element={<AdminProductForm />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="vendeurs" element={<AdminSuppliers />} />
        <Route path="bannieres" element={<AdminBanners />} />
        <Route path="commandes" element={<AdminOrders />} />
        <Route path="devis" element={<AdminInquiries />} />
        <Route path="promos" element={<AdminCoupons />} />
        <Route path="avis" element={<AdminReviews />} />
        <Route path="clients" element={<AdminCustomers />} />
        <Route path="parametres" element={<AdminSettings />} />
        <Route path="*" element={<p className="empty">Cette page n'existe pas.</p>} />
      </Route>
    </Routes>
  );
}

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import CardDetailPage from './pages/CardDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes with Navbar/Footer */}
        <Route path="/" element={<><Navbar /><HomePage /><Footer /></>} />
        <Route path="/catalog" element={<><Navbar /><CatalogPage /><Footer /></>} />
        <Route path="/card/:id" element={<><Navbar /><CardDetailPage /><Footer /></>} />
        <Route path="/finalize-fulfillment" element={<><Navbar /><CheckoutPage /><Footer /></>} />
        <Route path="/orders" element={<><Navbar /><OrdersPage /><Footer /></>} />
        
        {/* Admin Routes without Navbar/Footer */}
        <Route path="/secure-admin-portal/login" element={<AdminLoginPage />} />
        <Route path="/secure-admin-portal" element={<AdminDashboard />} />

        {/* Legal Routes */}
        <Route path="/privacy" element={<><Navbar /><PrivacyPolicy /><Footer /></>} />
        <Route path="/terms" element={<><Navbar /><TermsOfService /><Footer /></>} />

        {/* Redirects for old routes (Stealth) */}
        <Route path="/admin" element={<Navigate to="/" replace />} />
        <Route path="/admin/*" element={<Navigate to="/" replace />} />
        <Route path="/checkout" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

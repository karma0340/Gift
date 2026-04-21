import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import CardDetailPage from './pages/CardDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes with Navbar/Footer */}
        <Route path="/" element={<><Navbar /><HomePage /><Footer /></>} />
        <Route path="/catalog" element={<><Navbar /><CatalogPage /><Footer /></>} />
        <Route path="/card/:id" element={<><Navbar /><CardDetailPage /><Footer /></>} />
        <Route path="/checkout" element={<><Navbar /><CheckoutPage /><Footer /></>} />
        <Route path="/orders" element={<><Navbar /><OrdersPage /><Footer /></>} />
        
        {/* Admin Routes without Navbar/Footer */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;

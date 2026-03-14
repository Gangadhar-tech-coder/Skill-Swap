/**
 * App root component with React Router setup.
 * Includes Navbar and all page routes.
 */
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Marketplace from './pages/Marketplace';
import MatchSuggestions from './pages/MatchSuggestions';
import SessionPage from './pages/SessionPage';
import WalletPage from './pages/Wallet';
import AdminDashboard from './pages/AdminDashboard';
import useAuthStore from './store/authStore';
import './index.css';

export default function App() {
  const { token, fetchProfile } = useAuthStore();

  // Fetch user profile on mount if token exists
  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
            <Route path="/matches" element={<ProtectedRoute><MatchSuggestions /></ProtectedRoute>} />
            <Route path="/session/:id" element={<ProtectedRoute><SessionPage /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

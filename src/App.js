import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from './context/UserContext';
import MainMap from './components/Map/MainMap';
import AdminPanel from './components/Admin/AdminPanel';
import AdminLogin from './components/Admin/AdminLogin';
import Login from './components/Login';
import { Toaster } from 'react-hot-toast';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentCanceled from './components/PaymentCanceled';
import LegalGateway from './components/LegalGateway';

function AppContent() {
  const { user, loading } = useUser();

   const hasAgreed = localStorage.getItem('croatoanLegalAgreed') === 'true';

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!hasAgreed && !window.location.pathname.startsWith('/admin')) {
    return <LegalGateway />;
  }

  return (
    <Routes>
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-canceled" element={<PaymentCanceled />} />
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/" />}
      />
      <Route
        path="/admin"
        element={!user ? <AdminLogin /> : <Navigate to="/admin/dashboard" />}
      />
      <Route
        path="/admin/dashboard"
        element={user ? <AdminPanel /> : <Navigate to="/admin" />}
      />

      <Route
        path="/"
        element={user ? <MainMap /> : <Navigate to="/login" />}
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: 'white',
            border: '1px solid #374151',
          },
          success: {
            style: {
              background: '#065f46',
              border: '1px solid #047857',
            },
          },
          error: {
            style: {
              background: '#7f1d1d',
              border: '1px solid #dc2626',
            },
          },
        }}
      />
    </Router>
  );
}
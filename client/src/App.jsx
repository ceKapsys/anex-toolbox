import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import QuotationGenerator from './pages/QuotationGenerator';
import InvoiceGenerator from './pages/InvoiceGenerator';
import InvoicesList from './pages/InvoicesList';
import QuotationsList from './pages/QuotationsList';
import Clients from './pages/Clients';
import Services from './pages/Services';
import Terms from './pages/Terms';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import Login from './pages/Login';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="invoices" element={<InvoicesList />} />
        <Route path="invoices/new" element={<InvoiceGenerator />} />
        <Route path="invoices/:id/edit" element={<InvoiceGenerator />} />
        <Route path="quotations" element={<QuotationsList />} />
        <Route path="quotations/new" element={<QuotationGenerator />} />
        <Route path="quotations/:id/edit" element={<QuotationGenerator />} />
        <Route path="clients" element={<Clients />} />
        <Route path="services" element={<Services />} />
        <Route path="terms" element={<Terms />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;


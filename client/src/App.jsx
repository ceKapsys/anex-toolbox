import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import QuotationGenerator from './pages/QuotationGenerator';
import InvoiceGenerator from './pages/InvoiceGenerator';
import InvoicesList from './pages/InvoicesList';
import QuotationsList from './pages/QuotationsList';
import Clients from './pages/Clients';

import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="invoices" element={<InvoicesList />} />
          <Route path="invoices/new" element={<InvoiceGenerator />} />
          <Route path="quotations" element={<QuotationsList />} />
          <Route path="quotations/new" element={<QuotationGenerator />} />
          <Route path="clients" element={<Clients />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

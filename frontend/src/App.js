// App.js — Iconic Estates India | Route Configuration — White & Gold theme
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Public pages
import HomePage           from './pages/HomePage';
import PropertiesPage     from './pages/PropertiesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import MarketPage         from './pages/MarketPage';
import CalculatorPage     from './pages/CalculatorPage';
import ExpertsPage        from './pages/ExpertsPage';
import ContactPage        from './pages/ContactPage';
import WishlistPage       from './pages/WishlistPage';
import ComparePage        from './pages/ComparePage';
import FloatingContact    from './components/FloatingContact';
import CompareBar         from './components/CompareBar';

// Admin pages
import AdminLogin      from './pages/admin/AdminLogin';
import AdminLayout     from './pages/admin/AdminLayout';
import AdminDashboard  from './pages/admin/AdminDashboard';
import AdminProperties from './pages/admin/AdminProperties';
import AdminLeads      from './pages/admin/AdminLeads';
import AdminInquiries  from './pages/admin/AdminInquiries';
import AdminTemplates  from './pages/admin/AdminTemplates';
import AdminBuilders   from './pages/admin/AdminBuilders';
import AdminUsers      from './pages/admin/AdminUsers';
import {
  AdminCivilEngineers,
  AdminInteriorDesigners,
  AdminExteriorDesigners,
} from './pages/admin/AdminEngineers';
import AdminMarket from './pages/admin/AdminMarket';

import './styles/global.css';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-center" style={{minHeight:'100vh', background:'var(--ivory)'}}>
      <div className="spinner"/>
    </div>
  );
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}

// Public layout wrapper
function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <FloatingContact />
      <CompareBar />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#fff',
              color: '#1A1209',
              border: '1px solid rgba(201,162,75,.3)',
              boxShadow: '0 4px 20px rgba(180,140,60,.15)',
            },
            success: { iconTheme: { primary: '#C9A24B', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#E74C3C', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* ── Public routes ── */}
          <Route path="/"              element={<PublicLayout><HomePage /></PublicLayout>} />
          <Route path="/properties"    element={<PublicLayout><PropertiesPage /></PublicLayout>} />
          <Route path="/properties/:id" element={<PublicLayout><PropertyDetailPage /></PublicLayout>} />
          <Route path="/market"        element={<PublicLayout><MarketPage /></PublicLayout>} />
          <Route path="/calculator"    element={<PublicLayout><CalculatorPage /></PublicLayout>} />
          <Route path="/experts"       element={<PublicLayout><ExpertsPage /></PublicLayout>} />
          <Route path="/contact"       element={<PublicLayout><ContactPage /></PublicLayout>} />
          <Route path="/wishlist"      element={<PublicLayout><WishlistPage /></PublicLayout>} />
          <Route path="/compare"       element={<PublicLayout><ComparePage /></PublicLayout>} />

          {/* ── Admin auth ── */}
          <Route path="/admin/login"   element={<AdminLogin />} />
          <Route path="/admin"         element={<Navigate to="/admin/dashboard" replace />} />

          {/* ── Admin protected layout ── */}
          <Route path="/admin" element={
            <ProtectedRoute><AdminLayout /></ProtectedRoute>
          }>
            <Route path="dashboard"  element={<AdminDashboard />} />
            <Route path="properties" element={<AdminProperties />} />
            <Route path="leads"      element={<AdminLeads />} />
            <Route path="inquiries"  element={<AdminInquiries />} />
            <Route path="templates"  element={<AdminTemplates />} />
            <Route path="builders"   element={<AdminBuilders />} />
            <Route path="engineers"  element={<AdminCivilEngineers />} />
            <Route path="interior"   element={<AdminInteriorDesigners />} />
            <Route path="exterior"   element={<AdminExteriorDesigners />} />
            <Route path="users"      element={<AdminUsers />} />
            <Route path="market"     element={<AdminMarket />} />
          </Route>

          {/* ── 404 ── */}
          <Route path="*" element={
            <PublicLayout>
              <div style={{
                minHeight:'80vh', display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                gap:24, textAlign:'center', paddingTop:72,
                background:'var(--ivory)',
              }}>
                <div style={{
                  fontFamily:'var(--ff-display)', fontSize:'6rem', fontWeight:700,
                  color:'var(--gold)', lineHeight:1,
                }}>404</div>
                <h2 className="display-3" style={{color:'var(--text-main)'}}>Page Not Found</h2>
                <p style={{color:'var(--mist)'}}>The page you're looking for doesn't exist.</p>
                <a href="/" className="btn btn-gold btn-lg">Return Home</a>
              </div>
            </PublicLayout>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
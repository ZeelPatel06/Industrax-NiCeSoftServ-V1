import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GlobalLoader from './components/GlobalLoader';
import SessionExpiredModal from './components/SessionExpiredModal';
import ModuleGuard from './components/ModuleGuard';

// Lazy-loaded pages — each loads only when the user navigates to it
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const Parts = lazy(() => import('./pages/Parts'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Orders = lazy(() => import('./pages/Orders'));
const Production = lazy(() => import('./pages/Production'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Materials = lazy(() => import('./pages/Materials'));
const BOM = lazy(() => import('./pages/BOM'));
const Employees = lazy(() => import('./pages/Employees'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Machines = lazy(() => import('./pages/Machines'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Offline = lazy(() => import('./pages/Offline'));
const DataManagement = lazy(() => import('./pages/DataManagement'));
const Landing = lazy(() => import('./pages/Landing'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Settings = lazy(() => import('./pages/Settings'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));

// Suspense fallback — minimal spinner while a page chunk loads
const PageFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color, #0a0a0f)' }}>
    <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary-color, #7c3aed)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

// Auth Check
const isAuthenticated = () => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo || userInfo === 'undefined') return false;
    const parsed = JSON.parse(userInfo);
    return parsed && parsed._id;
  } catch (e) {
    return false;
  }
};

const PrivateRoute = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  let userInfo = {};
  try {
    const stored = localStorage.getItem('userInfo');
    if (stored && stored !== 'undefined') userInfo = JSON.parse(stored);
  } catch (e) {
    console.error("Error parsing user info", e);
  }

  const selectedModules = userInfo.selectedModules || [];
  const hasOnboarded = Array.isArray(selectedModules) && selectedModules.length > 0;

  // If the user hasn't onboarded and is trying to access a regular protected page
  if (!hasOnboarded && userInfo.role === 'Owner') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="app-container">
      {isSidebarOpen && <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />}
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

const PublicRoute = ({ children }) => {
  if (!isAuthenticated()) return children;
  try {
    const stored = localStorage.getItem('userInfo');
    if (stored && stored !== 'undefined') {
      const userInfo = JSON.parse(stored);
      if (['Operator', 'Worker', 'Helper', 'Labour'].includes(userInfo?.role)) return <Navigate to="/production" replace />;
      if (userInfo?.role === 'Owner') {
        const hasOnboarded = Array.isArray(userInfo.selectedModules) && userInfo.selectedModules.length > 0;
        return <Navigate to={hasOnboarded ? '/dashboard' : '/onboarding'} replace />;
      }
    }
  } catch (e) { /* ignore */ }
  return <Navigate to="/dashboard" replace />;
};

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleSessionExpired = () => setIsSessionExpired(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, []);

  if (!isOnline) {
    return (
      <Suspense fallback={<PageFallback />}>
        <Offline />
      </Suspense>
    );
  }

  return (
    <>
      <GlobalLoader />
      <SessionExpiredModal
        isOpen={isSessionExpired}
        onClose={() => {
          setIsSessionExpired(false);
          localStorage.removeItem('userInfo');
          window.location.href = '/login';
        }}
      />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

          {/* Module Protected Routes */}
          <Route path="/products" element={<PrivateRoute><ModuleGuard module="products"><Products /></ModuleGuard></PrivateRoute>} />
          <Route path="/parts" element={<PrivateRoute><ModuleGuard module="parts"><Parts /></ModuleGuard></PrivateRoute>} />
          <Route path="/materials" element={<PrivateRoute><ModuleGuard module="materials"><Materials /></ModuleGuard></PrivateRoute>} />
          <Route path="/inventory" element={<PrivateRoute><ModuleGuard module="inventory"><Inventory /></ModuleGuard></PrivateRoute>} />
          <Route path="/bom" element={<PrivateRoute><ModuleGuard module="bom"><BOM /></ModuleGuard></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><ModuleGuard module="orders"><Orders /></ModuleGuard></PrivateRoute>} />
          <Route path="/production" element={<PrivateRoute><ModuleGuard module="production"><Production /></ModuleGuard></PrivateRoute>} />
          <Route path="/attendance" element={<PrivateRoute><ModuleGuard module="attendance"><Attendance /></ModuleGuard></PrivateRoute>} />
          <Route path="/employees" element={<PrivateRoute><ModuleGuard module="employees"><Employees /></ModuleGuard></PrivateRoute>} />
          <Route path="/invoices" element={<PrivateRoute><ModuleGuard module="invoices"><Invoices /></ModuleGuard></PrivateRoute>} />
          <Route path="/machines" element={<PrivateRoute><ModuleGuard module="machines"><Machines /></ModuleGuard></PrivateRoute>} />

          <Route path="/data-management" element={<PrivateRoute><DataManagement /></PrivateRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

          <Route path="/onboarding" element={isAuthenticated() ? <Onboarding /> : <Navigate to="/login" replace />} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;


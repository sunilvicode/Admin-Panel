import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Sidebar from './components/Sidebar';
import { Suspense, lazy } from 'react';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Overview = lazy(() => import('./pages/Overview'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const Products = lazy(() => import('./pages/Products'));

const LoadingFallback = () => (
  <div style={{ minHeight: '100vh', background: '#080c14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '2px solid rgba(0,212,255,0.15)',
        borderTopColor: '#00d4ff',
        animation: 'spin 0.7s linear infinite',
        margin: '0 auto 12px',
      }} />
      <p style={{ color: '#2d3748', fontSize: 13, fontFamily: 'Sora, sans-serif' }}>Loading...</p>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function DashboardLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080c14' }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', position: 'relative' }}>
        {/* Subtle grid overlay */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        {/* Glow in top-right */}
        <div style={{
          position: 'fixed', top: -100, right: -100, width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(0,131,255,0.04) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '28px 32px', maxWidth: 1280, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: '#111720',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#f0f6fc',
            fontFamily: 'Sora, sans-serif',
            fontSize: 13,
            borderRadius: 10,
          },
        }}
      />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="products" element={<Products />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

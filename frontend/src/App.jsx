import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Webhooks from './pages/Webhooks';
import WebhookForm from './pages/WebhookForm';
import WebhookLogs from './pages/WebhookLogs';
import Billing from './pages/Billing';
import Settings from './pages/Settings';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400 text-sm">Carregando...</div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LangProvider>
          <Routes>
            {/* Públicas */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

            {/* Protegidas */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Layout><Dashboard /></Layout>
              </PrivateRoute>
            } />
            <Route path="/webhooks" element={
              <PrivateRoute>
                <Layout><Webhooks /></Layout>
              </PrivateRoute>
            } />
            <Route path="/webhooks/new" element={
              <PrivateRoute>
                <Layout><WebhookForm /></Layout>
              </PrivateRoute>
            } />
            <Route path="/webhooks/:id/edit" element={
              <PrivateRoute>
                <Layout><WebhookForm /></Layout>
              </PrivateRoute>
            } />
            <Route path="/webhooks/:id/logs" element={
              <PrivateRoute>
                <Layout><WebhookLogs /></Layout>
              </PrivateRoute>
            } />
            <Route path="/billing" element={
              <PrivateRoute>
                <Layout><Billing /></Layout>
              </PrivateRoute>
            } />
            <Route path="/settings" element={
              <PrivateRoute>
                <Layout><Settings /></Layout>
              </PrivateRoute>
            } />

            {/* Redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </LangProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

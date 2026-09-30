import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import RegisterCandidate from './pages/RegisterCandidate';
import CandidateList from './pages/CandidateList';
import CandidateDetail from './pages/CandidateDetail';
import PublicRegister from './pages/PublicRegister';
import Layout from './components/Layout';
import './index.css';

function PrivateRoute({ children }) {
  const { admin, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-saffron" style={{ width: 40, height: 40, borderWidth: 4 }}></div>
        <p style={{ color: '#FF6B00', fontWeight: 600 }}>Loading RMSM...</p>
      </div>
    );
  }
  return admin ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'rmsm-toast',
            duration: 3500,
            style: { borderRadius: '10px', padding: '12px 16px' },
            success: { iconTheme: { primary: '#138808', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#dc2626',  secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* ── PUBLIC — no login needed ── */}
          <Route path="/join"  element={<PublicRegister />} />
          <Route path="/login" element={<LoginPage />} />

          {/* ── ADMIN PANEL — login required ── */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index          element={<Dashboard />} />
            <Route path="dashboard"                  element={<Dashboard />} />
            <Route path="register"                   element={<RegisterCandidate />} />
            <Route path="candidates"                 element={<CandidateList />} />
            <Route path="candidates/:id"             element={<CandidateDetail />} />
            <Route path="candidates/:id/edit"        element={<RegisterCandidate />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

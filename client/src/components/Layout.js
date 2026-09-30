import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import rmsmLogo from '../assets/rmsm-logo.png';

const navItems = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/register', icon: '📝', label: 'New Registration' },
  { to: '/candidates', icon: '👥', label: 'All Candidates' },
];

export default function Layout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = admin?.name
    ? admin.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <div className="app-wrapper">
      {/* Mobile overlay */}
      <div
        className={`overlay-sidebar ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src={rmsmLogo} alt="RMSM Logo" />
          <div className="sidebar-logo-text">
            <h3>RMSM</h3>
            <p>Rashtriya Modi Seva Mission</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Main Menu</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Public form link */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Public Form Link
          </div>
          <a
            href="/join"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', background: 'rgba(255,107,0,0.15)',
              borderRadius: 8, color: '#FF8C38', fontSize: 12, fontWeight: 600,
              textDecoration: 'none', transition: 'background 0.2s',
            }}
          >
            🔗 Share Registration Form
          </a>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>
            localhost:3000/join
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="admin-badge">
            <div className="admin-avatar">{initials}</div>
            <div className="admin-info">
              <div className="admin-name">{admin?.name || 'Admin'}</div>
              <div className="admin-role">Super Admin</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">🚪</button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        <div className="india-stripe" />
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1f2937' }}>
                {location.pathname === '/register' ? '📝 New Registration' :
                 location.pathname === '/candidates' ? '👥 Candidates' :
                 location.pathname.includes('/edit') ? '✏️ Edit Candidate' :
                 location.pathname.includes('/candidates/') ? '👤 Candidate Details' :
                 '🏠 Dashboard'}
              </h2>
              <p style={{ fontSize: 11, color: '#9ca3af' }}>
                सेवा | समर्पण | संस्कार
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1f2937' }}>{admin?.name}</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>Administrator</div>
            </div>
            <div className="admin-avatar">{initials}</div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

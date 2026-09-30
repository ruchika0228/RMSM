import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidateAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    candidateAPI.stats()
      .then(res => setStats(res.data.stats))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  const membershipColors = {
    Primary: '#FF6B00', Active: '#138808', Life: '#000080', Patron: '#C8A400'
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div className="spinner spinner-saffron" style={{ width: 40, height: 40, borderWidth: 4 }}></div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>🏠 Dashboard</h1>
          <p>राष्ट्रीय मोदी सेवा मिशन — Candidate Management Overview</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/register')}>
          ➕ New Registration
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeftColor: '#FF6B00' }}>
          <div className="stat-icon">👥</div>
          <div>
            <div className="stat-value">{stats?.total || 0}</div>
            <div className="stat-label">Total Candidates</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#138808' }}>
          <div className="stat-icon">✅</div>
          <div>
            <div className="stat-value">{stats?.active || 0}</div>
            <div className="stat-label">Active Members</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#000080' }}>
          <div className="stat-icon">📅</div>
          <div>
            <div className="stat-value">{stats?.today || 0}</div>
            <div className="stat-label">Registered Today</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#C8A400' }}>
          <div className="stat-icon">💰</div>
          <div>
            <div className="stat-value">₹{((stats?.revenue || 0) / 1000).toFixed(1)}K</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* Membership breakdown */}
        <div className="card">
          <div className="card-header">
            <h2>📊 Membership Types</h2>
          </div>
          <div className="card-body">
            {stats?.byMembership?.length ? (
              stats.byMembership.map(m => (
                <div key={m.membership_type} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{m.membership_type} Member</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: membershipColors[m.membership_type] || '#FF6B00' }}>{m.cnt}</span>
                  </div>
                  <div style={{ background: '#f3f4f6', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min((m.cnt / (stats.total || 1)) * 100, 100)}%`,
                      background: membershipColors[m.membership_type] || '#FF6B00',
                      borderRadius: 4,
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0', fontSize: 13 }}>
                No data yet. Register candidates to see stats.
              </p>
            )}
          </div>
        </div>

        {/* Top Districts */}
        <div className="card">
          <div className="card-header">
            <h2>📍 Top Districts</h2>
          </div>
          <div className="card-body">
            {stats?.byDistrict?.length ? (
              stats.byDistrict.slice(0, 7).map((d, i) => (
                <div key={d.district} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', background: '#FF6B00',
                    color: '#fff', fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 13, color: '#374151' }}>{d.district}</span>
                  <span className="badge badge-saffron">{d.cnt}</span>
                </div>
              ))
            ) : (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0', fontSize: 13 }}>
                No district data yet.
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2>⚡ Quick Actions</h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-primary w-full" onClick={() => navigate('/register')}>
                📝 Register New Candidate
              </button>
              <button className="btn btn-navy w-full" onClick={() => navigate('/candidates')}>
                👥 View All Candidates
              </button>
              <button className="btn btn-secondary w-full" onClick={() => navigate('/candidates?card_generated=0')}>
                🪪 Pending Card Generation
              </button>
            </div>

            <div style={{ marginTop: 20, padding: '14px', background: 'linear-gradient(135deg, #fff9f5, #fff)', borderRadius: 10, border: '1px solid #ffe4cc' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#FF6B00', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                ℹ️ System Info
              </p>
              <p style={{ fontSize: 12, color: '#6b7280' }}>Version: 1.0.0</p>
              <p style={{ fontSize: 12, color: '#6b7280' }}>Organization: RMSM</p>
              <p style={{ fontSize: 12, color: '#6b7280' }}>Database: SQLite</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

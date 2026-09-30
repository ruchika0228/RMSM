import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidateAPI, getImageUrl } from '../services/api';
import toast from 'react-hot-toast';

const RAJASTHAN_DISTRICTS = [
  'Ajmer','Alwar','Banswara','Baran','Barmer','Bharatpur','Bhilwara',
  'Bikaner','Bundi','Chittorgarh','Churu','Dausa','Dholpur','Dungarpur',
  'Hanumangarh','Jaipur','Jaisalmer','Jalore','Jhalawar','Jhunjhunu',
  'Jodhpur','Karauli','Kota','Nagaur','Pali','Pratapgarh','Rajsamand',
  'Sawai Madhopur','Sikar','Sirohi','Sri Ganganagar','Tonk','Udaipur'
];

export default function CandidateList() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [membershipType, setMembershipType] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchCandidates = useCallback((page = 1) => {
    setLoading(true);
    candidateAPI.list({
      page,
      limit: pagination.limit,
      search,
      district,
      membership_type: membershipType,
    }).then(res => {
      setCandidates(res.data.data);
      setPagination(res.data.pagination);
    }).catch(() => {
      toast.error('Failed to load candidates');
    }).finally(() => setLoading(false));
  }, [search, district, membershipType, pagination.limit]);

  useEffect(() => { fetchCandidates(1); }, [search, district, membershipType]);

  const handleSearchSubmit = (e) => { e.preventDefault(); setSearch(searchInput); };
  const handleSearchClear = () => { setSearchInput(''); setSearch(''); };

  const getMemberBadge = (type) => {
    const map = { Primary: 'badge-saffron', Active: 'badge-green', Life: 'badge-navy', Patron: 'badge-gold' };
    return <span className={`badge ${map[type] || 'badge-gray'}`}>{type}</span>;
  };

  const getPaymentBadge = (status) => {
    const map = { Paid: 'badge-green', Pending: 'badge-saffron', Waived: 'badge-navy' };
    return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>All Candidates</h1>
          <p>Manage RMSM registered candidates</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/register')}>New Registration</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <form onSubmit={handleSearchSubmit} className="search-bar">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                type="text"
                placeholder="Search by name, ID, mobile..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
            {search && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleSearchClear}>
                Clear
              </button>
            )}
            <select className="filter-select" value={district} onChange={e => setDistrict(e.target.value)}>
              <option value="">All Districts</option>
              {RAJASTHAN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="filter-select" value={membershipType} onChange={e => setMembershipType(e.target.value)}>
              <option value="">All Memberships</option>
              <option value="Primary">Primary</option>
              <option value="Active">Active</option>
              <option value="Life">Life</option>
              <option value="Patron">Patron</option>
            </select>
          </form>
          {(search || district || membershipType) && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>
              {pagination.total} result(s) found
            </div>
          )}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
            <div className="spinner spinner-saffron" style={{ width: 36, height: 36, borderWidth: 3 }}></div>
          </div>
        ) : candidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>No candidates found</p>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
              {search || district || membershipType ? 'Try adjusting filters' : 'Register the first candidate'}
            </p>
            {!search && !district && !membershipType && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/register')}>
                Register First Candidate
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>District</th>
                    <th>Designation</th>
                    <th>Membership</th>
                    <th>Payment</th>
                    <th>Card</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(c => (
                    <tr key={c.id}>
                      <td>
                        <img
                          src={c.photo_path
                            ? getImageUrl(c.photo_path)
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.full_name)}&background=FF6B00&color=fff&size=40`}
                          alt={c.full_name}
                          style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', border: '1.5px solid #e5e7eb' }}
                          onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.full_name)}&background=FF6B00&color=fff&size=40`; }}
                        />
                      </td>
                      <td>
                        <code style={{ fontSize: 11, color: '#FF6B00', fontWeight: 700, background: '#fff9f5', padding: '2px 6px', borderRadius: 4 }}>
                          {c.candidate_id}
                        </code>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1f2937', fontSize: 13 }}>{c.full_name}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.father_name ? `S/D of ${c.father_name}` : ''}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{c.mobile}</td>
                      <td style={{ fontSize: 13 }}>{c.district}</td>
                      <td><span className="badge badge-gray">{c.designation}</span></td>
                      <td>{getMemberBadge(c.membership_type)}</td>
                      <td>{getPaymentBadge(c.payment_status)}</td>
                      <td>
                        {c.card_generated ? <span title="Generated">🪪✅</span> : <span title="Pending">🪪⏳</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/candidates/${c.id}`)}>
                            View
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/candidates/${c.id}/edit`)}>
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <div className="pagination-info">
                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="pagination-btns">
                <button className="pagination-btn" disabled={pagination.page <= 1} onClick={() => fetchCandidates(1)}>«</button>
                <button className="pagination-btn" disabled={pagination.page <= 1} onClick={() => fetchCandidates(pagination.page - 1)}>‹</button>
                {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                  const start = Math.max(1, pagination.page - 2);
                  const page = start + i;
                  if (page > pagination.pages) return null;
                  return (
                    <button
                      key={page}
                      className={`pagination-btn ${page === pagination.page ? 'active' : ''}`}
                      onClick={() => fetchCandidates(page)}
                    >{page}</button>
                  );
                })}
                <button className="pagination-btn" disabled={pagination.page >= pagination.pages} onClick={() => fetchCandidates(pagination.page + 1)}>›</button>
                <button className="pagination-btn" disabled={pagination.page >= pagination.pages} onClick={() => fetchCandidates(pagination.pages)}>»</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

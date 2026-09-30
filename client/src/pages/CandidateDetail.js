import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { candidateAPI } from '../services/api';
import CandidateCard from '../components/CandidateCard';
import toast from 'react-hot-toast';

function InfoItem({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#9ca3af', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#1f2937' }}>{value}</div>
    </div>
  );
}

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  const fetchCandidate = () => {
    setLoading(true);
    candidateAPI.get(id)
      .then(res => setCandidate(res.data.data))
      .catch(() => { toast.error('Candidate not found'); navigate('/candidates'); })
      .finally(() => setLoading(false));
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await candidateAPI.delete(id);
      toast.success('Candidate deleted');
      navigate('/candidates');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      const fd = new FormData();
      fd.append('is_active', candidate.is_active ? 0 : 1);
      await candidateAPI.update(id, fd);
      toast.success(candidate.is_active ? 'Candidate deactivated' : 'Candidate activated');
      fetchCandidate();
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div className="spinner spinner-saffron" style={{ width: 40, height: 40, borderWidth: 4 }}></div>
      </div>
    );
  }

  if (!candidate) return null;

  const statusBadge = candidate.is_active
    ? <span className="badge badge-green">✅ Active</span>
    : <span className="badge badge-gray">⛔ Inactive</span>;

  const paymentBadge = {
    Paid: <span className="badge badge-green">Paid</span>,
    Pending: <span className="badge badge-saffron">Pending</span>,
    Waived: <span className="badge badge-navy">Waived</span>,
  }[candidate.payment_status] || <span className="badge badge-gray">{candidate.payment_status}</span>;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>👤 {candidate.full_name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <code style={{ fontSize: 12, background: '#f3f4f6', padding: '2px 8px', borderRadius: 6, color: '#FF6B00', fontWeight: 700 }}>
              {candidate.candidate_id}
            </code>
            {statusBadge}
            <span className="badge badge-navy">{candidate.membership_type} Member</span>
            {candidate.card_generated ? <span className="badge badge-green">🪪 Card Generated</span> : <span className="badge badge-saffron">🪪 Card Pending</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/candidates')}>← Back</button>
          <button className="btn btn-outline" onClick={() => navigate(`/candidates/${id}/edit`)}>✏️ Edit</button>
          <button
            className={candidate.is_active ? 'btn btn-secondary' : 'btn btn-success'}
            onClick={handleToggleActive}
          >
            {candidate.is_active ? '⛔ Deactivate' : '✅ Activate'}
          </button>
          <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>🗑️ Delete</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

        {/* Candidate Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div className="card">
            <div className="card-header"><h2>👤 Personal Details</h2></div>
            <div className="card-body">
              <InfoItem label="Full Name" value={candidate.full_name} />
              <InfoItem label="Father's Name" value={candidate.father_name} />
              <InfoItem label="Mother's Name" value={candidate.mother_name} />
              <InfoItem label="Date of Birth" value={candidate.dob} />
              <InfoItem label="Gender" value={candidate.gender} />
              <InfoItem label="Blood Group" value={candidate.blood_group} />
              <InfoItem label="Education" value={candidate.education} />
              <InfoItem label="Occupation" value={candidate.occupation} />
              <InfoItem label="Aadhar Number" value={candidate.aadhar_number ? `****${candidate.aadhar_number.slice(-4)}` : null} />
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2>📞 Contact</h2></div>
            <div className="card-body">
              <InfoItem label="Mobile" value={candidate.mobile} />
              <InfoItem label="WhatsApp" value={candidate.whatsapp} />
              <InfoItem label="Email" value={candidate.email} />
              <InfoItem label="Address" value={candidate.address} />
              <InfoItem label="City/Village" value={candidate.city} />
              <InfoItem label="District" value={candidate.district} />
              <InfoItem label="State" value={candidate.state} />
              <InfoItem label="Pincode" value={candidate.pincode} />
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2>🏅 Membership & Payment</h2></div>
            <div className="card-body">
              <InfoItem label="Designation" value={candidate.designation} />
              <InfoItem label="Membership Type" value={candidate.membership_type} />
              <InfoItem label="Membership Fee" value={`₹${candidate.membership_fee}`} />
              <InfoItem label="Payment Method" value={candidate.payment_method} />
              <div style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#9ca3af', marginBottom: 2 }}>Payment Status</div>
                <div>{paymentBadge}</div>
              </div>
              {candidate.payment_reference && <InfoItem label="Payment Reference" value={candidate.payment_reference} />}
              <InfoItem label="Joining Date" value={candidate.joining_date} />
              <InfoItem label="Registered By" value={candidate.registered_by_name} />
              <InfoItem label="Registered On" value={new Date(candidate.created_at).toLocaleString('en-IN')} />
              {candidate.notes && <InfoItem label="Notes" value={candidate.notes} />}
            </div>
          </div>
        </div>

        {/* Card Preview + Generate */}
        <div>
          <div className="card">
            <div className="card-header">
              <h2>🪪 Candidate Card</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {!candidate.card_generated && (
                  <span className="badge badge-saffron">Not yet generated</span>
                )}
              </div>
            </div>
            <div className="card-body">
              <CandidateCard
                candidate={candidate}
                onCardGenerated={fetchCandidate}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🗑️ Confirm Delete</h2>
              <button className="close-btn" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: '#374151' }}>
                Are you sure you want to delete candidate <strong>{candidate.full_name}</strong> ({candidate.candidate_id})?
              </p>
              <p style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>
                ⚠️ This action cannot be undone. All candidate data and photo will be permanently deleted.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? <><span className="spinner"></span> Deleting...</> : '🗑️ Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

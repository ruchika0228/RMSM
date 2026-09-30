import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { candidateAPI } from '../services/api';
import toast from 'react-hot-toast';

const MEMBERSHIP_FEES = { Primary: 100, Active: 500, Life: 2100, Patron: 5100 };
const DESIGNATIONS = [
  'Member', 'Secretary', 'Joint Secretary', 'Treasurer', 'President',
  'Vice President', 'District President', 'Block President', 'Mandal President',
  'IT Cell Head', 'Media Cell Head', 'Youth Wing Leader', 'Mahila Wing Leader',
  'Coordinator', 'Volunteer', 'Advisor', 'Other'
];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const RAJASTHAN_DISTRICTS = [
  'Ajmer','Alwar','Banswara','Baran','Barmer','Bharatpur','Bhilwara',
  'Bikaner','Bundi','Chittorgarh','Churu','Dausa','Dholpur','Dungarpur',
  'Hanumangarh','Jaipur','Jaisalmer','Jalore','Jhalawar','Jhunjhunu',
  'Jodhpur','Karauli','Kota','Nagaur','Pali','Pratapgarh','Rajsamand',
  'Sawai Madhopur','Sikar','Sirohi','Sri Ganganagar','Tonk','Udaipur'
];

const initialForm = {
  full_name: '', father_name: '', mother_name: '', dob: '', gender: '',
  mobile: '', whatsapp: '', email: '', address: '', city: '', district: '',
  state: 'Rajasthan', pincode: '', aadhar_number: '',
  designation: 'Member', membership_type: 'Primary', membership_fee: '100',
  payment_method: 'Cash', payment_reference: '', payment_status: 'Paid',
  blood_group: '', education: '', occupation: '', joining_date: '',
  notes: ''
};

export default function RegisterCandidate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const photoInputRef = useRef(null);

  // Set today's date as default joining date
  useEffect(() => {
    if (!isEdit) {
      const today = new Date().toISOString().split('T')[0];
      setForm(f => ({ ...f, joining_date: today }));
    }
  }, [isEdit]);

  // Load candidate data if editing
  useEffect(() => {
    if (!isEdit) return;
    candidateAPI.get(id).then(res => {
      const c = res.data.data;
      setForm({
        full_name: c.full_name || '',
        father_name: c.father_name || '',
        mother_name: c.mother_name || '',
        dob: c.dob || '',
        gender: c.gender || '',
        mobile: c.mobile || '',
        whatsapp: c.whatsapp || '',
        email: c.email || '',
        address: c.address || '',
        city: c.city || '',
        district: c.district || '',
        state: c.state || 'Rajasthan',
        pincode: c.pincode || '',
        aadhar_number: c.aadhar_number || '',
        designation: c.designation || 'Member',
        membership_type: c.membership_type || 'Primary',
        membership_fee: String(c.membership_fee || '100'),
        payment_method: c.payment_method || 'Cash',
        payment_reference: c.payment_reference || '',
        payment_status: c.payment_status || 'Paid',
        blood_group: c.blood_group || '',
        education: c.education || '',
        occupation: c.occupation || '',
        joining_date: c.joining_date || '',
        notes: c.notes || ''
      });
      if (c.photo_path) {
        setExistingPhoto(`http://localhost:5000${c.photo_path}`);
      }
    }).catch(() => {
      toast.error('Failed to load candidate data');
      navigate('/candidates');
    }).finally(() => setFetchLoading(false));
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => {
      const updated = { ...f, [name]: value };
      // Auto-set fee when membership type changes
      if (name === 'membership_type') {
        updated.membership_fee = String(MEMBERSHIP_FEES[value] || '');
      }
      // Auto-copy mobile to whatsapp
      if (name === 'mobile' && !f.whatsapp) {
        updated.whatsapp = value;
      }
      return updated;
    });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be less than 5MB');
      return;
    }
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, WEBP allowed');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.father_name.trim()) e.father_name = "Father's name is required";
    if (!form.dob) e.dob = 'Date of birth is required';
    if (!form.gender) e.gender = 'Gender is required';
    if (!form.mobile.trim()) e.mobile = 'Mobile is required';
    else if (!/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = 'Invalid mobile number (10 digits, starts 6-9)';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.district) e.district = 'District is required';
    if (!form.pincode.trim()) e.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Pincode must be 6 digits';
    if (!form.designation) e.designation = 'Designation is required';
    if (!form.membership_type) e.membership_type = 'Membership type is required';
    if (!form.payment_method) e.payment_method = 'Payment method is required';
    if (['UPI', 'Bank Transfer', 'Online'].includes(form.payment_method) && !form.payment_reference.trim()) {
      e.payment_reference = 'Payment reference/UTR is required for this payment method';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Invalid email address';
    }
    if (form.aadhar_number && !/^\d{12}$/.test(form.aadhar_number.replace(/\s/g, ''))) {
      e.aadhar_number = 'Aadhar must be 12 digits';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the form errors');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== undefined) data.append(k, v); });
    if (photoFile) data.append('photo', photoFile);

    try {
      let res;
      if (isEdit) {
        res = await candidateAPI.update(id, data);
        toast.success('Candidate updated successfully!');
      } else {
        res = await candidateAPI.create(data);
        toast.success(`Candidate registered! ID: ${res.data.data.candidate_id}`);
      }
      navigate(`/candidates/${res.data.data.id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save candidate';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div className="spinner spinner-saffron" style={{ width: 40, height: 40, borderWidth: 4 }}></div>
      </div>
    );
  }

  const currentPhoto = photoPreview || existingPhoto;
  const needsRef = ['UPI', 'Bank Transfer', 'Online'].includes(form.payment_method);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isEdit ? '✏️ Edit Candidate' : '📝 New Registration'}</h1>
          <p>{isEdit ? 'Update candidate information' : 'Register a new RMSM candidate'}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', gap: 20 }}>

          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Personal Information */}
            <div className="card">
              <div className="card-header">
                <h2>👤 Personal Information</h2>
              </div>
              <div className="card-body">
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-group full">
                      <label>Full Name <span className="required">*</span></label>
                      <input
                        className={`form-control ${errors.full_name ? 'error' : ''}`}
                        type="text" name="full_name" value={form.full_name}
                        onChange={handleChange} placeholder="Enter full name"
                      />
                      {errors.full_name && <div className="form-error">{errors.full_name}</div>}
                    </div>

                    <div className="form-group">
                      <label>Father's Name <span className="required">*</span></label>
                      <input
                        className={`form-control ${errors.father_name ? 'error' : ''}`}
                        type="text" name="father_name" value={form.father_name}
                        onChange={handleChange} placeholder="Father's full name"
                      />
                      {errors.father_name && <div className="form-error">{errors.father_name}</div>}
                    </div>

                    <div className="form-group">
                      <label>Mother's Name</label>
                      <input
                        className="form-control"
                        type="text" name="mother_name" value={form.mother_name}
                        onChange={handleChange} placeholder="Mother's full name"
                      />
                    </div>

                    <div className="form-group">
                      <label>Date of Birth <span className="required">*</span></label>
                      <input
                        className={`form-control ${errors.dob ? 'error' : ''}`}
                        type="date" name="dob" value={form.dob}
                        onChange={handleChange}
                        max={new Date().toISOString().split('T')[0]}
                      />
                      {errors.dob && <div className="form-error">{errors.dob}</div>}
                    </div>

                    <div className="form-group">
                      <label>Gender <span className="required">*</span></label>
                      <select
                        className={`form-control ${errors.gender ? 'error' : ''}`}
                        name="gender" value={form.gender} onChange={handleChange}
                      >
                        <option value="">Select Gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                      {errors.gender && <div className="form-error">{errors.gender}</div>}
                    </div>

                    <div className="form-group">
                      <label>Blood Group</label>
                      <select className="form-control" name="blood_group" value={form.blood_group} onChange={handleChange}>
                        <option value="">Select</option>
                        {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Education</label>
                      <input
                        className="form-control"
                        type="text" name="education" value={form.education}
                        onChange={handleChange} placeholder="e.g. B.A., M.A., 12th"
                      />
                    </div>

                    <div className="form-group">
                      <label>Occupation</label>
                      <input
                        className="form-control"
                        type="text" name="occupation" value={form.occupation}
                        onChange={handleChange} placeholder="e.g. Farmer, Teacher, Business"
                      />
                    </div>

                    <div className="form-group">
                      <label>Aadhar Number</label>
                      <input
                        className={`form-control ${errors.aadhar_number ? 'error' : ''}`}
                        type="text" name="aadhar_number" value={form.aadhar_number}
                        onChange={handleChange} placeholder="12-digit Aadhar" maxLength={12}
                      />
                      {errors.aadhar_number && <div className="form-error">{errors.aadhar_number}</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="card">
              <div className="card-header">
                <h2>📞 Contact Information</h2>
              </div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Mobile <span className="required">*</span></label>
                    <input
                      className={`form-control ${errors.mobile ? 'error' : ''}`}
                      type="tel" name="mobile" value={form.mobile}
                      onChange={handleChange} placeholder="10-digit mobile" maxLength={10}
                    />
                    {errors.mobile && <div className="form-error">{errors.mobile}</div>}
                  </div>

                  <div className="form-group">
                    <label>WhatsApp Number</label>
                    <input
                      className="form-control"
                      type="tel" name="whatsapp" value={form.whatsapp}
                      onChange={handleChange} placeholder="Same as mobile or different" maxLength={10}
                    />
                  </div>

                  <div className="form-group full">
                    <label>Email</label>
                    <input
                      className={`form-control ${errors.email ? 'error' : ''}`}
                      type="email" name="email" value={form.email}
                      onChange={handleChange} placeholder="email@example.com"
                    />
                    {errors.email && <div className="form-error">{errors.email}</div>}
                  </div>

                  <div className="form-group full">
                    <label>Address <span className="required">*</span></label>
                    <textarea
                      className={`form-control ${errors.address ? 'error' : ''}`}
                      name="address" value={form.address}
                      onChange={handleChange} placeholder="House/Village/Street address"
                      rows={2}
                    />
                    {errors.address && <div className="form-error">{errors.address}</div>}
                  </div>

                  <div className="form-group">
                    <label>City/Village <span className="required">*</span></label>
                    <input
                      className={`form-control ${errors.city ? 'error' : ''}`}
                      type="text" name="city" value={form.city}
                      onChange={handleChange} placeholder="City or village name"
                    />
                    {errors.city && <div className="form-error">{errors.city}</div>}
                  </div>

                  <div className="form-group">
                    <label>District <span className="required">*</span></label>
                    <select
                      className={`form-control ${errors.district ? 'error' : ''}`}
                      name="district" value={form.district} onChange={handleChange}
                    >
                      <option value="">Select District</option>
                      {RAJASTHAN_DISTRICTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                    {errors.district && <div className="form-error">{errors.district}</div>}
                  </div>

                  <div className="form-group">
                    <label>State</label>
                    <input className="form-control" type="text" name="state" value={form.state} onChange={handleChange} />
                  </div>

                  <div className="form-group">
                    <label>Pincode <span className="required">*</span></label>
                    <input
                      className={`form-control ${errors.pincode ? 'error' : ''}`}
                      type="text" name="pincode" value={form.pincode}
                      onChange={handleChange} placeholder="6-digit pincode" maxLength={6}
                    />
                    {errors.pincode && <div className="form-error">{errors.pincode}</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Photo Upload */}
            <div className="card">
              <div className="card-header">
                <h2>📷 Candidate Photo</h2>
              </div>
              <div className="card-body">
                <div
                  className={`photo-upload-zone ${currentPhoto ? 'has-photo' : ''}`}
                  onClick={() => photoInputRef.current?.click()}
                >
                  {currentPhoto ? (
                    <>
                      <img src={currentPhoto} alt="Preview" className="photo-preview" />
                      <p style={{ fontSize: 12, color: '#138808', fontWeight: 600 }}>✅ Photo selected</p>
                      <p className="photo-upload-hint">Click to change photo</p>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>📸</div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Click to upload photo</p>
                      <p className="photo-upload-hint">JPEG, PNG, WEBP • Max 5MB</p>
                      <p className="photo-upload-hint">Passport size recommended</p>
                    </>
                  )}
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handlePhotoChange}
                />
                {currentPhoto && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 8, width: '100%' }}
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                      setExistingPhoto(null);
                      if (photoInputRef.current) photoInputRef.current.value = '';
                    }}
                  >
                    🗑️ Remove Photo
                  </button>
                )}
              </div>
            </div>

            {/* Membership & Designation */}
            <div className="card">
              <div className="card-header">
                <h2>🏅 Membership Details</h2>
              </div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Designation <span className="required">*</span></label>
                    <select
                      className={`form-control ${errors.designation ? 'error' : ''}`}
                      name="designation" value={form.designation} onChange={handleChange}
                    >
                      {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
                    </select>
                    {errors.designation && <div className="form-error">{errors.designation}</div>}
                  </div>

                  <div className="form-group">
                    <label>Membership Type <span className="required">*</span></label>
                    <select
                      className={`form-control ${errors.membership_type ? 'error' : ''}`}
                      name="membership_type" value={form.membership_type} onChange={handleChange}
                    >
                      <option value="">Select Type</option>
                      <option value="Primary">Primary (₹100)</option>
                      <option value="Active">Active (₹500)</option>
                      <option value="Life">Life (₹2,100)</option>
                      <option value="Patron">Patron (₹5,100)</option>
                    </select>
                    {errors.membership_type && <div className="form-error">{errors.membership_type}</div>}
                  </div>

                  <div className="form-group">
                    <label>Membership Fee (₹)</label>
                    <input
                      className="form-control"
                      type="number" name="membership_fee" value={form.membership_fee}
                      onChange={handleChange} min={0}
                    />
                  </div>

                  <div className="form-group">
                    <label>Joining Date <span className="required">*</span></label>
                    <input
                      className="form-control"
                      type="date" name="joining_date" value={form.joining_date}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="card">
              <div className="card-header">
                <h2>💳 Payment Details</h2>
              </div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Payment Method <span className="required">*</span></label>
                    <select
                      className={`form-control ${errors.payment_method ? 'error' : ''}`}
                      name="payment_method" value={form.payment_method} onChange={handleChange}
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Online">Online</option>
                    </select>
                    {errors.payment_method && <div className="form-error">{errors.payment_method}</div>}
                  </div>

                  <div className="form-group">
                    <label>Payment Status</label>
                    <select className="form-control" name="payment_status" value={form.payment_status} onChange={handleChange}>
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Waived">Waived</option>
                    </select>
                  </div>

                  {needsRef && (
                    <div className="form-group full">
                      <label>UTR / Payment Reference <span className="required">*</span></label>
                      <input
                        className={`form-control ${errors.payment_reference ? 'error' : ''}`}
                        type="text" name="payment_reference" value={form.payment_reference}
                        onChange={handleChange} placeholder="UTR number or transaction ID"
                      />
                      {errors.payment_reference && <div className="form-error">{errors.payment_reference}</div>}
                    </div>
                  )}

                  <div className="form-group full">
                    <label>Notes</label>
                    <textarea
                      className="form-control"
                      name="notes" value={form.notes}
                      onChange={handleChange} placeholder="Any additional notes..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                {loading ? (
                  <><span className="spinner"></span> Saving...</>
                ) : (
                  isEdit ? '✅ Update Candidate' : '📝 Register Candidate'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

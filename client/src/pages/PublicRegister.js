import React, { useState, useRef } from 'react';
import axios from 'axios';
import rmsmLogo from '../assets/rmsm-logo.png';
import modiPhoto from '../assets/modi.jpg';
import IDCard from '../components/IDCard';

const API_BASE = 'http://localhost:5000';

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

const empty = {
  full_name: '', father_name: '', mother_name: '', dob: '', gender: '',
  mobile: '', whatsapp: '', email: '', address: '', city: '', district: '',
  state: 'Rajasthan', pincode: '', aadhar_number: '',
  designation: 'Member', membership_type: 'Primary', membership_fee: '100',
  payment_method: 'Cash', payment_reference: '', payment_status: 'Paid',
  blood_group: '', education: '', occupation: '',
  joining_date: new Date().toISOString().split('T')[0],
  notes: ''
};

export default function PublicRegister() {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [registeredData, setRegisteredData] = useState(null);
  const [step, setStep] = useState(1); // 1=personal, 2=contact, 3=membership, 4=review
  const photoRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => {
      const u = { ...f, [name]: value };
      if (name === 'membership_type') u.membership_fee = String(MEMBERSHIP_FEES[value] || '');
      if (name === 'mobile' && !f.whatsapp) u.whatsapp = value;
      return u;
    });
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Photo must be less than 5MB'); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.full_name.trim()) e.full_name = 'Full name is required';
      if (!form.father_name.trim()) e.father_name = "Father's name is required";
      if (!form.dob) e.dob = 'Date of birth is required';
      if (!form.gender) e.gender = 'Gender is required';
    }
    if (s === 2) {
      if (!form.mobile.trim()) e.mobile = 'Mobile is required';
      else if (!/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = 'Invalid mobile (10 digits, starts 6-9)';
      if (!form.address.trim()) e.address = 'Address is required';
      if (!form.city.trim()) e.city = 'City / Village is required';
      if (!form.district) e.district = 'District is required';
      if (!form.pincode.trim()) e.pincode = 'Pincode is required';
      else if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Must be 6 digits';
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    }
    if (s === 3) {
      if (!form.designation) e.designation = 'Required';
      if (!form.membership_type) e.membership_type = 'Required';
      if (!form.payment_method) e.payment_method = 'Required';
      if (['UPI','Bank Transfer','Online'].includes(form.payment_method) && !form.payment_reference.trim())
        e.payment_reference = 'UTR / Reference number is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => { if (validateStep(step)) setStep(s => s + 1); };
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!validateStep(3)) { setStep(3); return; }
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== undefined) data.append(k, v); });
      if (photoFile) data.append('photo', photoFile);

      // Public endpoint — no auth token needed
      const res = await axios.post(`${API_BASE}/api/public/register`, data);

      // Merge API response with local form data so card has all fields (dob, father_name, etc.)
      const apiData = res.data.data;
      const fullData = {
        ...form,           // all form fields (dob, father_name, city, blood_group, etc.)
        ...apiData,        // overwrite with server values (candidate_id, photo_path, id)
      };
      setRegisteredData(fullData);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      alert('❌ ' + msg);
    } finally {
      setLoading(false);
    }
  };

  // ── SUCCESS SCREEN ────────────────────────────────────────────────────────
  if (submitted && registeredData) {
    return (
      <div style={styles.page}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerStripe} />
          <div style={styles.headerInner}>
            <img src={rmsmLogo} alt="RMSM" style={styles.headerLogo} />
            <div style={{ flex: 1 }}>
              <div style={styles.headerTitle}>RMSM Membership Registration</div>
              <div style={styles.headerSubtitle}>राष्ट्रीय मोदी सेवा मिशन — सेवा | समर्पण | संस्कार</div>
            </div>
            <img src={modiPhoto} alt="PM Modi" style={styles.modiImg} />
          </div>
          <div style={{ ...styles.headerStripe, transform: 'scaleX(-1)' }} />
        </div>

        <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 20px 40px' }}>

          {/* ── Congratulations banner ── */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
            border: '2px solid #86efac',
            borderRadius: 16,
            padding: '20px 24px',
            textAlign: 'center',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
            <h2 style={{ color: '#138808', fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>
              Registration Successful!
            </h2>
            <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 12px' }}>
              Welcome to Rashtriya Modi Seva Mission
            </p>
            <div style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #fff9f5, #fff)',
              border: '2px solid #FF6B00',
              borderRadius: 12,
              padding: '10px 24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your Member ID</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FF6B00', letterSpacing: '0.06em' }}>
                {registeredData.candidate_id}
              </div>
            </div>
          </div>

          {/* ── ID Card section ── */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            padding: '20px',
            marginBottom: 24,
          }}>
            <div style={{
              fontSize: 15, fontWeight: 700, color: '#000080',
              borderBottom: '2px solid #000080',
              paddingBottom: 8, marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              🪪 Your RMSM Membership Card is Ready!
            </div>

            <IDCard candidate={registeredData} photoPreview={photoPreview} />

            <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 14, margin: '14px 0 0' }}>
              Download your card now and keep it safe. You can also collect a printed copy from your local RMSM office.
            </p>
          </div>

          {/* ── Quick details ── */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            padding: '20px',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>📋 Registration Details</div>
            <div>
              <SummaryRow label="Name" value={registeredData.full_name} />
              <SummaryRow label="Mobile" value={registeredData.mobile} />
              <SummaryRow label="District" value={registeredData.district} />
              <SummaryRow label="Membership" value={`${registeredData.membership_type} Member`} />
              <SummaryRow label="Designation" value={registeredData.designation} />
              <SummaryRow label="Joining Date" value={registeredData.joining_date} />
            </div>
          </div>

          {/* ── Register another ── */}
          <button
            style={{ ...styles.btnPrimary, width: '100%', padding: '14px', fontSize: 15 }}
            onClick={() => {
              setSubmitted(false);
              setForm(empty);
              setStep(1);
              setPhotoFile(null);
              setPhotoPreview(null);
              setRegisteredData(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            ➕ Register Another Member
          </button>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p>राष्ट्रीय मोदी सेवा मिशन · संगठन संपूर्ण भारत</p>
          <p style={{ marginTop: 4, color: '#9ca3af' }}>Already an admin? <a href="/login" style={{ color: '#FF6B00' }}>Admin Login →</a></p>
        </div>
      </div>
    );
  }

  const needsRef = ['UPI', 'Bank Transfer', 'Online'].includes(form.payment_method);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerStripe} />
        <div style={styles.headerInner}>
          <img src={rmsmLogo} alt="RMSM" style={styles.headerLogo} />
          <div style={{ flex: 1 }}>
            <div style={styles.headerTitle}>RMSM Membership Registration</div>
            <div style={styles.headerSubtitle}>राष्ट्रीय मोदी सेवा मिशन — सेवा | समर्पण | संस्कार</div>
          </div>
          <img src={modiPhoto} alt="PM Modi" style={styles.modiImg} />
        </div>
        <div style={{ ...styles.headerStripe, transform: 'scaleX(-1)' }} />
      </div>

      {/* Stepper */}
      <div style={styles.stepper}>
        {['Personal Info', 'Contact & Address', 'Membership', 'Review & Submit'].map((label, i) => (
          <div key={i} style={styles.stepItem}>
            <div style={{
              ...styles.stepCircle,
              background: step > i + 1 ? '#138808' : step === i + 1 ? '#FF6B00' : '#e5e7eb',
              color: step >= i + 1 ? '#fff' : '#9ca3af',
            }}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <div style={{ ...styles.stepLabel, color: step === i + 1 ? '#FF6B00' : step > i + 1 ? '#138808' : '#9ca3af' }}>
              {label}
            </div>
            {i < 3 && <div style={{ ...styles.stepLine, background: step > i + 1 ? '#138808' : '#e5e7eb' }} />}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div style={styles.formCard}>

        {/* ── STEP 1: Personal Info ── */}
        {step === 1 && (
          <div>
            <div style={styles.sectionTitle}>👤 Personal Information</div>

            {/* Photo Upload */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div
                style={{ ...styles.photoZone, borderColor: photoPreview ? '#138808' : '#d1d5db' }}
                onClick={() => photoRef.current?.click()}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="preview" style={styles.photoPreview} />
                ) : (
                  <>
                    <div style={{ fontSize: 36 }}>📸</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 6 }}>Upload Your Photo</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Passport size photo recommended</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>JPEG / PNG · Max 5MB</div>
                  </>
                )}
              </div>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              {photoPreview && (
                <button style={styles.btnSmallSecondary} onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}>
                  Remove Photo
                </button>
              )}
            </div>

            <Field label="Full Name" required error={errors.full_name}>
              <input style={inp(errors.full_name)} name="full_name" value={form.full_name} onChange={handleChange} placeholder="Enter your full name" />
            </Field>
            <div style={styles.row}>
              <Field label="Father's Name" required error={errors.father_name}>
                <input style={inp(errors.father_name)} name="father_name" value={form.father_name} onChange={handleChange} placeholder="Father's full name" />
              </Field>
              <Field label="Mother's Name" error={errors.mother_name}>
                <input style={inp()} name="mother_name" value={form.mother_name} onChange={handleChange} placeholder="Mother's full name" />
              </Field>
            </div>
            <div style={styles.row}>
              <Field label="Date of Birth" required error={errors.dob}>
                <input style={inp(errors.dob)} type="date" name="dob" value={form.dob} onChange={handleChange} max={new Date().toISOString().split('T')[0]} />
              </Field>
              <Field label="Gender" required error={errors.gender}>
                <select style={inp(errors.gender)} name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </Field>
            </div>
            <div style={styles.row}>
              <Field label="Blood Group">
                <select style={inp()} name="blood_group" value={form.blood_group} onChange={handleChange}>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Education">
                <input style={inp()} name="education" value={form.education} onChange={handleChange} placeholder="e.g. BA, MA, 12th" />
              </Field>
            </div>
            <div style={styles.row}>
              <Field label="Occupation">
                <input style={inp()} name="occupation" value={form.occupation} onChange={handleChange} placeholder="e.g. Farmer, Teacher, Business" />
              </Field>
              <Field label="Aadhar Number">
                <input style={inp(errors.aadhar_number)} name="aadhar_number" value={form.aadhar_number} onChange={handleChange} placeholder="12-digit Aadhar" maxLength={12} />
              </Field>
            </div>
          </div>
        )}

        {/* ── STEP 2: Contact ── */}
        {step === 2 && (
          <div>
            <div style={styles.sectionTitle}>📞 Contact & Address</div>
            <div style={styles.row}>
              <Field label="Mobile Number" required error={errors.mobile}>
                <input style={inp(errors.mobile)} type="tel" name="mobile" value={form.mobile} onChange={handleChange} placeholder="10-digit mobile" maxLength={10} />
              </Field>
              <Field label="WhatsApp Number">
                <input style={inp()} type="tel" name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="Same as mobile or different" maxLength={10} />
              </Field>
            </div>
            <Field label="Email Address" error={errors.email}>
              <input style={inp(errors.email)} type="email" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com (optional)" />
            </Field>
            <Field label="Full Address" required error={errors.address}>
              <textarea style={{ ...inp(errors.address), minHeight: 70, resize: 'vertical' }} name="address" value={form.address} onChange={handleChange} placeholder="House No., Street, Village/Mohalla..." />
            </Field>
            <div style={styles.row}>
              <Field label="City / Village" required error={errors.city}>
                <input style={inp(errors.city)} name="city" value={form.city} onChange={handleChange} placeholder="City or village name" />
              </Field>
              <Field label="District" required error={errors.district}>
                <select style={inp(errors.district)} name="district" value={form.district} onChange={handleChange}>
                  <option value="">Select District</option>
                  {RAJASTHAN_DISTRICTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </Field>
            </div>
            <div style={styles.row}>
              <Field label="State">
                <input style={inp()} name="state" value={form.state} onChange={handleChange} />
              </Field>
              <Field label="Pincode" required error={errors.pincode}>
                <input style={inp(errors.pincode)} name="pincode" value={form.pincode} onChange={handleChange} placeholder="6-digit pincode" maxLength={6} />
              </Field>
            </div>
          </div>
        )}

        {/* ── STEP 3: Membership ── */}
        {step === 3 && (
          <div>
            <div style={styles.sectionTitle}>🏅 Membership & Payment</div>

            {/* Membership type cards */}
            <div style={{ marginBottom: 16 }}>
              <div style={styles.fieldLabel}>Membership Type <span style={{ color: '#dc2626' }}>*</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 6 }}>
                {Object.entries(MEMBERSHIP_FEES).map(([type, fee]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, membership_type: type, membership_fee: String(fee) }))}
                    style={{
                      padding: '12px 10px',
                      border: `2px solid ${form.membership_type === type ? '#FF6B00' : '#e5e7eb'}`,
                      borderRadius: 10,
                      background: form.membership_type === type ? '#fff9f5' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 14, color: form.membership_type === type ? '#FF6B00' : '#374151' }}>{type}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: form.membership_type === type ? '#FF6B00' : '#1f2937', margin: '2px 0' }}>₹{fee.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>Member</div>
                  </button>
                ))}
              </div>
              {errors.membership_type && <div style={styles.errText}>{errors.membership_type}</div>}
            </div>

            <div style={styles.row}>
              <Field label="Designation" required error={errors.designation}>
                <select style={inp(errors.designation)} name="designation" value={form.designation} onChange={handleChange}>
                  {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Joining Date">
                <input style={inp()} type="date" name="joining_date" value={form.joining_date} onChange={handleChange} />
              </Field>
            </div>

            <Field label="Payment Method" required error={errors.payment_method}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 6 }}>
                {['Cash', 'UPI', 'Bank Transfer', 'Online'].map(pm => (
                  <button
                    key={pm} type="button"
                    onClick={() => { setForm(f => ({ ...f, payment_method: pm })); setErrors(p => ({ ...p, payment_method: '' })); }}
                    style={{
                      padding: '10px',
                      border: `2px solid ${form.payment_method === pm ? '#138808' : '#e5e7eb'}`,
                      borderRadius: 8, background: form.payment_method === pm ? '#f0fdf4' : '#fff',
                      cursor: 'pointer', fontWeight: 600, fontSize: 13,
                      color: form.payment_method === pm ? '#138808' : '#374151',
                    }}
                  >
                    {pm === 'Cash' ? '💵' : pm === 'UPI' ? '📱' : pm === 'Bank Transfer' ? '🏦' : '💳'} {pm}
                  </button>
                ))}
              </div>
              {errors.payment_method && <div style={styles.errText}>{errors.payment_method}</div>}
            </Field>

            {needsRef && (
              <Field label="UTR / Payment Reference" required error={errors.payment_reference}>
                <input style={inp(errors.payment_reference)} name="payment_reference" value={form.payment_reference} onChange={handleChange} placeholder="Enter UTR number or transaction ID" />
              </Field>
            )}

            <Field label="Additional Notes (Optional)">
              <textarea style={{ ...inp(), minHeight: 60, resize: 'vertical' }} name="notes" value={form.notes} onChange={handleChange} placeholder="Any additional information..." />
            </Field>
          </div>
        )}

        {/* ── STEP 4: Review ── */}
        {step === 4 && (
          <div>
            <div style={styles.sectionTitle}>📋 Review Your Details</div>

            {/* Photo + name preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#fff9f5', borderRadius: 12, border: '1.5px solid #ffe4cc', marginBottom: 16 }}>
              {photoPreview ? (
                <img src={photoPreview} alt="you" style={{ width: 60, height: 72, borderRadius: 8, objectFit: 'cover', border: '2px solid #FF6B00' }} />
              ) : (
                <div style={{ width: 60, height: 72, borderRadius: 8, background: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff', fontWeight: 700 }}>
                  {form.full_name ? form.full_name[0].toUpperCase() : '?'}
                </div>
              )}
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1f2937' }}>{form.full_name || '—'}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{form.designation}</div>
                <div style={{ fontSize: 12, color: '#FF6B00', fontWeight: 600 }}>{form.membership_type} Member · ₹{parseInt(form.membership_fee).toLocaleString()}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              <ReviewRow label="Father's Name" value={form.father_name} />
              <ReviewRow label="Date of Birth" value={form.dob} />
              <ReviewRow label="Gender" value={form.gender} />
              <ReviewRow label="Mobile" value={form.mobile} />
              <ReviewRow label="WhatsApp" value={form.whatsapp} />
              <ReviewRow label="Email" value={form.email || '—'} />
              <ReviewRow label="District" value={form.district} />
              <ReviewRow label="City" value={form.city} />
              <ReviewRow label="Pincode" value={form.pincode} />
              <ReviewRow label="Payment" value={`${form.payment_method} · ₹${parseInt(form.membership_fee).toLocaleString()}`} />
              {form.payment_reference && <ReviewRow label="UTR / Ref" value={form.payment_reference} />}
              {form.blood_group && <ReviewRow label="Blood Group" value={form.blood_group} />}
            </div>
            <ReviewRow label="Address" value={form.address} full />

            <div style={{ marginTop: 14, padding: 12, background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', fontSize: 12, color: '#166534' }}>
              ✅ Please verify all details before submitting. Once submitted, changes can only be made by contacting the admin.
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'space-between' }}>
          {step > 1 ? (
            <button style={styles.btnSecondary} onClick={prevStep}>← Back</button>
          ) : <div />}

          {step < 4 ? (
            <button style={styles.btnPrimary} onClick={nextStep}>
              Next →
            </button>
          ) : (
            <button style={{ ...styles.btnPrimary, background: loading ? '#9ca3af' : '#138808' }} onClick={handleSubmit} disabled={loading}>
              {loading ? '⏳ Submitting...' : '✅ Submit Registration'}
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>राष्ट्रीय मोदी सेवा मिशन · संगठन संपूर्ण भारत</p>
        <p style={{ marginTop: 4, color: '#9ca3af' }}>Already an admin? <a href="/login" style={{ color: '#FF6B00' }}>Admin Login →</a></p>
      </div>
    </div>
  );
}

// ── Small Components ─────────────────────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={styles.fieldLabel}>
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      {children}
      {error && <div style={styles.errText}>{error}</div>}
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: 12, color: '#9ca3af' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{value}</span>
    </div>
  );
}

function ReviewRow({ label, value, full }) {
  return (
    <div style={{ padding: '7px 0', borderBottom: '1px solid #f3f4f6', gridColumn: full ? '1 / -1' : 'auto' }}>
      <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 13, color: '#1f2937', fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const inp = (err) => ({
  display: 'block', width: '100%', padding: '10px 12px',
  border: `1.5px solid ${err ? '#dc2626' : '#d1d5db'}`,
  borderRadius: 8, fontSize: 14, fontFamily: 'inherit',
  outline: 'none', background: '#fff', color: '#1f2937',
  boxSizing: 'border-box',
});

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #fff9f5 0%, #f3f4f6 100%)',
    fontFamily: "'Poppins', 'Noto Sans Devanagari', sans-serif",
    paddingBottom: 40,
  },
  header: {
    background: 'linear-gradient(135deg, #000080 0%, #1a1a9e 100%)',
    overflow: 'hidden',
  },
  headerStripe: {
    height: 5,
    background: 'linear-gradient(to right, #FF6B00 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%)',
  },
  headerInner: {
    maxWidth: 700, margin: '0 auto', padding: '18px 20px',
    display: 'flex', alignItems: 'center', gap: 14,
  },
  headerLogo: { width: 60, height: 60, borderRadius: '50%', border: '3px solid #F0C429', objectFit: 'cover', flexShrink: 0 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 800, lineHeight: 1.2 },
  headerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 3 },
  modiImg: { width: 50, height: 55, borderRadius: 8, objectFit: 'cover', objectPosition: 'center top', border: '2px solid #F0C429', flexShrink: 0 },

  stepper: {
    maxWidth: 700, margin: '0 auto', padding: '20px 20px 0',
    display: 'flex', alignItems: 'flex-start', gap: 0,
  },
  stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' },
  stepCircle: {
    width: 32, height: 32, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, zIndex: 1, flexShrink: 0,
  },
  stepLabel: { fontSize: 10, fontWeight: 600, marginTop: 5, textAlign: 'center', lineHeight: 1.2 },
  stepLine: {
    position: 'absolute', top: 16, left: '60%', right: '-40%', height: 2,
    zIndex: 0,
  },

  formCard: {
    maxWidth: 700, margin: '16px auto 0', background: '#fff',
    borderRadius: 16, padding: '24px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  sectionTitle: {
    fontSize: 15, fontWeight: 700, color: '#FF6B00',
    borderBottom: '2px solid #FF6B00', paddingBottom: 8, marginBottom: 18,
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 },
  errText: { fontSize: 11, color: '#dc2626', marginTop: 3 },

  photoZone: {
    border: '2px dashed', borderRadius: 12, padding: '20px 16px',
    textAlign: 'center', cursor: 'pointer', background: '#f9fafb',
    transition: 'all 0.2s', marginBottom: 8, maxWidth: 200, margin: '0 auto 8px',
  },
  photoPreview: { width: 100, height: 120, borderRadius: 8, objectFit: 'cover', border: '2px solid #FF6B00', display: 'block', margin: '0 auto' },

  btnPrimary: {
    padding: '12px 28px', background: '#FF6B00', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
  },
  btnSecondary: {
    padding: '12px 20px', background: '#f3f4f6', color: '#374151',
    border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  btnSmallSecondary: {
    padding: '5px 12px', background: '#f3f4f6', color: '#374151',
    border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer',
    fontFamily: 'inherit', marginTop: 6,
  },

  idBox: {
    background: 'linear-gradient(135deg, #fff9f5, #fff)',
    border: '2px solid #FF6B00', borderRadius: 12, padding: '14px 20px',
    textAlign: 'center', margin: '16px 0',
  },
  summaryGrid: { marginTop: 8 },

  footer: {
    textAlign: 'center', padding: '20px', fontSize: 12, color: '#6b7280',
  },
};

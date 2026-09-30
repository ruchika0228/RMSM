import React, { useRef, useState } from 'react';
import rmsmLogo from '../assets/rmsm-logo.png';
import modiPhoto from '../assets/modi.jpg';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const API_BASE = 'http://localhost:5000';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getMembershipColor(type) {
  const colors = { Primary: '#FF6B00', Active: '#138808', Life: '#000080', Patron: '#C8A400' };
  return colors[type] || '#FF6B00';
}

export default function IDCard({ candidate, photoPreview }) {
  const cardRef = useRef(null);
  const [status, setStatus] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const photoSrc = photoPreview
    ? photoPreview
    : candidate.photo_path
      ? `${API_BASE}${candidate.photo_path}`
      : null;

  const memberColor = getMembershipColor(candidate.membership_type);

  const captureCanvas = async (scale = 3) => {
    if (!cardRef.current) throw new Error('Card not found');
    return html2canvas(cardRef.current, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
  };

  const handleDownloadPDF = async () => {
    setStatus('loading');
    setStatusMsg('Generating PDF…');
    try {
      const canvas = await captureCanvas(3);
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [95, 60] });
      pdf.addImage(imgData, 'JPEG', 0, 0, 95, 60);
      pdf.save(`RMSM_Card_${candidate.candidate_id}.pdf`);
      setStatus('done');
      setStatusMsg('PDF downloaded!');
    } catch (err) {
      setStatus('error');
      setStatusMsg('PDF generation failed. Please try again.');
      console.error(err);
    }
  };

  const handleDownloadImage = async () => {
    setStatus('loading');
    setStatusMsg('Generating image…');
    try {
      const canvas = await captureCanvas(4);
      const link = document.createElement('a');
      link.download = `RMSM_Card_${candidate.candidate_id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setStatus('done');
      setStatusMsg('Image downloaded!');
    } catch (err) {
      setStatus('error');
      setStatusMsg('Image generation failed. Please try again.');
      console.error(err);
    }
  };

  return (
    <div style={{ fontFamily: "'Poppins', 'Arial', sans-serif" }}>

      {/* ── Card Preview ─────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div
          ref={cardRef}
          style={{
            width: 380,
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: '0 6px 24px rgba(0,0,128,0.18)',
            background: '#fff',
            fontFamily: "'Poppins', 'Arial', sans-serif",
          }}
        >
          {/* Top tricolor stripe */}
          <div style={{
            height: 5,
            background: 'linear-gradient(to right, #FF6B00 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%)',
          }} />

          {/* ── HEADER: Logo + Title | Modi Photo ── */}
          <div style={{
            background: 'linear-gradient(135deg, #000080 0%, #1a1a9e 100%)',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            {/* RMSM Logo */}
            <img
              src={rmsmLogo}
              alt="RMSM"
              crossOrigin="anonymous"
              style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #F0C429', objectFit: 'cover', flexShrink: 0 }}
            />

            {/* Title block */}
            <div style={{ flex: 1 }}>
              <div style={{ color: '#F0C429', fontSize: 14, fontWeight: 800, letterSpacing: '0.05em', lineHeight: 1.1 }}>RMSM</div>
              <div style={{ color: '#ffffff', fontSize: 9, opacity: 0.95, lineHeight: 1.4 }}>राष्ट्रीय मोदी सेवा मिशन</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 8, lineHeight: 1.3 }}>सेवा | समर्पण | संस्कार</div>
            </div>

            {/* Modi Photo — RIGHT SIDE of header */}
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              <img
                src={modiPhoto}
                alt="PM Narendra Modi"
                crossOrigin="anonymous"
                style={{
                  width: 52,
                  height: 62,
                  borderRadius: 7,
                  border: '2.5px solid #F0C429',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  display: 'block',
                }}
              />
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 6.5, marginTop: 2, lineHeight: 1.2 }}>
                PM Narendra<br />Modi Ji
              </div>
            </div>
          </div>

          {/* ── BODY ── */}
          <div style={{
            padding: '10px 12px',
            display: 'flex',
            gap: 12,
            background: 'linear-gradient(135deg, #fffaf5 0%, #ffffff 100%)',
          }}>

            {/* Member photo — BIG */}
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              {photoSrc ? (
                <img
                  src={photoSrc}
                  alt={candidate.full_name}
                  crossOrigin="anonymous"
                  style={{
                    width: 88,
                    height: 108,
                    borderRadius: 8,
                    border: '3px solid #FF6B00',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  onError={e => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.full_name)}&background=FF6B00&color=fff&size=120`;
                  }}
                />
              ) : (
                <div style={{
                  width: 88,
                  height: 108,
                  borderRadius: 8,
                  border: '3px solid #FF6B00',
                  background: 'linear-gradient(135deg, #FF6B00, #D45500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  color: '#fff',
                  fontWeight: 800,
                }}>
                  {candidate.full_name ? candidate.full_name[0].toUpperCase() : '?'}
                </div>
              )}
              <div style={{ fontSize: 7.5, color: '#9ca3af', marginTop: 3, fontWeight: 600 }}>सदस्य फोटो</div>
            </div>

            {/* Info column */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Name */}
              <div style={{
                fontSize: 14,
                fontWeight: 800,
                color: '#000080',
                lineHeight: 1.2,
                marginBottom: 3,
              }}>
                {candidate.full_name}
              </div>

              {/* Designation badge */}
              <div style={{
                display: 'inline-block',
                background: '#FF6B00',
                color: '#fff',
                fontSize: 8,
                fontWeight: 700,
                padding: '2px 9px',
                borderRadius: 10,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {candidate.designation}
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <InfoRow label="पिता/Father" value={candidate.father_name} />
                <InfoRow label="जन्म/DOB"   value={formatDate(candidate.dob)} />
                <InfoRow label="मोबाइल"      value={candidate.mobile} />
                <InfoRow label="जिला"         value={`${candidate.city}, ${candidate.district}`} />
                <InfoRow label="सदस्यता"      value={`${candidate.membership_type} Member`} />
              </div>
            </div>
          </div>

          {/* ── FOOTER: joining date | Member ID | blood group ── */}
          <div style={{
            background: 'linear-gradient(135deg, #FF6B00 0%, #D45500 100%)',
            padding: '7px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
          }}>
            {/* Left: joining date */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 7.5 }}>सदस्यता तिथि</div>
              <div style={{ color: '#fff', fontSize: 9.5, fontWeight: 700 }}>{formatDate(candidate.joining_date)}</div>
            </div>

            {/* Center: Member ID (moved here) */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Member ID
              </div>
              <div style={{
                color: '#fff',
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: '0.04em',
                background: 'rgba(0,0,0,0.18)',
                borderRadius: 5,
                padding: '2px 7px',
                display: 'inline-block',
                marginTop: 1,
              }}>
                {candidate.candidate_id}
              </div>
              <div style={{
                display: 'inline-block',
                background: getMembershipColor(candidate.membership_type) === '#FF6B00' ? 'rgba(255,255,255,0.25)' : getMembershipColor(candidate.membership_type),
                color: '#fff',
                fontSize: 6.5,
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: 6,
                marginTop: 2,
                marginLeft: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'block',
              }}>
                {candidate.membership_type} Member
              </div>
            </div>

            {/* Right: blood group or website */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {candidate.blood_group ? (
                <>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 7 }}>Blood</div>
                  <div style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>{candidate.blood_group}</div>
                </>
              ) : (
                <>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 7 }}>संगठन</div>
                  <div style={{ color: '#fff', fontSize: 7.5, fontWeight: 700 }}>संपूर्ण भारत</div>
                </>
              )}
            </div>
          </div>

          {/* Bottom tricolor stripe */}
          <div style={{
            height: 3,
            background: 'linear-gradient(to right, #FF6B00 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%)',
          }} />
        </div>
      </div>

      {/* ── Status message ─────────────────────────────────── */}
      {status === 'loading' && (
        <div style={{ textAlign: 'center', color: '#FF6B00', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
          ⏳ {statusMsg}
        </div>
      )}
      {status === 'done' && (
        <div style={{ textAlign: 'center', color: '#138808', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
          ✅ {statusMsg}
        </div>
      )}
      {status === 'error' && (
        <div style={{ textAlign: 'center', color: '#dc2626', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
          ❌ {statusMsg}
        </div>
      )}

      {/* ── Download buttons ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={handleDownloadPDF}
          disabled={status === 'loading'}
          style={{
            padding: '11px 22px',
            background: status === 'loading' ? '#9ca3af' : '#000080',
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          📄 Download PDF
        </button>
        <button
          onClick={handleDownloadImage}
          disabled={status === 'loading'}
          style={{
            padding: '11px 22px',
            background: status === 'loading' ? '#9ca3af' : '#138808',
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          🖼️ Download Image
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 4, fontSize: 10 }}>
      <span style={{ color: '#6b7280', fontWeight: 600, minWidth: 68, flexShrink: 0 }}>{label}:</span>
      <span style={{ color: '#1f2937', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  );
}

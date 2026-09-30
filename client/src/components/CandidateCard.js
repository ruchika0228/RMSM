import React, { useRef } from 'react';
import { getImageUrl } from '../services/api';
import rmsmLogo from '../assets/rmsm-logo.png';
import modiPhoto from '../assets/modi.jpg';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { candidateAPI } from '../services/api';

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

export default function CandidateCard({ candidate, onCardGenerated }) {
  const cardRef = useRef(null);

  const photoUrl = candidate.photo_path
    ? getImageUrl(candidate.photo_path)
    : null;

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    const loadingToast = toast.loading('Generating PDF...');
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff', logging: false,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [95, 60] });
      pdf.addImage(imgData, 'JPEG', 0, 0, 95, 60);
      pdf.save(`RMSM_Card_${candidate.candidate_id}.pdf`);
      toast.dismiss(loadingToast);
      toast.success('Card downloaded as PDF!');
      if (onCardGenerated) {
        candidateAPI.markCardGenerated(candidate.id).catch(() => {});
        onCardGenerated();
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to generate PDF');
      console.error(err);
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    const loadingToast = toast.loading('Generating image...');
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 4, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff', logging: false,
      });
      const link = document.createElement('a');
      link.download = `RMSM_Card_${candidate.candidate_id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.dismiss(loadingToast);
      toast.success('Card downloaded as image!');
      if (onCardGenerated) {
        candidateAPI.markCardGenerated(candidate.id).catch(() => {});
        onCardGenerated();
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to generate image');
    }
  };

  const handlePrint = async () => {
    if (!cardRef.current) return;
    const loadingToast = toast.loading('Preparing print...');
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff', logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>RMSM Card - ${candidate.full_name}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; }
              .print-page { width: 95mm; text-align: center; }
              img { width: 95mm; height: auto; display: block; }
              p { font-size: 10px; color: #666; margin-top: 8px; font-family: Arial, sans-serif; }
              @media print {
                body { background: white; }
                p { display: none; }
                @page { size: 95mm 60mm; margin: 0; }
              }
            </style>
          </head>
          <body>
            <div class="print-page">
              <img src="${imgData}" />
              <p>RMSM - Rashtriya Modi Seva Mission</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        toast.dismiss(loadingToast);
        toast.success('Print dialog opened');
        if (onCardGenerated) {
          candidateAPI.markCardGenerated(candidate.id).catch(() => {});
          onCardGenerated();
        }
      }, 800);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to print');
    }
  };

  const memberColor = getMembershipColor(candidate.membership_type);

  return (
    <div>
      {/* Card Preview */}
      <div className="card-preview-container">
        <div
          ref={cardRef}
          className="candidate-card"
          style={{ fontFamily: "'Poppins', 'Arial', sans-serif" }}
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
            <img
              src={rmsmLogo}
              alt="RMSM"
              crossOrigin="anonymous"
              style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #F0C429', objectFit: 'cover', flexShrink: 0 }}
            />
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
              <img
                src={photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.full_name)}&background=FF6B00&color=fff&size=120`}
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
              <div style={{ fontSize: 7.5, color: '#9ca3af', marginTop: 3, fontWeight: 600 }}>सदस्य फोटो</div>
            </div>

            {/* Info column */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#000080', lineHeight: 1.2, marginBottom: 3 }}>
                {candidate.full_name}
              </div>
              <div style={{
                display: 'inline-block',
                background: '#FF6B00', color: '#fff',
                fontSize: 8, fontWeight: 700,
                padding: '2px 9px', borderRadius: 10, marginBottom: 8,
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {candidate.designation}
              </div>
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

            {/* Center: Member ID */}
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
                color: '#fff',
                fontSize: 6.5,
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: 6,
                marginTop: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'block',
              }}>
                {candidate.membership_type} Member
              </div>
            </div>

            {/* Right: blood group */}
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

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
        <button className="btn btn-primary" onClick={handleDownloadPDF}>📄 Download PDF</button>
        <button className="btn btn-success" onClick={handleDownloadImage}>🖼️ Download Image</button>
        <button className="btn btn-navy" onClick={handlePrint}>🖨️ Print Card</button>
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

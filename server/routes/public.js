const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { dbRun, dbGet, generateCandidateId } = require('../db/database');

// ── Multer ────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `photo_${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (['image/jpeg','image/jpg','image/png','image/webp'].includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, WEBP images allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ── POST /api/public/register — no auth required ──────────────────────────
router.post('/register', upload.single('photo'), async (req, res) => {
  try {
    const {
      full_name, father_name, mother_name = '', dob, gender,
      mobile, whatsapp, email = '', address, city, district,
      state = 'Rajasthan', pincode, aadhar_number = '',
      designation = 'Member', membership_type = 'Primary', membership_fee = 100,
      payment_method = 'Cash', payment_reference = '', payment_status = 'Paid',
      blood_group = '', education = '', occupation = '',
      joining_date, notes = ''
    } = req.body;

    // Validate required fields
    const missing = [];
    if (!full_name?.trim())    missing.push('Full Name');
    if (!father_name?.trim())  missing.push("Father's Name");
    if (!dob)                  missing.push('Date of Birth');
    if (!gender)               missing.push('Gender');
    if (!mobile?.trim())       missing.push('Mobile');
    if (!address?.trim())      missing.push('Address');
    if (!city?.trim())         missing.push('City');
    if (!district)             missing.push('District');
    if (!pincode?.trim())      missing.push('Pincode');

    if (missing.length) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(', ')}` });
    }

    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Invalid mobile number. Must be 10 digits starting with 6-9.' });
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Pincode must be 6 digits.' });
    }

    const candidateId = await generateCandidateId();
    const photoPath   = req.file ? `/uploads/${req.file.filename}` : null;
    const jDate       = joining_date || new Date().toISOString().split('T')[0];

    const result = await dbRun(
      `INSERT INTO candidates (
        candidate_id, full_name, father_name, mother_name, dob, gender,
        mobile, whatsapp, email, address, city, district, state, pincode,
        aadhar_number, designation, membership_type, membership_fee,
        payment_method, payment_reference, payment_status, photo_path,
        blood_group, education, occupation, joining_date, registered_by, notes
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        candidateId, full_name.trim(), father_name.trim(), mother_name,
        dob, gender, mobile.trim(), whatsapp || mobile, email,
        address.trim(), city.trim(), district, state, pincode.trim(),
        aadhar_number, designation, membership_type,
        parseFloat(membership_fee) || 0,
        payment_method, payment_reference, payment_status,
        photoPath, blood_group, education, occupation,
        jDate,
        null, // registered_by = null for self-registration
        notes
      ]
    );

    const newCandidate = await dbGet('SELECT * FROM candidates WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your RMSM membership card is ready to download.',
      data: {
        id: newCandidate.id,
        candidate_id: newCandidate.candidate_id,
        full_name: newCandidate.full_name,
        father_name: newCandidate.father_name,
        mother_name: newCandidate.mother_name,
        dob: newCandidate.dob,
        gender: newCandidate.gender,
        mobile: newCandidate.mobile,
        whatsapp: newCandidate.whatsapp,
        email: newCandidate.email,
        address: newCandidate.address,
        city: newCandidate.city,
        district: newCandidate.district,
        state: newCandidate.state,
        pincode: newCandidate.pincode,
        designation: newCandidate.designation,
        membership_type: newCandidate.membership_type,
        membership_fee: newCandidate.membership_fee,
        payment_method: newCandidate.payment_method,
        payment_status: newCandidate.payment_status,
        blood_group: newCandidate.blood_group,
        education: newCandidate.education,
        occupation: newCandidate.occupation,
        joining_date: newCandidate.joining_date,
        photo_path: newCandidate.photo_path,
      }
    });

  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Public register error:', err.message);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

module.exports = router;

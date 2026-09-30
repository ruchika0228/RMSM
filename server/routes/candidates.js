const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { dbRun, dbGet, dbAll, generateCandidateId } = require('../db/database');
const authMiddleware = require('../middleware/auth');

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

// ── GET /api/candidates ───────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', district = '', membership_type = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = [];
    const params = [];

    if (search) {
      where.push(`(c.full_name LIKE ? OR c.candidate_id LIKE ? OR c.mobile LIKE ? OR c.email LIKE ?)`);
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (district) { where.push(`c.district = ?`); params.push(district); }
    if (membership_type) { where.push(`c.membership_type = ?`); params.push(membership_type); }

    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countRow = await dbGet(`SELECT COUNT(*) as cnt FROM candidates c ${clause}`, params);
    const rows = await dbAll(
      `SELECT c.*, a.name as registered_by_name
       FROM candidates c
       LEFT JOIN admins a ON c.registered_by = a.id
       ${clause}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: countRow.cnt,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countRow.cnt / parseInt(limit))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/candidates/stats ─────────────────────────────────────────────
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const total    = await dbGet('SELECT COUNT(*) as cnt FROM candidates');
    const active   = await dbGet('SELECT COUNT(*) as cnt FROM candidates WHERE is_active = 1');
    const today    = await dbGet(`SELECT COUNT(*) as cnt FROM candidates WHERE date(created_at) = date('now')`);
    const revenue  = await dbGet(`SELECT COALESCE(SUM(membership_fee),0) as total FROM candidates WHERE payment_status = 'Paid'`);
    const byMem    = await dbAll('SELECT membership_type, COUNT(*) as cnt FROM candidates GROUP BY membership_type');
    const byDist   = await dbAll('SELECT district, COUNT(*) as cnt FROM candidates GROUP BY district ORDER BY cnt DESC LIMIT 10');

    res.json({
      success: true,
      stats: {
        total: total.cnt, active: active.cnt, today: today.cnt,
        revenue: revenue.total, byMembership: byMem, byDistrict: byDist
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/candidates/districts ────────────────────────────────────────
router.get('/districts', authMiddleware, async (req, res) => {
  try {
    const rows = await dbAll('SELECT name FROM districts ORDER BY name');
    res.json({ success: true, data: rows.map(r => r.name) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/candidates/:id ───────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const row = await dbGet(
      `SELECT c.*, a.name as registered_by_name
       FROM candidates c
       LEFT JOIN admins a ON c.registered_by = a.id
       WHERE c.id = ? OR c.candidate_id = ?`,
      [req.params.id, req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Candidate not found' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/candidates ──────────────────────────────────────────────────
router.post('/', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const {
      full_name, father_name, mother_name = '', dob, gender,
      mobile, whatsapp, email = '', address, city, district,
      state = 'Rajasthan', pincode, aadhar_number = '',
      designation, membership_type, membership_fee = 0,
      payment_method, payment_reference = '', payment_status = 'Paid',
      blood_group = '', education = '', occupation = '',
      joining_date, notes = ''
    } = req.body;

    // Required validation
    const missing = [];
    if (!full_name?.trim())    missing.push('full_name');
    if (!father_name?.trim())  missing.push('father_name');
    if (!dob)                  missing.push('dob');
    if (!gender)               missing.push('gender');
    if (!mobile?.trim())       missing.push('mobile');
    if (!address?.trim())      missing.push('address');
    if (!city?.trim())         missing.push('city');
    if (!district)             missing.push('district');
    if (!pincode?.trim())      missing.push('pincode');
    if (!designation)          missing.push('designation');
    if (!membership_type)      missing.push('membership_type');
    if (!payment_method)       missing.push('payment_method');

    if (missing.length) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(', ')}` });
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Invalid mobile number' });
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
        candidateId, full_name.trim(), father_name.trim(), mother_name, dob, gender,
        mobile.trim(), whatsapp || mobile, email,
        address.trim(), city.trim(), district, state, pincode.trim(),
        aadhar_number, designation, membership_type, parseFloat(membership_fee) || 0,
        payment_method, payment_reference, payment_status, photoPath,
        blood_group, education, occupation, jDate, req.admin.id, notes
      ]
    );

    const newCandidate = await dbGet('SELECT * FROM candidates WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, data: newCandidate, message: 'Candidate registered successfully' });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Insert error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/candidates/:id ───────────────────────────────────────────────
router.put('/:id', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const existing = await dbGet(
      'SELECT * FROM candidates WHERE id = ? OR candidate_id = ?',
      [req.params.id, req.params.id]
    );
    if (!existing) return res.status(404).json({ success: false, message: 'Candidate not found' });

    const b = req.body;
    let photoPath = existing.photo_path;

    if (req.file) {
      if (existing.photo_path && !existing.photo_path.includes('modi')) {
        const old = path.join(__dirname, '..', existing.photo_path);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      photoPath = `/uploads/${req.file.filename}`;
    }

    await dbRun(
      `UPDATE candidates SET
        full_name=?, father_name=?, mother_name=?, dob=?, gender=?,
        mobile=?, whatsapp=?, email=?, address=?, city=?, district=?,
        state=?, pincode=?, aadhar_number=?, designation=?,
        membership_type=?, membership_fee=?, payment_method=?,
        payment_reference=?, payment_status=?, photo_path=?,
        blood_group=?, education=?, occupation=?, joining_date=?,
        is_active=?, notes=?, updated_at=CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        b.full_name       ?? existing.full_name,
        b.father_name     ?? existing.father_name,
        b.mother_name     ?? existing.mother_name,
        b.dob             ?? existing.dob,
        b.gender          ?? existing.gender,
        b.mobile          ?? existing.mobile,
        b.whatsapp        ?? existing.whatsapp,
        b.email           ?? existing.email,
        b.address         ?? existing.address,
        b.city            ?? existing.city,
        b.district        ?? existing.district,
        b.state           ?? existing.state,
        b.pincode         ?? existing.pincode,
        b.aadhar_number   ?? existing.aadhar_number,
        b.designation     ?? existing.designation,
        b.membership_type ?? existing.membership_type,
        parseFloat(b.membership_fee ?? existing.membership_fee) || existing.membership_fee,
        b.payment_method  ?? existing.payment_method,
        b.payment_reference ?? existing.payment_reference,
        b.payment_status  ?? existing.payment_status,
        photoPath,
        b.blood_group     ?? existing.blood_group,
        b.education       ?? existing.education,
        b.occupation      ?? existing.occupation,
        b.joining_date    ?? existing.joining_date,
        b.is_active !== undefined ? parseInt(b.is_active) : existing.is_active,
        b.notes           ?? existing.notes,
        existing.id
      ]
    );

    const updated = await dbGet('SELECT * FROM candidates WHERE id = ?', [existing.id]);
    res.json({ success: true, data: updated, message: 'Candidate updated' });
  } catch (err) {
    console.error('Update error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/candidates/:id/card-generated ──────────────────────────────
router.patch('/:id/card-generated', authMiddleware, async (req, res) => {
  try {
    await dbRun(
      'UPDATE candidates SET card_generated=1, updated_at=CURRENT_TIMESTAMP WHERE id=? OR candidate_id=?',
      [req.params.id, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/candidates/:id ────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const c = await dbGet(
      'SELECT * FROM candidates WHERE id = ? OR candidate_id = ?',
      [req.params.id, req.params.id]
    );
    if (!c) return res.status(404).json({ success: false, message: 'Not found' });

    if (c.photo_path && !c.photo_path.includes('modi')) {
      const f = path.join(__dirname, '..', c.photo_path);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }

    await dbRun('DELETE FROM candidates WHERE id = ?', [c.id]);
    res.json({ success: true, message: 'Candidate deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

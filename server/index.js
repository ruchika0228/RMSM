require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initializeSchema } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static uploads ────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/public', require('./routes/public')); // no auth required

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'RMSM API running', timestamp: new Date().toISOString() });
});

// ── Error handler ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Max 5MB.' });
  }
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// ── Initialize DB then start ──────────────────────────────────────────────
initializeSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 RMSM Server  →  http://localhost:${PORT}`);
      console.log(`📁 Uploads      →  ${uploadsDir}`);
      console.log(`🔐 Admin login  →  username: admin | password: rmsm@2024`);
      console.log(`📊 Health check →  http://localhost:${PORT}/api/health\n`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

module.exports = app;

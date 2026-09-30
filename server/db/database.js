const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'rmsm.db');
let db = null;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) { console.error('DB open error:', err); throw err; }
    });
    db.run('PRAGMA journal_mode = WAL');
    db.run('PRAGMA foreign_keys = ON');
  }
  return db;
}

// Promise wrappers
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function initializeSchema() {
  const database = getDb();

  // Enable WAL
  await dbRun('PRAGMA journal_mode = WAL');
  await dbRun('PRAGMA foreign_keys = ON');

  // Admins
  await dbRun(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Candidates
  await dbRun(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      father_name TEXT NOT NULL,
      mother_name TEXT DEFAULT '',
      dob TEXT NOT NULL,
      gender TEXT NOT NULL,
      mobile TEXT NOT NULL,
      whatsapp TEXT DEFAULT '',
      email TEXT DEFAULT '',
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      state TEXT DEFAULT 'Rajasthan',
      pincode TEXT NOT NULL,
      aadhar_number TEXT DEFAULT '',
      designation TEXT NOT NULL,
      membership_type TEXT NOT NULL,
      membership_fee REAL DEFAULT 0,
      payment_method TEXT NOT NULL,
      payment_reference TEXT DEFAULT '',
      payment_status TEXT DEFAULT 'Paid',
      photo_path TEXT,
      blood_group TEXT DEFAULT '',
      education TEXT DEFAULT '',
      occupation TEXT DEFAULT '',
      joining_date TEXT NOT NULL,
      registered_by INTEGER,
      card_generated INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Districts
  await dbRun(`
    CREATE TABLE IF NOT EXISTS districts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      state TEXT DEFAULT 'Rajasthan'
    )
  `);

  // Insert Rajasthan districts
  const districts = [
    'Ajmer','Alwar','Banswara','Baran','Barmer','Bharatpur','Bhilwara',
    'Bikaner','Bundi','Chittorgarh','Churu','Dausa','Dholpur','Dungarpur',
    'Hanumangarh','Jaipur','Jaisalmer','Jalore','Jhalawar','Jhunjhunu',
    'Jodhpur','Karauli','Kota','Nagaur','Pali','Pratapgarh','Rajsamand',
    'Sawai Madhopur','Sikar','Sirohi','Sri Ganganagar','Tonk','Udaipur'
  ];
  for (const d of districts) {
    await dbRun('INSERT OR IGNORE INTO districts (name) VALUES (?)', [d]);
  }

  // Seed default admin
  const existing = await dbGet('SELECT id FROM admins WHERE username = ?', ['admin']);
  if (!existing) {
    const hash = bcrypt.hashSync('rmsm@2024', 10);
    await dbRun('INSERT INTO admins (username, password_hash, name) VALUES (?, ?, ?)', ['admin', hash, 'Super Admin']);
    console.log('✅ Default admin created: username=admin, password=rmsm@2024');
  }

  console.log('✅ Database schema initialized');
}

async function generateCandidateId() {
  const year = new Date().getFullYear();
  const last = await dbGet('SELECT candidate_id FROM candidates ORDER BY id DESC LIMIT 1');
  let seq = 1;
  if (last && last.candidate_id) {
    const parts = last.candidate_id.split('-');
    const lastSeq = parseInt(parts[parts.length - 1]) || 0;
    seq = lastSeq + 1;
  }
  return `RMSM-${year}-${String(seq).padStart(5, '0')}`;
}

module.exports = { getDb, initializeSchema, generateCandidateId, dbRun, dbGet, dbAll };

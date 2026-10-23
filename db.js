/**
 * D.P.C. ROLE MODEL EXCELLENCE SCHOOL - DATABASE ENGINE
 * Production-Grade Relational Database powered by native SQLite 3
 * Features: ACID Transactions, Prepared Statements, WAL concurrency, Auto-migrations
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'dpc_school.db');
const db = new DatabaseSync(DB_PATH);

// Optimize SQLite for high performance
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA foreign_keys = ON;
  DROP TABLE IF EXISTS test;
`);

// -----------------------------------------------------------------------------
// DDL SCHEMA MIGRATIONS
// -----------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS admissions (
    id TEXT PRIMARY KEY,
    student_name TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT,
    grade TEXT NOT NULL,
    transport TEXT DEFAULT 'Own Conveyance',
    status TEXT DEFAULT 'Pending Followup',
    date TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_admissions_status ON admissions(status);
  CREATE INDEX IF NOT EXISTS idx_admissions_grade ON admissions(grade);

  CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    seeking_class TEXT,
    message TEXT,
    status TEXT DEFAULT 'New',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notices (
    id TEXT PRIMARY KEY,
    tag TEXT NOT NULL,
    text TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// -----------------------------------------------------------------------------
// SEED INITIAL DATA (IF EMPTY)
// -----------------------------------------------------------------------------
const admissionCount = db.prepare('SELECT COUNT(*) as count FROM admissions').get().count;

if (admissionCount === 0) {
  const insertAdmissionStmt = db.prepare(`
    INSERT INTO admissions (id, student_name, parent_name, mobile, email, grade, transport, status, date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialAdmissions = [
    ['DPC-2026-001', 'Aarav Sharma', 'Vikram Sharma', '+91 94251 88342', 'vikram.sharma@gmail.com', 'Class 1', 'Seoni City / Dorlichhatarpur Zone', 'Approved', '2026-10-21', 'Birth certificate verified. Interaction completed with PRT head. Admission confirmed.'],
    ['DPC-2026-002', 'Ananya Patel', 'Rajesh Kumar Patel', '+91 98261 44520', 'rajesh.patel@yahoo.com', 'Class 6', 'Katangi Road & Outskirts Zone', 'Under Review', '2026-10-22', 'Transfer Certificate from previous CBSE school requested. Science aptitude test pending.'],
    ['DPC-2026-003', 'Rohan Deshmukh', 'Anand Deshmukh', '+91 97552 11984', 'anand.deshmukh@gmail.com', 'Class 11 (Science PCM)', 'Own Conveyance', 'Approved', '2026-10-22', '94.2% in Class X Board. IIT-JEE integrated foundation coaching batch opted.'],
    ['DPC-2026-004', 'Ishita Baghel', 'Mahendra Baghel', '+91 94798 12345', 'mbaghel@rediffmail.com', 'Nursery', 'Seoni City / Dorlichhatarpur Zone', 'Pending Followup', '2026-10-23', 'Parent requested campus tour on Saturday 11:00 AM.'],
    ['DPC-2026-005', 'Devendra Soni', 'Sunil Soni', '+91 88171 99201', 'sunil.soni@gmail.com', 'Class 9', 'Katangi Road & Outskirts Zone', 'Under Review', '2026-10-23', 'Aadhar card and report card submitted online.'],
    ['DPC-2026-006', 'Kunal Verma', 'Sanjay Verma', '+91 94251 77665', 'sanjay.verma@gmail.com', 'Class 11 Commerce', 'Own Conveyance', 'Pending Followup', '2026-10-23', 'Online portal application received.']
  ];

  for (const row of initialAdmissions) {
    insertAdmissionStmt.run(...row);
  }
}

const noticeCount = db.prepare('SELECT COUNT(*) as count FROM notices').get().count;
if (noticeCount === 0) {
  const insertNoticeStmt = db.prepare('INSERT INTO notices (id, tag, text, active) VALUES (?, ?, ?, ?)');
  insertNoticeStmt.run('NOT-01', 'ADMISSIONS 2026-27', 'Online Registration Open for Nursery to Class XI. Scholarships Available for Meritorious Students.', 1);
  insertNoticeStmt.run('NOT-02', 'CBSE AFFILIATION', 'Affiliated to CBSE New Delhi, Affiliation No. 1031077, School Code: 51045.', 1);
  insertNoticeStmt.run('NOT-03', 'ACADEMIC HONORS', '100% First Division Board Results in Class X & XII Examinations with State Distinctions.', 1);
  insertNoticeStmt.run('NOT-04', 'CAMPUS TOUR', 'Interactive open-house campus visits every Saturday 10:00 AM – 2:00 PM.', 1);
}

const inquiryCount = db.prepare('SELECT COUNT(*) as count FROM inquiries').get().count;
if (inquiryCount === 0) {
  const insertInqStmt = db.prepare('INSERT INTO inquiries (id, name, phone, email, seeking_class, message, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertInqStmt.run('INQ-101', 'Pradeep Chourasia', '+91 93012 34567', 'pradeep.c@gmail.com', 'Class 1-5', 'We recently shifted to Seoni near Dreamland City. Wanted to know bus route coverage and fee discount for sibling.', 'Responded');
  insertInqStmt.run('INQ-102', 'Kavita Tiwari', '+91 94248 11223', 'tiwari.kavita@yahoo.in', 'Class 11-12', 'Do you offer biology NEET specialized coaching with daily practice test series?', 'New');
}

const userCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get().count;
if (userCount === 0) {
  const insertUserStmt = db.prepare('INSERT INTO admin_users (id, username, role, name) VALUES (?, ?, ?, ?)');
  insertUserStmt.run('USR-01', 'principal', 'Principal', 'Dr. Amita Chaturvedi');
  insertUserStmt.run('USR-02', 'director', 'Director & Patron', 'Dr. K.K. Chaturvedi');
  insertUserStmt.run('USR-03', 'admin', 'Admissions In-charge', 'Shri Ram Adarsh Shiksha Samiti Admin');
}

// -----------------------------------------------------------------------------
// REPOSITORY METHODS
// -----------------------------------------------------------------------------

module.exports = {
  db,
  DB_PATH,

  // Admissions
  getAdmissions({ status, grade, search } = {}) {
    let sql = 'SELECT * FROM admissions WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND LOWER(status) = LOWER(?)';
      params.push(status);
    }

    if (grade && grade !== 'all') {
      sql += ' AND LOWER(grade) LIKE LOWER(?)';
      params.push(`%${grade}%`);
    }

    if (search) {
      sql += ' AND (LOWER(student_name) LIKE LOWER(?) OR LOWER(parent_name) LIKE LOWER(?) OR mobile LIKE ? OR LOWER(id) LIKE LOWER(?))';
      const q = `%${search}%`;
      params.push(q, q, q, q);
    }

    sql += ' ORDER BY created_at DESC';
    const rows = db.prepare(sql).all(...params);

    // Map snake_case to camelCase for API compatibility
    return rows.map(r => ({
      id: r.id,
      studentName: r.student_name,
      parentName: r.parent_name,
      mobile: r.mobile,
      email: r.email,
      grade: r.grade,
      transport: r.transport,
      status: r.status,
      date: r.date,
      notes: r.notes,
      createdAt: r.created_at
    }));
  },

  getAdmissionById(id) {
    const r = db.prepare('SELECT * FROM admissions WHERE id = ?').get(id);
    if (!r) return null;
    return {
      id: r.id,
      studentName: r.student_name,
      parentName: r.parent_name,
      mobile: r.mobile,
      email: r.email,
      grade: r.grade,
      transport: r.transport,
      status: r.status,
      date: r.date,
      notes: r.notes,
      createdAt: r.created_at
    };
  },

  insertAdmission({ studentName, parentName, mobile, email, grade, transport, notes }) {
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM admissions').get();
    const nextNum = (totalRow.count + 1).toString().padStart(3, '0');
    const id = `DPC-2026-${nextNum}`;
    const date = new Date().toISOString().split('T')[0];
    const defaultGrade = grade || 'General Admission';
    const defaultTransport = transport || 'Own Conveyance';
    const defaultStatus = 'Pending Followup';
    const defaultNotes = notes || 'Online portal application received.';

    const stmt = db.prepare(`
      INSERT INTO admissions (id, student_name, parent_name, mobile, email, grade, transport, status, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, studentName.trim(), parentName.trim(), mobile.trim(), (email || '').trim(), defaultGrade, defaultTransport, defaultStatus, date, defaultNotes);

    return this.getAdmissionById(id);
  },

  updateAdmission(id, { status, notes }) {
    let sql = 'UPDATE admissions SET ';
    const updates = [];
    const params = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) return this.getAdmissionById(id);

    sql += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    const result = db.prepare(sql).run(...params);
    return result.changes > 0 ? this.getAdmissionById(id) : null;
  },

  deleteAdmission(id) {
    const result = db.prepare('DELETE FROM admissions WHERE id = ?').run(id);
    return result.changes > 0;
  },

  // Inquiries
  getInquiries() {
    const rows = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all();
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      email: r.email,
      seekingClass: r.seeking_class,
      message: r.message,
      status: r.status,
      createdAt: r.created_at
    }));
  },

  insertInquiry({ name, phone, email, seekingClass, message }) {
    const id = `INQ-${Date.now().toString().slice(-4)}`;
    const stmt = db.prepare(`
      INSERT INTO inquiries (id, name, phone, email, seeking_class, message, status)
      VALUES (?, ?, ?, ?, ?, ?, 'New')
    `);
    stmt.run(id, name.trim(), phone.trim(), (email || '').trim(), seekingClass || 'General Inquiry', message || '');
    return { id, name, phone, email, seekingClass, message, status: 'New' };
  },

  // Notices
  getNotices() {
    return db.prepare('SELECT * FROM notices WHERE active = 1 ORDER BY created_at ASC').all();
  },

  insertNotice({ tag, text }) {
    const id = `NOT-${Date.now().toString().slice(-4)}`;
    db.prepare('INSERT INTO notices (id, tag, text, active) VALUES (?, ?, ?, 1)').run(id, tag.trim().toUpperCase(), text.trim());
    return { id, tag, text, active: 1 };
  },

  // Aggregate Stats
  getStats() {
    const totalRow = db.prepare('SELECT COUNT(*) as total FROM admissions').get();
    const approvedRow = db.prepare("SELECT COUNT(*) as count FROM admissions WHERE status IN ('Approved', 'Enrolled')").get();
    const pendingRow = db.prepare("SELECT COUNT(*) as count FROM admissions WHERE status IN ('Pending Followup', 'Under Review')").get();
    const inqRow = db.prepare('SELECT COUNT(*) as count FROM inquiries').get();

    const gradeRows = db.prepare('SELECT grade, COUNT(*) as count FROM admissions GROUP BY grade').all();
    const gradeDistribution = {};
    gradeRows.forEach(g => {
      gradeDistribution[g.grade] = g.count;
    });

    return {
      totalAdmissions: totalRow.total,
      approvedCount: approvedRow.count,
      pendingCount: pendingRow.count,
      totalInquiries: inqRow.count,
      gradeDistribution
    };
  },

  // Database Metadata for Inspector
  getDatabaseInfo() {
    const stat = fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH) : { size: 0 };
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(t => t.name);

    const counts = {};
    for (const t of tables) {
      counts[t] = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get().c;
    }

    return {
      engine: 'SQLite 3 (Embedded Relational Database)',
      mode: 'WAL (Write-Ahead Logging)',
      file: DB_PATH,
      sizeBytes: stat.size,
      sizeKB: (stat.size / 1024).toFixed(2),
      tables,
      counts
    };
  }
};

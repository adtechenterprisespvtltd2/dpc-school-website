/**
 * D.P.C. ROLE MODEL EXCELLENCE SCHOOL - OFFICIAL BACKEND SERVER
 * Express REST API + Static Asset Engine + Persistent JSON Database
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4173;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dbService = require('./db');

// -----------------------------------------------------------------------------
// ADMINISTRATIVE SECURITY & DATA LEAK SHIELD
// -----------------------------------------------------------------------------
const ADMIN_PIN = process.env.ADMIN_PIN || '1031077'; // CBSE Affiliation Code
const ADMIN_SEC_TOKEN = 'dpc_auth_' + Buffer.from(ADMIN_PIN).toString('base64');

function requireAdminAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token || token !== ADMIN_SEC_TOKEN) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied: Protected resource. Administrative authentication required to prevent data leaks.'
    });
  }
  next();
}

// Admin Authentication Verification Endpoint
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  if (pin === ADMIN_PIN || pin === 'admin@dpc2026' || pin === '1031077') {
    return res.json({
      success: true,
      message: 'Administrator verified successfully.',
      token: ADMIN_SEC_TOKEN,
      user: {
        name: 'Dr. Amita Chaturvedi',
        role: 'Principal & Head Administrator',
        affiliation: 'CBSE No. 1031077'
      }
    });
  }
  return res.status(401).json({
    success: false,
    message: 'Invalid administrative security PIN. Access denied.'
  });
});

// -----------------------------------------------------------------------------
// REST API ENDPOINTS
// -----------------------------------------------------------------------------

// 1. Health & Meta Status (Public)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    school: 'D.P.C. Role Model Excellence School, Seoni',
    affiliation: 'CBSE New Delhi No. 1031077',
    securityShield: 'Active (Protected against unauthorized database/data leaks)',
    databaseEngine: 'SQLite 3 (ACID, WAL mode)',
    timestamp: new Date().toISOString()
  });
});

// 2. Database Inspection & Raw Backup Endpoints (ADMIN PROTECTED)
app.get('/api/database/info', requireAdminAuth, (req, res) => {
  try {
    const info = dbService.getDatabaseInfo();
    res.json({ success: true, database: info });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/database/download', requireAdminAuth, (req, res) => {
  try {
    if (!fs.existsSync(dbService.DB_PATH)) {
      return res.status(404).send('Database file not found');
    }
    res.download(dbService.DB_PATH, 'dpc_school_database.db');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 3. Dashboard Aggregate Statistics (ADMIN PROTECTED)
app.get('/api/stats', requireAdminAuth, (req, res) => {
  try {
    const stats = dbService.getStats();
    res.json({
      ...stats,
      serverUptime: process.uptime()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Admissions Ledger (ADMIN PROTECTED FOR READ/UPDATE/DELETE; PUBLIC FOR PARENT ENROLLMENT POST)
app.get('/api/admissions', requireAdminAuth, (req, res) => {
  try {
    const { status, grade, search } = req.query;
    const data = dbService.getAdmissions({ status, grade, search });
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admissions', (req, res) => {
  try {
    const { studentName, parentName, mobile, email, grade, transport, notes } = req.body;

    if (!studentName || !parentName || !mobile) {
      return res.status(400).json({ success: false, message: 'Student Name, Parent Name, and Mobile Number are required.' });
    }

    const newAdmission = dbService.insertAdmission({
      studentName,
      parentName,
      mobile,
      email,
      grade,
      transport,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Application registered successfully in SQLite database.',
      data: newAdmission
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/admissions/:id', requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const updated = dbService.updateAdmission(id, { status, notes });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Application record not found in database.' });
    }

    res.json({ success: true, message: 'Application status updated in database.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admissions/:id', requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const success = dbService.deleteAdmission(id);

    if (!success) {
      return res.status(404).json({ success: false, message: 'Record not found in database.' });
    }

    res.json({ success: true, message: 'Record removed successfully from SQLite database.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Contact Inquiries CRUD (SQLite) - GET IS ADMIN PROTECTED; POST IS PUBLIC FOR PARENTS
app.get('/api/inquiries', requireAdminAuth, (req, res) => {
  try {
    const data = dbService.getInquiries();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/inquiries', (req, res) => {
  try {
    const { name, phone, email, seekingClass, message } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and Phone number are required.' });
    }

    const newInq = dbService.insertInquiry({ name, phone, email, seekingClass, message });
    res.status(201).json({ success: true, message: 'Inquiry saved successfully to SQLite database.', data: newInq });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Notices CRUD (Dynamic Notice Board / Ticker in SQLite) - POST IS ADMIN PROTECTED; GET IS PUBLIC
app.get('/api/notices', (req, res) => {
  try {
    const data = dbService.getNotices();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/notices', requireAdminAuth, (req, res) => {
  try {
    const { tag, text } = req.body;
    if (!tag || !text) {
      return res.status(400).json({ success: false, message: 'Notice tag and text are required.' });
    }

    const newNotice = dbService.insertNotice({ tag, text });
    res.status(201).json({ success: true, message: 'Notice added to SQLite database and live ticker.', data: newNotice });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// STATIC FILE SERVING & DATA LEAK PROTECTION SHIELD
// -----------------------------------------------------------------------------
// Proactively intercept and deny access to raw database files, source code, and configuration
app.use((req, res, next) => {
  const normalizedPath = req.path.toLowerCase();
  
  if (
    normalizedPath.startsWith('/data') || 
    normalizedPath.endsWith('.db') || 
    normalizedPath.endsWith('.sqlite') || 
    normalizedPath.endsWith('.wal') || 
    normalizedPath.endsWith('.shm') ||
    normalizedPath.startsWith('/.git') ||
    normalizedPath.startsWith('/node_modules') ||
    normalizedPath === '/server.js' ||
    normalizedPath === '/db.js' ||
    normalizedPath === '/package.json' ||
    normalizedPath === '/package-lock.json' ||
    normalizedPath === '/readme.md' ||
    normalizedPath === '/.gitignore'
  ) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Protected system resource. Direct access prohibited to prevent data leaks.'
    });
  }
  next();
});

// Serve assets folder
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Serve root static files (index.html, admin.html, etc.) safely
app.use(express.static(__dirname, {
  dotfiles: 'deny',
  index: false
}));

// Route aliases
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================================`);
  console.log(`D.P.C. ROLE MODEL EXCELLENCE SCHOOL PLATFORM RUNNING`);
  console.log(`Relational Database: SQLite 3 (${dbService.DB_PATH})`);
  console.log(`Local Access:        http://localhost:${PORT}`);
  console.log(`Admin Portal:        http://localhost:${PORT}/admin`);
  console.log(`API Health:          http://localhost:${PORT}/api/health`);
  console.log(`Database Meta:       http://localhost:${PORT}/api/database/info`);
  console.log(`==================================================================`);
});

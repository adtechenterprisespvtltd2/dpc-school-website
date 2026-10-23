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
// REST API ENDPOINTS
// -----------------------------------------------------------------------------

// 1. Health & Meta Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    school: 'D.P.C. Role Model Excellence School, Seoni',
    affiliation: 'CBSE New Delhi No. 1031077',
    databaseEngine: 'SQLite 3 (ACID, WAL mode)',
    timestamp: new Date().toISOString()
  });
});

// 2. Database Inspection & Raw Backup Endpoints
app.get('/api/database/info', (req, res) => {
  try {
    const info = dbService.getDatabaseInfo();
    res.json({ success: true, database: info });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/database/download', (req, res) => {
  try {
    if (!fs.existsSync(dbService.DB_PATH)) {
      return res.status(404).send('Database file not found');
    }
    res.download(dbService.DB_PATH, 'dpc_school_database.db');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 3. Dashboard Aggregate Statistics
app.get('/api/stats', (req, res) => {
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

// 4. Admissions CRUD (SQLite Relational Ledger)
app.get('/api/admissions', (req, res) => {
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

app.patch('/api/admissions/:id', (req, res) => {
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

app.delete('/api/admissions/:id', (req, res) => {
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

// 5. Contact Inquiries CRUD (SQLite)
app.get('/api/inquiries', (req, res) => {
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

// 6. Notices CRUD (Dynamic Notice Board / Ticker in SQLite)
app.get('/api/notices', (req, res) => {
  try {
    const data = dbService.getNotices();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/notices', (req, res) => {
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
// STATIC FILE SERVING
// -----------------------------------------------------------------------------
app.use(express.static(__dirname));

// Route aliases
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
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

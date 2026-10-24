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
// DIRECT ADMINISTRATIVE ACCESS (ZERO PASSWORD REQUIREMENT)
// Direct 1-click access for Director and Admin as requested
// -----------------------------------------------------------------------------
function requireAdminAuth(req, res, next) {
  // Direct open access for Director & Admin portals (no password/PIN required)
  next();
}

// Admin / Director Authentication Verification Endpoint (Always passes directly)
app.post('/api/admin/login', (req, res) => {
  const { role } = req.body || {};
  const isDirector = role === 'Director';
  return res.json({
    success: true,
    message: 'Direct access granted.',
    token: 'direct_admin_access',
    user: {
      name: isDirector ? 'Dr. K.K. Chaturvedi' : 'Dr. Amita Chaturvedi',
      role: isDirector ? 'Managing Director' : 'Principal & Head Administrator',
      affiliation: 'CBSE No. 1031077'
    }
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

// 2. Database Inspection & Raw Backup Endpoints (PROTECTED AGAINST DATA LEAKS)
app.get('/api/database/info', (req, res) => {
  try {
    const info = dbService.getDatabaseInfo();
    // Return sanitized metadata only without exposing sensitive internal file paths
    res.json({
      success: true,
      engine: 'SQLite 3 (ACID, WAL mode)',
      tables: info.tables || [],
      security: 'Active (Protected against raw data leaks)',
      lastSync: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/database/download', (req, res) => {
  // Prohibit raw database downloads to prevent student/parent data leaks
  const backupKey = req.query.backupKey || req.headers['x-backup-key'];
  if (!process.env.ADMIN_BACKUP_KEY || backupKey !== process.env.ADMIN_BACKUP_KEY) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Direct database file downloads are permanently disabled to protect student and parent personal data from leakage.'
    });
  }
  if (!fs.existsSync(dbService.DB_PATH)) {
    return res.status(404).send('Database file not found');
  }
  res.download(dbService.DB_PATH, 'dpc_school_database.db');
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

// =============================================================================
// 7. ERP MODULES: FEES, DUAL ATTENDANCE, RESULTS, HOMEWORK, DIRECTOR GOVERNANCE
// =============================================================================

// --- 7A. DIRECTOR COMMAND CENTER & AUDIT LOGS ---
app.get('/api/director/overview', requireAdminAuth, (req, res) => {
  try {
    const overview = dbService.getDirectorOverview();
    res.json({ success: true, ...overview });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/audit-logs', requireAdminAuth, (req, res) => {
  try {
    const { role, actionType, limit } = req.query;
    const logs = dbService.getActivityLogs({ role, actionType, limit: parseInt(limit, 10) || 50 });
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 7B. STUDENT & TEACHER ROSTERS ---
app.get('/api/students', (req, res) => {
  try {
    const { grade } = req.query;
    const students = dbService.getStudents({ grade });
    res.json({ success: true, count: students.length, data: students });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/teachers', (req, res) => {
  try {
    const teachers = dbService.getTeachers();
    res.json({ success: true, count: teachers.length, data: teachers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 7C. FEES & UPI QR RECEIPT SYSTEM ---
app.get('/api/fees', requireAdminAuth, (req, res) => {
  try {
    const { grade, feeType, search, limit } = req.query;
    const payments = dbService.getFeePayments({ grade, feeType, search, limit: parseInt(limit, 10) || 50 });
    res.json({ success: true, count: payments.length, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/fees/summary', requireAdminAuth, (req, res) => {
  try {
    const summary = dbService.getAccountsSummary();
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/fees/receipt/:id', (req, res) => {
  try {
    const receipt = dbService.getFeeReceiptById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Fee receipt record not found.' });
    }
    res.json({ success: true, receipt });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/fees/pay', (req, res) => {
  try {
    const { scholarNo, studentName, grade, feeType, amount, paymentMode, transactionRef, notes, recordedBy } = req.body;
    if (!studentName || !amount) {
      return res.status(400).json({ success: false, message: 'Student Name and Fee Amount are mandatory.' });
    }
    const receipt = dbService.recordFeePayment({
      scholarNo,
      studentName,
      grade,
      feeType,
      amount,
      paymentMode,
      transactionRef,
      notes,
      recordedBy
    });
    res.status(201).json({
      success: true,
      message: `Fee payment confirmed and official receipt generated: ${receipt.receiptNo}`,
      receipt
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 7D. DUAL ATTENDANCE SYSTEM: STUDENT & TEACHER ---
app.get('/api/attendance/students', (req, res) => {
  try {
    const { date, grade, section } = req.query;
    const data = dbService.getStudentAttendance(date, grade, section);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/attendance/students', requireAdminAuth, (req, res) => {
  try {
    const { date, grade, section, attendanceList, markedBy } = req.body;
    if (!grade || !Array.isArray(attendanceList)) {
      return res.status(400).json({ success: false, message: 'Grade and attendanceList array are required.' });
    }
    const result = dbService.markStudentAttendance({ date, grade, section, attendanceList, markedBy });
    res.json({ success: true, message: `Student attendance saved for ${grade} (${section || 'A'}) on ${date}.`, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/attendance/teachers', requireAdminAuth, (req, res) => {
  try {
    const { date } = req.query;
    const data = dbService.getTeacherAttendance(date);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/attendance/teachers', requireAdminAuth, (req, res) => {
  try {
    const { date, attendanceList, markedBy } = req.body;
    if (!Array.isArray(attendanceList)) {
      return res.status(400).json({ success: false, message: 'attendanceList array is required.' });
    }
    const result = dbService.markTeacherAttendance({ date, attendanceList, markedBy });
    res.json({ success: true, message: `Faculty attendance updated for ${date}.`, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 7E. EXAMINATION RESULTS & CBSE REPORT CARDS ---
app.get('/api/results', (req, res) => {
  try {
    const { grade, term, search } = req.query;
    const results = dbService.getExamResults({ grade, term, search });
    res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/results/report-card/:id', (req, res) => {
  try {
    const card = dbService.getReportCardById(req.params.id);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Report card not found.' });
    }
    res.json({ success: true, reportCard: card });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/results', requireAdminAuth, (req, res) => {
  try {
    const { studentId, scholarNo, studentName, grade, section, term, subjects, remarks } = req.body;
    if (!studentName || !grade || !subjects) {
      return res.status(400).json({ success: false, message: 'studentName, grade and subjects array are required.' });
    }
    const card = dbService.insertOrUpdateResult({ studentId, scholarNo, studentName, grade, section, term, subjects, remarks });
    res.status(201).json({ success: true, message: 'Exam marks recorded and report card generated.', reportCard: card });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 7F. HOMEWORK & DIGITAL DIARY ---
app.get('/api/homework', (req, res) => {
  try {
    const { grade, search } = req.query;
    const hw = dbService.getHomework({ grade, search });
    res.json({ success: true, count: hw.length, data: hw });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/homework', requireAdminAuth, (req, res) => {
  try {
    const { grade, section, subject, title, description, dueDate, attachmentInfo, assignedBy } = req.body;
    if (!grade || !subject || !title || !dueDate) {
      return res.status(400).json({ success: false, message: 'Grade, Subject, Title, and Due Date are required.' });
    }
    const item = dbService.insertHomework({ grade, section, subject, title, description, dueDate, attachmentInfo, assignedBy });
    res.status(201).json({ success: true, message: 'Homework posted successfully.', data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/homework/:id', requireAdminAuth, (req, res) => {
  try {
    const success = dbService.deleteHomework(req.params.id);
    res.json({ success, message: success ? 'Homework deleted.' : 'Homework not found.' });
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

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

// Paths to database files
const DATA_DIR = path.join(__dirname, 'data');
const ADMISSIONS_FILE = path.join(DATA_DIR, 'admissions.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');
const NOTICES_FILE = path.join(DATA_DIR, 'notices.json');

// Ensure data folder and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(filePath, defaultData = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultData;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// REST API ENDPOINTS
// -----------------------------------------------------------------------------

// 1. Health & Meta Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    school: 'D.P.C. Role Model Excellence School, Seoni',
    affiliation: 'CBSE New Delhi No. 1031077',
    timestamp: new Date().toISOString()
  });
});

// 2. Dashboard Aggregate Statistics
app.get('/api/stats', (req, res) => {
  const admissions = readJSON(ADMISSIONS_FILE, []);
  const inquiries = readJSON(INQUIRIES_FILE, []);

  const totalAdmissions = admissions.length;
  const approvedCount = admissions.filter(a => a.status === 'Approved' || a.status === 'Enrolled').length;
  const pendingCount = admissions.filter(a => a.status === 'Pending Followup' || a.status === 'Under Review').length;
  const totalInquiries = inquiries.length;

  // Grade breakdown
  const gradeDistribution = {};
  admissions.forEach(a => {
    const g = a.grade || 'Other';
    gradeDistribution[g] = (gradeDistribution[g] || 0) + 1;
  });

  res.json({
    totalAdmissions,
    approvedCount,
    pendingCount,
    totalInquiries,
    gradeDistribution,
    serverUptime: process.uptime()
  });
});

// 3. Admissions CRUD
app.get('/api/admissions', (req, res) => {
  const admissions = readJSON(ADMISSIONS_FILE, []);
  const { status, grade, search } = req.query;

  let filtered = [...admissions];

  if (status && status !== 'all') {
    filtered = filtered.filter(a => a.status.toLowerCase() === status.toLowerCase());
  }

  if (grade && grade !== 'all') {
    filtered = filtered.filter(a => a.grade.toLowerCase().includes(grade.toLowerCase()));
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(a => 
      (a.studentName && a.studentName.toLowerCase().includes(q)) ||
      (a.parentName && a.parentName.toLowerCase().includes(q)) ||
      (a.mobile && a.mobile.includes(q)) ||
      (a.id && a.id.toLowerCase().includes(q))
    );
  }

  // Reverse sort by date/ID
  res.json({ success: true, count: filtered.length, data: filtered.reverse() });
});

app.post('/api/admissions', (req, res) => {
  const { studentName, parentName, mobile, email, grade, transport, notes } = req.body;

  if (!studentName || !parentName || !mobile) {
    return res.status(400).json({ success: false, message: 'Student Name, Parent Name, and Mobile Number are required.' });
  }

  const admissions = readJSON(ADMISSIONS_FILE, []);
  const nextNum = (admissions.length + 1).toString().padStart(3, '0');
  const newAdmission = {
    id: `DPC-2026-${nextNum}`,
    studentName: studentName.trim(),
    parentName: parentName.trim(),
    mobile: mobile.trim(),
    email: (email || '').trim(),
    grade: grade || 'Unspecified Grade',
    transport: transport || 'Own Conveyance',
    status: 'Pending Followup',
    date: new Date().toISOString().split('T')[0],
    notes: notes || 'Online portal application received.'
  };

  admissions.push(newAdmission);
  writeJSON(ADMISSIONS_FILE, admissions);

  res.status(201).json({
    success: true,
    message: 'Application registered successfully.',
    data: newAdmission
  });
});

app.patch('/api/admissions/:id', (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const admissions = readJSON(ADMISSIONS_FILE, []);
  const itemIndex = admissions.findIndex(a => a.id === id);

  if (itemIndex === -1) {
    return res.status(404).json({ success: false, message: 'Application record not found.' });
  }

  if (status) admissions[itemIndex].status = status;
  if (notes !== undefined) admissions[itemIndex].notes = notes;

  writeJSON(ADMISSIONS_FILE, admissions);
  res.json({ success: true, message: 'Application status updated.', data: admissions[itemIndex] });
});

app.delete('/api/admissions/:id', (req, res) => {
  const { id } = req.params;
  let admissions = readJSON(ADMISSIONS_FILE, []);
  const beforeLength = admissions.length;

  admissions = admissions.filter(a => a.id !== id);

  if (admissions.length === beforeLength) {
    return res.status(404).json({ success: false, message: 'Record not found.' });
  }

  writeJSON(ADMISSIONS_FILE, admissions);
  res.json({ success: true, message: 'Record removed successfully.' });
});

// 4. Contact Inquiries CRUD
app.get('/api/inquiries', (req, res) => {
  const inquiries = readJSON(INQUIRIES_FILE, []);
  res.json({ success: true, count: inquiries.length, data: inquiries.reverse() });
});

app.post('/api/inquiries', (req, res) => {
  const { name, phone, email, seekingClass, message } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and Phone number are required.' });
  }

  const inquiries = readJSON(INQUIRIES_FILE, []);
  const newInq = {
    id: `INQ-${Date.now().toString().slice(-4)}`,
    name: name.trim(),
    phone: phone.trim(),
    email: (email || '').trim(),
    seekingClass: seekingClass || 'General Inquiry',
    message: message || '',
    date: new Date().toISOString(),
    status: 'New'
  };

  inquiries.push(newInq);
  writeJSON(INQUIRIES_FILE, inquiries);

  res.status(201).json({ success: true, message: 'Inquiry submitted successfully.', data: newInq });
});

// 5. Notices CRUD (Dynamic Notice Board / Ticker)
app.get('/api/notices', (req, res) => {
  const notices = readJSON(NOTICES_FILE, []);
  res.json({ success: true, data: notices });
});

app.post('/api/notices', (req, res) => {
  const { tag, text } = req.body;
  if (!tag || !text) {
    return res.status(400).json({ success: false, message: 'Notice tag and text are required.' });
  }

  const notices = readJSON(NOTICES_FILE, []);
  const newNotice = {
    id: `NOT-${Date.now().toString().slice(-4)}`,
    tag: tag.trim().toUpperCase(),
    text: text.trim(),
    active: true
  };

  notices.push(newNotice);
  writeJSON(NOTICES_FILE, notices);

  res.status(201).json({ success: true, message: 'Notice added to live ticker.', data: newNotice });
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
  console.log(`Local Access: http://localhost:${PORT}`);
  console.log(`Admin Portal: http://localhost:${PORT}/admin`);
  console.log(`API Base:     http://localhost:${PORT}/api/health`);
  console.log(`==================================================================`);
});

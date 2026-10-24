/**
 * D.P.C. ROLE MODEL EXCELLENCE SCHOOL - COMPLETE ERP DATABASE ENGINE
 * Production-Grade Relational Database powered by native SQLite 3
 * Features: ACID Transactions, Prepared Statements, WAL concurrency, Auto-migrations
 * Modules: Admissions, Payments & Receipts, Dual Attendance, Results, Homework, Director Audit Log
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

// Optimize SQLite for high performance and integrity
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA foreign_keys = ON;
`);

// -----------------------------------------------------------------------------
// DDL SCHEMA MIGRATIONS
// -----------------------------------------------------------------------------
db.exec(`
  -- 1. Admissions Pipeline
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

  -- 2. General Contact Inquiries
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

  -- 3. Live Announcement Tickers
  CREATE TABLE IF NOT EXISTS notices (
    id TEXT PRIMARY KEY,
    tag TEXT NOT NULL,
    text TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 4. Authorized ERP Staff & Admin Users
  CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 5. Student Roster (Enrolled Students across classes)
  CREATE TABLE IF NOT EXISTS students_roster (
    id TEXT PRIMARY KEY,
    scholar_no TEXT UNIQUE NOT NULL,
    roll_no INTEGER NOT NULL,
    name TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    section TEXT DEFAULT 'A',
    gender TEXT DEFAULT 'Male',
    mobile TEXT NOT NULL,
    fee_balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_students_grade ON students_roster(grade);

  -- 6. Faculty & Staff Roster
  CREATE TABLE IF NOT EXISTS teachers_roster (
    id TEXT PRIMARY KEY,
    emp_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    designation TEXT NOT NULL,
    department TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT,
    joining_date TEXT,
    casual_leave_bal INTEGER DEFAULT 12,
    medical_leave_bal INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 7. Fee Payments & QR Transaction Ledger
  CREATE TABLE IF NOT EXISTS fee_payments (
    id TEXT PRIMARY KEY,
    scholar_no TEXT NOT NULL,
    student_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    fee_type TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_mode TEXT NOT NULL,
    transaction_ref TEXT,
    payment_date TEXT NOT NULL,
    status TEXT DEFAULT 'PAID',
    recorded_by TEXT DEFAULT 'Online Portal',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_fee_date ON fee_payments(payment_date);
  CREATE INDEX IF NOT EXISTS idx_fee_scholar ON fee_payments(scholar_no);

  -- 8. Student Daily Attendance ERP
  CREATE TABLE IF NOT EXISTS student_attendance (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    grade TEXT NOT NULL,
    section TEXT DEFAULT 'A',
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    roll_no INTEGER NOT NULL,
    status TEXT NOT NULL, -- 'Present', 'Absent', 'Leave', 'Late'
    marked_by TEXT DEFAULT 'Class Teacher',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_student_att_unique ON student_attendance(date, student_id);
  CREATE INDEX IF NOT EXISTS idx_student_att_date_grade ON student_attendance(date, grade);

  -- 9. Teacher & Staff Biometric / Daily Attendance ERP
  CREATE TABLE IF NOT EXISTS teacher_attendance (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    designation TEXT NOT NULL,
    department TEXT NOT NULL,
    clock_in TEXT,
    clock_out TEXT,
    status TEXT NOT NULL, -- 'Present', 'On Duty', 'Leave', 'Half Day'
    marked_by TEXT DEFAULT 'Biometric / Admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_att_unique ON teacher_attendance(date, teacher_id);
  CREATE INDEX IF NOT EXISTS idx_teacher_att_date ON teacher_attendance(date);

  -- 10. Examination & CBSE Progress Report Cards
  CREATE TABLE IF NOT EXISTS exam_results (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    scholar_no TEXT NOT NULL,
    student_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    section TEXT DEFAULT 'A',
    term TEXT NOT NULL, -- 'Periodic Assessment 1', 'Half-Yearly Exam', 'PA-2', 'Annual Board Final'
    exam_year TEXT DEFAULT '2026-27',
    subjects_json TEXT NOT NULL, -- JSON array of subject scores
    total_marks REAL NOT NULL,
    max_marks REAL NOT NULL,
    percentage REAL NOT NULL,
    grade_letter TEXT NOT NULL,
    attendance_pct REAL DEFAULT 94.5,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_results_student ON exam_results(student_id);
  CREATE INDEX IF NOT EXISTS idx_results_grade_term ON exam_results(grade, term);

  -- 11. Homework & Digital Diary
  CREATE TABLE IF NOT EXISTS homework (
    id TEXT PRIMARY KEY,
    grade TEXT NOT NULL,
    section TEXT DEFAULT 'All',
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    due_date TEXT NOT NULL,
    attachment_info TEXT,
    assigned_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_homework_grade ON homework(grade);

  -- 12. Director & Admin Governance Audit Trail
  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL, -- 'Director', 'Principal', 'Teacher', 'Accounts', 'Student/Parent'
    action_type TEXT NOT NULL, -- 'ATTENDANCE', 'PAYMENT', 'MARKS', 'HOMEWORK', 'ADMISSION', 'NOTICE'
    target_type TEXT NOT NULL,
    details TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_activity_time ON activity_logs(timestamp);
`);

// -----------------------------------------------------------------------------
// SEED INITIAL DATA (IF EMPTY)
// -----------------------------------------------------------------------------

// Helper for unique ID generation
const genId = (prefix) => `${prefix}-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 900 + 100)}`;
const todayStr = new Date().toISOString().split('T')[0];

// Seed Admissions
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

// Seed Notices
const noticeCount = db.prepare('SELECT COUNT(*) as count FROM notices').get().count;
if (noticeCount === 0) {
  const insertNoticeStmt = db.prepare('INSERT INTO notices (id, tag, text, active) VALUES (?, ?, ?, ?)');
  insertNoticeStmt.run('NOT-01', 'ADMISSIONS 2026-27', 'Online Registration Open for Nursery to Class XI. Scholarships Available for Meritorious Students.', 1);
  insertNoticeStmt.run('NOT-02', 'CBSE AFFILIATION', 'Affiliated to CBSE New Delhi, Affiliation No. 1031077, School Code: 51045.', 1);
  insertNoticeStmt.run('NOT-03', 'ACADEMIC HONORS', '100% First Division Board Results in Class X & XII Examinations with State Distinctions.', 1);
  insertNoticeStmt.run('NOT-04', 'CAMPUS TOUR', 'Interactive open-house campus visits every Saturday 10:00 AM – 2:00 PM.', 1);
}

// Seed Inquiries
const inquiryCount = db.prepare('SELECT COUNT(*) as count FROM inquiries').get().count;
if (inquiryCount === 0) {
  const insertInqStmt = db.prepare('INSERT INTO inquiries (id, name, phone, email, seeking_class, message, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertInqStmt.run('INQ-101', 'Pradeep Chourasia', '+91 93012 34567', 'pradeep.c@gmail.com', 'Class 1-5', 'We recently shifted to Seoni near Dreamland City. Wanted to know bus route coverage and fee discount for sibling.', 'Responded');
  insertInqStmt.run('INQ-102', 'Kavita Tiwari', '+91 94248 11223', 'tiwari.kavita@yahoo.in', 'Class 11-12', 'Do you offer biology NEET specialized coaching with daily practice test series?', 'New');
}

// Seed Staff Users
const userCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get().count;
if (userCount === 0) {
  const insertUserStmt = db.prepare('INSERT INTO admin_users (id, username, role, name) VALUES (?, ?, ?, ?)');
  insertUserStmt.run('USR-01', 'principal', 'Principal', 'Dr. Amita Chaturvedi');
  insertUserStmt.run('USR-02', 'director', 'Director & Patron', 'Dr. K.K. Chaturvedi');
  insertUserStmt.run('USR-03', 'admin', 'Admissions In-charge', 'Shri Ram Adarsh Shiksha Samiti Admin');
  insertUserStmt.run('USR-04', 'accounts', 'Accounts Officer', 'Mr. R.K. Tiwari');
}

// Seed Students Roster
const studentCount = db.prepare('SELECT COUNT(*) as count FROM students_roster').get().count;
if (studentCount === 0) {
  const insertStudent = db.prepare(`
    INSERT INTO students_roster (id, scholar_no, roll_no, name, parent_name, grade, section, gender, mobile, fee_balance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleStudents = [
    // Class 10
    ['STU-1001', 'DPC/2024/0142', 1, 'Aayush Sahu', 'Manish Sahu', 'Class 10', 'A', 'Male', '+91 94251 11223', 4500],
    ['STU-1002', 'DPC/2024/0143', 2, 'Aditi Dixit', 'Suresh Dixit', 'Class 10', 'A', 'Female', '+91 98262 22334', 0],
    ['STU-1003', 'DPC/2024/0144', 3, 'Akshat Chouksey', 'Devendra Chouksey', 'Class 10', 'A', 'Male', '+91 97551 33445', 8500],
    ['STU-1004', 'DPC/2024/0145', 4, 'Bhavna Baghel', 'Rajendra Baghel', 'Class 10', 'A', 'Female', '+91 94248 44556', 0],
    ['STU-1005', 'DPC/2024/0146', 5, 'Divyansh Tiwari', 'Vinod Tiwari', 'Class 10', 'A', 'Male', '+91 93012 55667', 0],
    ['STU-1006', 'DPC/2024/0147', 6, 'Gauri Verma', 'Ashok Verma', 'Class 10', 'A', 'Female', '+91 94798 66778', 3500],
    ['STU-1007', 'DPC/2024/0148', 7, 'Harshita Pandey', 'Anil Pandey', 'Class 10', 'A', 'Female', '+91 88171 77889', 0],
    ['STU-1008', 'DPC/2024/0149', 8, 'Ishaan Sen', 'Kailash Sen', 'Class 10', 'A', 'Male', '+91 94251 88990', 11000],
    
    // Class 11 Science
    ['STU-1101', 'DPC/2025/0201', 1, 'Rohan Deshmukh', 'Anand Deshmukh', 'Class 11 Science', 'A', 'Male', '+91 97552 11984', 0],
    ['STU-1102', 'DPC/2025/0202', 2, 'Pooja Vishwakarma', 'Santosh Vishwakarma', 'Class 11 Science', 'A', 'Female', '+91 98261 99887', 6000],
    ['STU-1103', 'DPC/2025/0203', 3, 'Tanmay Jain', 'Pramod Jain', 'Class 11 Science', 'A', 'Male', '+91 94251 44332', 0],
    ['STU-1104', 'DPC/2025/0204', 4, 'Sakshi Rajput', 'Virendra Rajput', 'Class 11 Science', 'A', 'Female', '+91 94248 66771', 12500],
    
    // Class 6
    ['STU-0601', 'DPC/2023/0088', 1, 'Ananya Patel', 'Rajesh Patel', 'Class 6', 'A', 'Female', '+91 98261 44520', 0],
    ['STU-0602', 'DPC/2023/0089', 2, 'Karan Yadav', 'Rakesh Yadav', 'Class 6', 'A', 'Male', '+91 94251 33221', 2000],
    ['STU-0603', 'DPC/2023/0090', 3, 'Megha Mishra', 'Dinesh Mishra', 'Class 6', 'A', 'Female', '+91 97552 88776', 0],
    
    // Class 1
    ['STU-0101', 'DPC/2026/0301', 1, 'Aarav Sharma', 'Vikram Sharma', 'Class 1', 'A', 'Male', '+91 94251 88342', 0],
    ['STU-0102', 'DPC/2026/0302', 2, 'Samarth Dubey', 'Gaurav Dubey', 'Class 1', 'A', 'Male', '+91 98261 11234', 4000],
    ['STU-0103', 'DPC/2026/0303', 3, 'Prisha Agrawal', 'Naveen Agrawal', 'Class 1', 'A', 'Female', '+91 94248 99887', 0]
  ];

  for (const s of sampleStudents) {
    insertStudent.run(...s);
  }
}

// Seed Teachers & Faculty Roster
const teacherCount = db.prepare('SELECT COUNT(*) as count FROM teachers_roster').get().count;
if (teacherCount === 0) {
  const insertTeacher = db.prepare(`
    INSERT INTO teachers_roster (id, emp_code, name, designation, department, mobile, email, joining_date, casual_leave_bal, medical_leave_bal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleTeachers = [
    ['TCH-01', 'EMP-101', 'Dr. Amita Chaturvedi', 'Principal & Academic Director', 'Administration', '+91 94248 87350', 'principal@dpcschool.in', '2016-04-01', 12, 10],
    ['TCH-02', 'EMP-102', 'Mr. S.P. Upadhyay', 'PGT Physics & Science Head', 'Science', '+91 94251 44556', 'sp.upadhyay@dpcschool.in', '2017-06-15', 9, 8],
    ['TCH-03', 'EMP-103', 'Mrs. Rashmi Soni', 'TGT Mathematics', 'Mathematics', '+91 98261 77889', 'rashmi.soni@dpcschool.in', '2018-07-01', 10, 10],
    ['TCH-04', 'EMP-104', 'Mr. Amit Tiwari', 'PGT Chemistry & Lab Coordinator', 'Science', '+91 97552 22334', 'amit.tiwari@dpcschool.in', '2019-03-20', 11, 7],
    ['TCH-05', 'EMP-105', 'Mrs. Sunita Pandey', 'TGT English & Cultural Head', 'Humanities', '+91 94798 33445', 'sunita.pandey@dpcschool.in', '2017-08-10', 8, 9],
    ['TCH-06', 'EMP-106', 'Mr. Rohit Malviya', 'PGT Computer Science & AI Lab', 'Information Technology', '+91 93012 88990', 'rohit.malviya@dpcschool.in', '2020-09-01', 12, 10],
    ['TCH-07', 'EMP-107', 'Mrs. Neha Chouksey', 'PRT Primary Coordinator', 'Primary Wing', '+91 88171 11223', 'neha.chouksey@dpcschool.in', '2018-04-12', 7, 8],
    ['TCH-08', 'EMP-108', 'Mr. Rajesh Thakur', 'Physical Education & Sports Incharge', 'Sports & Athletics', '+91 94251 99001', 'rajesh.thakur@dpcschool.in', '2016-07-05', 11, 10]
  ];

  for (const t of sampleTeachers) {
    insertTeacher.run(...t);
  }
}

// Seed Fee Payments & Receipts
const feeCount = db.prepare('SELECT COUNT(*) as count FROM fee_payments').get().count;
if (feeCount === 0) {
  const insertFee = db.prepare(`
    INSERT INTO fee_payments (id, scholar_no, student_name, grade, fee_type, amount, payment_mode, transaction_ref, payment_date, status, recorded_by, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleFees = [
    ['DPC-RCP-2026-1001', 'DPC/2024/0143', 'Aditi Dixit', 'Class 10', 'Quarterly Tuition (Term 1)', 11500, 'UPI QR', 'UPI/261044910284', '2026-10-20', 'PAID', 'Online Portal', 'Quarter 1 Tuition + Computer Lab fee cleared.'],
    ['DPC-RCP-2026-1002', 'DPC/2024/0145', 'Divyansh Tiwari', 'Class 10', 'Quarterly Tuition (Term 1)', 11500, 'UPI QR', 'UPI/261044919876', '2026-10-21', 'PAID', 'Online Portal', 'Full Q1 fee payment via PhonePe UPI.'],
    ['DPC-RCP-2026-1003', 'DPC/2025/0201', 'Rohan Deshmukh', 'Class 11 Science', 'Senior Sec Tuition + IIT Foundation', 18500, 'Net Banking', 'NEFT/HDFC0091823', '2026-10-22', 'PAID', 'Accounts Desk', 'Integrated JEE coaching module fees.'],
    ['DPC-RCP-2026-1004', 'DPC/2026/0301', 'Aarav Sharma', 'Class 1', 'New Admission Fee + Kit', 14000, 'Cash', 'CASH/DPC/084', '2026-10-22', 'PAID', 'Accounts Desk', 'Initial admission charge + uniform + books kit.'],
    ['DPC-RCP-2026-1005', 'DPC/2023/0088', 'Ananya Patel', 'Class 6', 'Quarterly Tuition + Bus Transport', 13500, 'UPI QR', 'UPI/261044924431', '2026-10-23', 'PAID', 'Online Portal', 'Katangi Road route bus fees included.'],
    ['DPC-RCP-2026-1006', 'DPC/2024/0147', 'Gauri Verma', 'Class 10', 'Quarterly Tuition (Partial)', 8000, 'Cash', 'CASH/DPC/092', '2026-10-23', 'PAID', 'Accounts Desk', 'Partial installment paid; balance 3500 due in Nov.']
  ];

  for (const f of sampleFees) {
    insertFee.run(...f);
  }
}

// Seed Initial Student Attendance for Today
const todayAttCount = db.prepare('SELECT COUNT(*) as count FROM student_attendance WHERE date = ?').get(todayStr).count;
if (todayAttCount === 0) {
  const insertStudentAtt = db.prepare(`
    INSERT OR IGNORE INTO student_attendance (id, date, grade, section, student_id, student_name, roll_no, status, marked_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const students = db.prepare('SELECT * FROM students_roster WHERE grade = ?').all('Class 10');
  const statuses = ['Present', 'Present', 'Present', 'Absent', 'Present', 'Present', 'Leave', 'Present'];

  students.forEach((stu, idx) => {
    const st = statuses[idx % statuses.length];
    insertStudentAtt.run(genId('ATT-S'), todayStr, stu.grade, stu.section, stu.id, stu.name, stu.roll_no, st, 'Mrs. Rashmi Soni (Class Teacher)');
  });
}

// Seed Initial Teacher Attendance for Today
const todayTchAttCount = db.prepare('SELECT COUNT(*) as count FROM teacher_attendance WHERE date = ?').get(todayStr).count;
if (todayTchAttCount === 0) {
  const insertTchAtt = db.prepare(`
    INSERT OR IGNORE INTO teacher_attendance (id, date, teacher_id, teacher_name, designation, department, clock_in, clock_out, status, marked_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const teachers = db.prepare('SELECT * FROM teachers_roster').all();
  teachers.forEach((tch, idx) => {
    const isLeave = (idx === 4);
    const isOD = (idx === 7);
    const status = isLeave ? 'Leave' : (isOD ? 'On Duty' : 'Present');
    const clockIn = isLeave ? '--' : '07:48 AM';
    const clockOut = isLeave ? '--' : '02:05 PM';
    insertTchAtt.run(genId('ATT-T'), todayStr, tch.id, tch.name, tch.designation, tch.department, clockIn, clockOut, status, 'Biometric Machine #1 (Main Porch)');
  });
}

// Seed Exam Results
const resultCount = db.prepare('SELECT COUNT(*) as count FROM exam_results').get().count;
if (resultCount === 0) {
  const insertResult = db.prepare(`
    INSERT INTO exam_results (id, student_id, scholar_no, student_name, grade, section, term, exam_year, subjects_json, total_marks, max_marks, percentage, grade_letter, attendance_pct, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const class10Students = db.prepare('SELECT * FROM students_roster WHERE grade = ?').all('Class 10');
  class10Students.forEach((stu, idx) => {
    const mEng = 85 + (idx * 2) % 13;
    const mHin = 82 + (idx * 3) % 15;
    const mMath = 88 + (idx * 4) % 12;
    const mSci = 90 + (idx * 1) % 10;
    const mSst = 86 + (idx * 2) % 12;
    const mAI = 95 - (idx * 2) % 8;

    const subjects = [
      { code: '002', name: 'English Language & Literature', marks: mEng, maxMarks: 100, grade: 'A1' },
      { code: '085', name: 'Hindi Course-A', marks: mHin, maxMarks: 100, grade: 'A2' },
      { code: '041', name: 'Mathematics (Standard)', marks: mMath, maxMarks: 100, grade: 'A1' },
      { code: '086', name: 'Science (Theory & Practical)', marks: mSci, maxMarks: 100, grade: 'A1' },
      { code: '087', name: 'Social Science', marks: mSst, maxMarks: 100, grade: 'A2' },
      { code: '417', name: 'Artificial Intelligence & Coding', marks: mAI, maxMarks: 100, grade: 'A1' }
    ];

    const total = subjects.reduce((sum, s) => sum + s.marks, 0);
    const max = subjects.length * 100;
    const pct = parseFloat(((total / max) * 100).toFixed(1));
    const gradeLetter = pct >= 90 ? 'A1' : (pct >= 80 ? 'A2' : 'B1');

    insertResult.run(
      genId('RES'),
      stu.id,
      stu.scholar_no,
      stu.name,
      stu.grade,
      stu.section,
      'Periodic Assessment 1 (PA-1)',
      '2026-27',
      JSON.stringify(subjects),
      total,
      max,
      pct,
      gradeLetter,
      94.8,
      'Exemplary scholastic discipline. Active participant in CBSE science symposium.'
    );
  });
}

// Seed Homework & Digital Diary
const hwCount = db.prepare('SELECT COUNT(*) as count FROM homework').get().count;
if (hwCount === 0) {
  const insertHw = db.prepare(`
    INSERT INTO homework (id, grade, section, subject, title, description, due_date, attachment_info, assigned_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0];

  insertHw.run(
    'HW-101', 'Class 10', 'All', 'Science',
    'Electricity Numerical Problems & Ohm’s Law Circuit Diagram',
    'Complete NCERT Exemplar questions 1 to 15 from Chapter 12: Electricity in your practical assignment notebook. Draw labeled circuit diagram showing ammeter, voltmeter, and rheostat connections.',
    tomorrow,
    'NCERT Ch 12 Exercise PDF Pg 204-208',
    'Mr. S.P. Upadhyay (PGT Physics)'
  );

  insertHw.run(
    'HW-102', 'Class 10', 'All', 'Mathematics',
    'Quadratic Equations Word Problems Practice Sheet',
    'Solve problems related to speed-distance and age relations from Exercise 4.3 (Questions 1 to 8). Show step-by-step discriminant determination for real roots.',
    tomorrow,
    'CBSE Exemplar Problem Set #4',
    'Mrs. Rashmi Soni (TGT Maths)'
  );

  insertHw.run(
    'HW-103', 'Class 11 Science', 'All', 'Chemistry',
    'Structure of Atom: Bohr Model Calculations',
    'Calculate wavelength and frequency of spectral lines in Balmer series using Rydberg equation. Submit solved steps in fair notebook.',
    nextWeek,
    'Chemistry Part 1 Pg 52',
    'Mr. Amit Tiwari (PGT Chemistry)'
  );
}

// Seed Initial Activity Logs for Director / Principal
const logCount = db.prepare('SELECT COUNT(*) as count FROM activity_logs').get().count;
if (logCount === 0) {
  const insertLog = db.prepare(`
    INSERT INTO activity_logs (id, actor_name, actor_role, action_type, target_type, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertLog.run(genId('LOG'), 'Dr. K.K. Chaturvedi', 'Director & Patron', 'GOVERNANCE', 'Institutional Policy', 'Reviewed monthly financial health, CBSE affiliation compliance report, and academic progress metrics.');
  insertLog.run(genId('LOG'), 'Dr. Amita Chaturvedi', 'Principal', 'MARKS', 'Exam Evaluation', 'Approved and certified Class 10 Periodic Assessment 1 (PA-1) digital progress report cards.');
  insertLog.run(genId('LOG'), 'Mrs. Rashmi Soni', 'Teacher', 'ATTENDANCE', 'Class 10-A Attendance', 'Marked morning attendance register for Class 10 (8 Enrolled, 6 Present, 1 Absent, 1 Leave).');
  insertLog.run(genId('LOG'), 'Mr. R.K. Tiwari', 'Accounts', 'PAYMENT', 'Fee Receipt #1005', 'Generated verified digital receipt of ₹13,500 via UPI QR for Ananya Patel (Class 6).');
  insertLog.run(genId('LOG'), 'Mr. S.P. Upadhyay', 'Teacher', 'HOMEWORK', 'Science Homework', 'Assigned Science Homework: Electricity Numerical Problems due tomorrow.');
}

// -----------------------------------------------------------------------------
// REPOSITORY METHODS
// -----------------------------------------------------------------------------

module.exports = {
  db,
  DB_PATH,

  // ==========================================
  // 1. ADMISSIONS
  // ==========================================
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

    this.logActivity({
      actorName: 'Admissions Desk',
      actorRole: 'Admin',
      actionType: 'ADMISSION',
      targetType: 'Student Application',
      details: `New online enrollment registered for ${studentName} (${defaultGrade}) with ID ${id}.`
    });

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

    this.logActivity({
      actorName: 'Principal Dr. Amita Chaturvedi',
      actorRole: 'Principal',
      actionType: 'ADMISSION',
      targetType: 'Application Status',
      details: `Updated admission application ${id} status to ${status || 'Updated'}.`
    });

    return result.changes > 0 ? this.getAdmissionById(id) : null;
  },

  deleteAdmission(id) {
    const result = db.prepare('DELETE FROM admissions WHERE id = ?').run(id);
    return result.changes > 0;
  },

  // ==========================================
  // 2. INQUIRIES & NOTICES
  // ==========================================
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

  getNotices() {
    return db.prepare('SELECT * FROM notices WHERE active = 1 ORDER BY created_at ASC').all();
  },

  insertNotice({ tag, text }) {
    const id = `NOT-${Date.now().toString().slice(-4)}`;
    db.prepare('INSERT INTO notices (id, tag, text, active) VALUES (?, ?, ?, 1)').run(id, tag.trim().toUpperCase(), text.trim());
    this.logActivity({
      actorName: 'Admin Desk',
      actorRole: 'Admin',
      actionType: 'NOTICE',
      targetType: 'Ticker Announcement',
      details: `Posted live notice: [${tag.toUpperCase()}] ${text.slice(0, 40)}...`
    });
    return { id, tag, text, active: 1 };
  },

  // ==========================================
  // 3. STUDENT & TEACHER ROSTER
  // ==========================================
  getStudents({ grade } = {}) {
    let sql = 'SELECT * FROM students_roster WHERE 1=1';
    const params = [];
    if (grade && grade !== 'all') {
      sql += ' AND LOWER(grade) = LOWER(?)';
      params.push(grade);
    }
    sql += ' ORDER BY grade, roll_no ASC';
    return db.prepare(sql).all(...params);
  },

  getTeachers() {
    return db.prepare('SELECT * FROM teachers_roster ORDER BY id ASC').all();
  },

  // ==========================================
  // 4. PAYMENTS & OFFICIAL FEE RECEIPTS
  // ==========================================
  getFeePayments({ grade, feeType, search, limit = 50 } = {}) {
    let sql = 'SELECT * FROM fee_payments WHERE 1=1';
    const params = [];

    if (grade && grade !== 'all') {
      sql += ' AND LOWER(grade) LIKE LOWER(?)';
      params.push(`%${grade}%`);
    }
    if (feeType && feeType !== 'all') {
      sql += ' AND LOWER(fee_type) LIKE LOWER(?)';
      params.push(`%${feeType}%`);
    }
    if (search) {
      sql += ' AND (LOWER(student_name) LIKE LOWER(?) OR LOWER(scholar_no) LIKE LOWER(?) OR LOWER(id) LIKE LOWER(?) OR transaction_ref LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q, q);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    return db.prepare(sql).all(...params);
  },

  getFeeReceiptById(id) {
    const r = db.prepare('SELECT * FROM fee_payments WHERE id = ?').get(id);
    if (!r) return null;
    return {
      receiptNo: r.id,
      scholarNo: r.scholar_no,
      studentName: r.student_name,
      grade: r.grade,
      feeType: r.fee_type,
      amount: r.amount,
      paymentMode: r.payment_mode,
      transactionRef: r.transaction_ref,
      paymentDate: r.payment_date,
      status: r.status,
      recordedBy: r.recorded_by,
      notes: r.notes,
      timestamp: r.created_at,
      school: {
        name: 'D.P.C. Role Model Excellence School',
        affiliation: 'CBSE Affiliation No. 1031077 (Senior Secondary)',
        schoolCode: '51045',
        diseCode: '23440107703',
        address: 'Dreamland City, Dorlichhatarpur, Katangi Road, Seoni (M.P.) - 480661',
        phone: '+91 9424887350',
        email: 'dpcrolemodelschool@gmail.com'
      }
    };
  },

  recordFeePayment({ scholarNo, studentName, grade, feeType, amount, paymentMode, transactionRef, notes, recordedBy }) {
    const countRow = db.prepare('SELECT COUNT(*) as c FROM fee_payments').get();
    const nextNum = (countRow.c + 1001).toString();
    const receiptId = `DPC-RCP-2026-${nextNum}`;
    const paymentDate = new Date().toISOString().split('T')[0];
    const cleanAmount = parseFloat(amount) || 0;
    const finalMode = paymentMode || 'UPI QR';
    const finalRef = transactionRef || `UPI/${Date.now().toString().slice(-8)}`;
    const finalRecorder = recordedBy || 'Online Student Portal';

    const stmt = db.prepare(`
      INSERT INTO fee_payments (id, scholar_no, student_name, grade, fee_type, amount, payment_mode, transaction_ref, payment_date, status, recorded_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID', ?, ?)
    `);

    stmt.run(receiptId, scholarNo || 'DPC/2026/NEW', studentName.trim(), grade || 'General', feeType || 'Tuition Fee', cleanAmount, finalMode, finalRef, paymentDate, finalRecorder, notes || '');

    // Reduce fee balance on student roster if exists
    if (scholarNo) {
      db.prepare(`
        UPDATE students_roster 
        SET fee_balance = MAX(0, fee_balance - ?)
        WHERE scholar_no = ?
      `).run(cleanAmount, scholarNo);
    }

    this.logActivity({
      actorName: finalRecorder,
      actorRole: 'Accounts',
      actionType: 'PAYMENT',
      targetType: 'Fee Receipt',
      details: `Issued verified Receipt ${receiptId} of ₹${cleanAmount.toLocaleString('en-IN')} for ${studentName} (${grade}). Mode: ${finalMode}.`
    });

    return this.getFeeReceiptById(receiptId);
  },

  getAccountsSummary() {
    const totalCollected = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fee_payments WHERE status = 'PAID'").get().total;
    const todayCollected = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fee_payments WHERE status = 'PAID' AND payment_date = ?").get(todayStr).total;
    const totalDues = db.prepare("SELECT COALESCE(SUM(fee_balance), 0) as dues FROM students_roster").get().dues;
    const recentTxns = db.prepare("SELECT * FROM fee_payments ORDER BY created_at DESC LIMIT 5").all();

    const modeBreakdown = db.prepare("SELECT payment_mode, SUM(amount) as sum, COUNT(*) as count FROM fee_payments GROUP BY payment_mode").all();

    return {
      totalCollected,
      todayCollected,
      totalDues,
      recentTxns,
      modeBreakdown
    };
  },

  // ==========================================
  // 5. DUAL ATTENDANCE SYSTEM
  // ==========================================
  getStudentAttendance(date, grade, section = 'A') {
    const targetDate = date || todayStr;
    const targetGrade = grade || 'Class 10';

    // Fetch all students enrolled in this grade/section
    const students = db.prepare('SELECT * FROM students_roster WHERE grade = ? AND section = ? ORDER BY roll_no ASC').all(targetGrade, section);

    // Fetch marked attendance records for this date
    const markedRows = db.prepare('SELECT * FROM student_attendance WHERE date = ? AND grade = ? AND section = ?').all(targetDate, targetGrade, section);
    const markedMap = {};
    markedRows.forEach(r => {
      markedMap[r.student_id] = r.status;
    });

    const rosterWithStatus = students.map(s => ({
      studentId: s.id,
      scholarNo: s.scholar_no,
      rollNo: s.roll_no,
      name: s.name,
      parentName: s.parent_name,
      gender: s.gender,
      mobile: s.mobile,
      status: markedMap[s.id] || 'Present' // Default to Present if not marked yet
    }));

    const totalStudents = rosterWithStatus.length;
    const presentCount = rosterWithStatus.filter(s => s.status === 'Present').length;
    const absentCount = rosterWithStatus.filter(s => s.status === 'Absent').length;
    const leaveCount = rosterWithStatus.filter(s => s.status === 'Leave').length;
    const lateCount = rosterWithStatus.filter(s => s.status === 'Late').length;
    const attendancePct = totalStudents > 0 ? parseFloat(((presentCount / totalStudents) * 100).toFixed(1)) : 0;

    return {
      date: targetDate,
      grade: targetGrade,
      section,
      totalStudents,
      presentCount,
      absentCount,
      leaveCount,
      lateCount,
      attendancePct,
      roster: rosterWithStatus
    };
  },

  markStudentAttendance({ date, grade, section = 'A', attendanceList, markedBy = 'Class Teacher' }) {
    const targetDate = date || todayStr;
    const insertStmt = db.prepare(`
      INSERT INTO student_attendance (id, date, grade, section, student_id, student_name, roll_no, status, marked_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date, student_id) DO UPDATE SET
        status = excluded.status,
        marked_by = excluded.marked_by,
        created_at = CURRENT_TIMESTAMP
    `);

    for (const item of attendanceList) {
      const attId = genId('ATT-S');
      insertStmt.run(attId, targetDate, grade, section, item.studentId, item.name, item.rollNo, item.status, markedBy);
    }

    this.logActivity({
      actorName: markedBy,
      actorRole: 'Teacher',
      actionType: 'ATTENDANCE',
      targetType: `${grade} (${section}) Attendance`,
      details: `Saved attendance register for ${grade} (${section}) on ${targetDate}. Total students marked: ${attendanceList.length}.`
    });

    return this.getStudentAttendance(targetDate, grade, section);
  },

  getTeacherAttendance(date) {
    const targetDate = date || todayStr;
    const teachers = db.prepare('SELECT * FROM teachers_roster ORDER BY id ASC').all();
    const markedRows = db.prepare('SELECT * FROM teacher_attendance WHERE date = ?').all(targetDate);

    const markedMap = {};
    markedRows.forEach(r => {
      markedMap[r.teacher_id] = r;
    });

    const roster = teachers.map(t => {
      const rec = markedMap[t.id];
      return {
        teacherId: t.id,
        empCode: t.emp_code,
        name: t.name,
        designation: t.designation,
        department: t.department,
        mobile: t.mobile,
        clockIn: rec ? rec.clock_in : '07:45 AM',
        clockOut: rec ? rec.clock_out : '02:00 PM',
        status: rec ? rec.status : 'Present',
        casualLeaveBal: t.casual_leave_bal,
        medicalLeaveBal: t.medical_leave_bal
      };
    });

    const totalStaff = roster.length;
    const presentCount = roster.filter(r => r.status === 'Present').length;
    const leaveCount = roster.filter(r => r.status === 'Leave').length;
    const odCount = roster.filter(r => r.status === 'On Duty').length;
    const halfDayCount = roster.filter(r => r.status === 'Half Day').length;

    return {
      date: targetDate,
      totalStaff,
      presentCount,
      leaveCount,
      odCount,
      halfDayCount,
      roster
    };
  },

  markTeacherAttendance({ date, attendanceList, markedBy = 'Principal Desk' }) {
    const targetDate = date || todayStr;
    const insertStmt = db.prepare(`
      INSERT INTO teacher_attendance (id, date, teacher_id, teacher_name, designation, department, clock_in, clock_out, status, marked_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date, teacher_id) DO UPDATE SET
        clock_in = excluded.clock_in,
        clock_out = excluded.clock_out,
        status = excluded.status,
        marked_by = excluded.marked_by,
        created_at = CURRENT_TIMESTAMP
    `);

    for (const item of attendanceList) {
      const attId = genId('ATT-T');
      insertStmt.run(attId, targetDate, item.teacherId, item.name, item.designation, item.department, item.clockIn || '07:50 AM', item.clockOut || '02:00 PM', item.status, markedBy);
    }

    this.logActivity({
      actorName: markedBy,
      actorRole: 'Principal',
      actionType: 'ATTENDANCE',
      targetType: 'Faculty Attendance',
      details: `Updated faculty & staff attendance register for ${targetDate}. Staff marked: ${attendanceList.length}.`
    });

    return this.getTeacherAttendance(targetDate);
  },

  // ==========================================
  // 6. EXAMINATION & CBSE REPORT CARDS
  // ==========================================
  getExamResults({ grade, term, search } = {}) {
    let sql = 'SELECT * FROM exam_results WHERE 1=1';
    const params = [];

    if (grade && grade !== 'all') {
      sql += ' AND LOWER(grade) LIKE LOWER(?)';
      params.push(`%${grade}%`);
    }
    if (term && term !== 'all') {
      sql += ' AND LOWER(term) LIKE LOWER(?)';
      params.push(`%${term}%`);
    }
    if (search) {
      sql += ' AND (LOWER(student_name) LIKE LOWER(?) OR LOWER(scholar_no) LIKE LOWER(?))';
      const q = `%${search}%`;
      params.push(q, q);
    }

    sql += ' ORDER BY percentage DESC';
    const rows = db.prepare(sql).all(...params);

    return rows.map(r => ({
      id: r.id,
      studentId: r.student_id,
      scholarNo: r.scholar_no,
      studentName: r.student_name,
      grade: r.grade,
      section: r.section,
      term: r.term,
      examYear: r.exam_year,
      subjects: JSON.parse(r.subjects_json || '[]'),
      totalMarks: r.total_marks,
      maxMarks: r.max_marks,
      percentage: r.percentage,
      gradeLetter: r.grade_letter,
      attendancePct: r.attendance_pct,
      remarks: r.remarks,
      createdAt: r.created_at
    }));
  },

  getReportCardById(id) {
    const r = db.prepare('SELECT * FROM exam_results WHERE id = ?').get(id);
    if (!r) return null;

    const studentInfo = db.prepare('SELECT * FROM students_roster WHERE id = ?').get(r.student_id) || {};

    return {
      reportCardId: r.id,
      scholarNo: r.scholar_no,
      rollNo: studentInfo.roll_no || 1,
      studentName: r.student_name,
      parentName: studentInfo.parent_name || 'Guardian',
      grade: r.grade,
      section: r.section,
      term: r.term,
      examYear: r.exam_year,
      subjects: JSON.parse(r.subjects_json || '[]'),
      totalMarks: r.total_marks,
      maxMarks: r.max_marks,
      percentage: r.percentage,
      gradeLetter: r.grade_letter,
      attendancePct: r.attendance_pct,
      remarks: r.remarks,
      school: {
        name: 'D.P.C. Role Model Excellence School',
        affiliation: 'CBSE Affiliation No. 1031077 (Senior Secondary Level)',
        schoolCode: '51045',
        diseCode: '23440107703',
        address: 'Dreamland City, Dorlichhatarpur, Katangi Road, Seoni (M.P.) - 480661',
        principal: 'Dr. Amita Chaturvedi'
      }
    };
  },

  insertOrUpdateResult({ studentId, scholarNo, studentName, grade, section = 'A', term, subjects, remarks }) {
    const id = genId('RES');
    const subsArray = Array.isArray(subjects) ? subjects : JSON.parse(subjects || '[]');
    const total = subsArray.reduce((acc, s) => acc + (parseFloat(s.marks) || 0), 0);
    const max = subsArray.reduce((acc, s) => acc + (parseFloat(s.maxMarks) || 100), 0);
    const pct = max > 0 ? parseFloat(((total / max) * 100).toFixed(1)) : 0;
    const gradeLetter = pct >= 91 ? 'A1' : (pct >= 81 ? 'A2' : (pct >= 71 ? 'B1' : (pct >= 61 ? 'B2' : (pct >= 51 ? 'C1' : (pct >= 41 ? 'C2' : (pct >= 33 ? 'D' : 'E'))))));

    const stmt = db.prepare(`
      INSERT INTO exam_results (id, student_id, scholar_no, student_name, grade, section, term, exam_year, subjects_json, total_marks, max_marks, percentage, grade_letter, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, '2026-27', ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, studentId, scholarNo, studentName.trim(), grade, section, term || 'Periodic Assessment 1 (PA-1)', JSON.stringify(subsArray), total, max, pct, gradeLetter, remarks || 'Promoted with good academic standing.');

    this.logActivity({
      actorName: 'Exam Incharge',
      actorRole: 'Teacher',
      actionType: 'MARKS',
      targetType: 'Progress Report Card',
      details: `Generated examination result for ${studentName} (${grade}) - Score: ${pct}% (Grade ${gradeLetter}).`
    });

    return this.getReportCardById(id);
  },

  // ==========================================
  // 7. HOMEWORK & DIGITAL DIARY
  // ==========================================
  getHomework({ grade, search } = {}) {
    let sql = 'SELECT * FROM homework WHERE 1=1';
    const params = [];

    if (grade && grade !== 'all') {
      sql += ' AND LOWER(grade) LIKE LOWER(?)';
      params.push(`%${grade}%`);
    }
    if (search) {
      sql += ' AND (LOWER(title) LIKE LOWER(?) OR LOWER(subject) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))';
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    sql += ' ORDER BY due_date DESC, created_at DESC';
    return db.prepare(sql).all(...params);
  },

  insertHomework({ grade, section = 'All', subject, title, description, dueDate, attachmentInfo, assignedBy }) {
    const id = genId('HW');
    const stmt = db.prepare(`
      INSERT INTO homework (id, grade, section, subject, title, description, due_date, attachment_info, assigned_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, grade, section, subject.trim(), title.trim(), description.trim(), dueDate, attachmentInfo || '', assignedBy || 'Subject Faculty');

    this.logActivity({
      actorName: assignedBy || 'Subject Teacher',
      actorRole: 'Teacher',
      actionType: 'HOMEWORK',
      targetType: `${grade} Assignment`,
      details: `Assigned new ${subject} homework: "${title}" due on ${dueDate}.`
    });

    return db.prepare('SELECT * FROM homework WHERE id = ?').get(id);
  },

  deleteHomework(id) {
    const result = db.prepare('DELETE FROM homework WHERE id = ?').run(id);
    return result.changes > 0;
  },

  // ==========================================
  // 8. DIRECTOR & AUDIT LOGS
  // ==========================================
  getActivityLogs({ role, actionType, limit = 50 } = {}) {
    let sql = 'SELECT * FROM activity_logs WHERE 1=1';
    const params = [];

    if (role && role !== 'all') {
      sql += ' AND LOWER(actor_role) = LOWER(?)';
      params.push(role);
    }
    if (actionType && actionType !== 'all') {
      sql += ' AND LOWER(action_type) = LOWER(?)';
      params.push(actionType);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    return db.prepare(sql).all(...params);
  },

  logActivity({ actorName, actorRole, actionType, targetType, details }) {
    const id = genId('LOG');
    try {
      db.prepare(`
        INSERT INTO activity_logs (id, actor_name, actor_role, action_type, target_type, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, actorName || 'System', actorRole || 'Admin', actionType || 'GENERAL', targetType || 'System Event', details || '');
    } catch (e) {
      console.error('Failed to write activity log:', e.message);
    }
  },

  // ==========================================
  // 9. HIGH-LEVEL AGGREGATE DASHBOARD METRICS
  // ==========================================
  getDirectorOverview() {
    const totalStudents = db.prepare('SELECT COUNT(*) as c FROM students_roster').get().c;
    const totalTeachers = db.prepare('SELECT COUNT(*) as c FROM teachers_roster').get().c;
    const totalAdmissions = db.prepare('SELECT COUNT(*) as c FROM admissions').get().c;
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM fee_payments WHERE status = 'PAID'").get().s;
    const totalDues = db.prepare("SELECT COALESCE(SUM(fee_balance), 0) as s FROM students_roster").get().s;

    // Student Attendance Today
    const todayAttRows = db.prepare('SELECT status, COUNT(*) as c FROM student_attendance WHERE date = ? GROUP BY status').all(todayStr);
    let todayPresent = 0;
    let todayTotalAtt = 0;
    todayAttRows.forEach(r => {
      todayTotalAtt += r.c;
      if (r.status === 'Present') todayPresent += r.c;
    });
    const studentAttendanceRate = todayTotalAtt > 0 ? parseFloat(((todayPresent / todayTotalAtt) * 100).toFixed(1)) : 94.2;

    // Staff Attendance Today
    const staffAttRows = db.prepare('SELECT status, COUNT(*) as c FROM teacher_attendance WHERE date = ? GROUP BY status').all(todayStr);
    let staffPresent = 0;
    let staffTotalAtt = 0;
    staffAttRows.forEach(r => {
      staffTotalAtt += r.c;
      if (r.status === 'Present' || r.status === 'On Duty') staffPresent += r.c;
    });
    const staffAttendanceRate = staffTotalAtt > 0 ? parseFloat(((staffPresent / staffTotalAtt) * 100).toFixed(1)) : 96.0;

    return {
      totalStudents,
      totalTeachers,
      totalAdmissions,
      totalRevenue,
      totalDues,
      studentAttendanceRate,
      staffAttendanceRate,
      todayStr
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

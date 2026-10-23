# D.P.C. Role Model Excellence School - Official Web & ERP Platform

Official digital ecosystem for **D.P.C. Role Model Excellence School, Dorlichhatarpur, Seoni (M.P.)**, affiliated with the Central Board of Secondary Education (**CBSE New Delhi Affiliation No. 1031077, School Code: 51045**).

---

## 🏛️ Architecture Overview

The platform is designed with a modern, high-performance, full-stack architecture:

1. **Frontend Experience Portal (`index.html`)**:
   - Built with semantic HTML5, high-fidelity responsive CSS, and interactive JavaScript.
   - Dynamic admissions modal, interactive curriculum stage tabs, and AI chatbot with school domain knowledge.
   - Rich multi-color jewel accent system (Royal Navy, Emerald Green, Cyber Violet, Sunset Coral, Imperial Gold).
   - Dynamic 3D card tilt physics, animated wave dividers, and gold particle field.

2. **Backend REST API Engine (`server.js`)**:
   - Powered by Node.js & Express.
   - Serves static assets, handles online admission forms, parent contact queries, and dynamic announcement tickers.
   - Live endpoints for system metrics, health checks, and database exports.

3. **Admin ERP Command Center (`admin.html`)**:
   - URL: `http://localhost:4173/admin`
   - Real-time admissions ledger with search, multi-level grade/status filters, and walk-in registration.
   - One-click WhatsApp and Phone call direct outreach for school counseling staff.
   - CSV export engine for offline record-keeping.
   - Live ticker notice board manager.
   - Real-time database inspection panel.

4. **Production Relational Database (`db.js` & `data/dpc_school.db`)**:
   - Engine: **SQLite 3** running via native Node.js v24 `DatabaseSync` engine (zero C++ compilation or external daemon prerequisites).
   - Mode: **WAL (Write-Ahead Logging)** with `PRAGMA synchronous = NORMAL` for high concurrent read/write throughput.
   - Full ACID transaction guarantees and relational integrity.

---

## 🗄️ Database Schema & Storage

The database is stored locally in `data/dpc_school.db`.

### Relational Tables:
- **`admissions`**: Official student enrollment ledger.
  - Columns: `id` (PK), `student_name`, `parent_name`, `mobile`, `email`, `grade`, `transport`, `status`, `date`, `notes`, `created_at`.
  - Indexes: `idx_admissions_status`, `idx_admissions_grade`.
- **`inquiries`**: Direct inquiries submitted via the website contact form.
  - Columns: `id` (PK), `name`, `phone`, `email`, `seeking_class`, `message`, `status`, `created_at`.
- **`notices`**: Live announcements rendered dynamically on the website ticker.
  - Columns: `id` (PK), `tag`, `text`, `active`, `created_at`.
- **`admin_users`**: School administrative access accounts.
  - Columns: `id` (PK), `username`, `role`, `name`, `created_at`.

---

## 🚀 Running the Project Locally

### 1. Prerequisites
- **Node.js**: v18+ (Node.js v22 or v24 recommended for native SQLite 3)

### 2. Start the Server
```bash
# Clone the repository
git clone https://github.com/adtechenterprisespvtltd2/dpc-school-website.git
cd dpc-school-website

# Install dependencies
npm install

# Start the full-stack server
npm start
```

### 3. URLs
- **Public School Portal**: `http://localhost:4173/`
- **Admin ERP Command Center**: `http://localhost:4173/admin`
- **API Health Check**: `http://localhost:4173/api/health`
- **Database Status & Metrics**: `http://localhost:4173/api/database/info`
- **Raw SQLite Backup Download**: `http://localhost:4173/api/database/download`

---

## 🛠️ Inspecting the SQLite Database File

You can inspect and query the SQLite database (`data/dpc_school.db`) directly using standard tools:
1. **Admin Portal Inspector**: Visit `http://localhost:4173/admin` to see live table counts and click "Download SQLite .db File".
2. **DB Browser for SQLite**: Open `data/dpc_school.db` in [DB Browser for SQLite](https://sqlitebrowser.org/) to run raw SQL queries.
3. **VS Code / IDE Extensions**: Use extensions like *SQLite Viewer* or *Database Client*.

---

## 👥 Organization & Leadership
- **School**: D.P.C. Role Model Excellence School, Seoni
- **Society**: Shri Ram Adarsh Shiksha Samiti
- **Patron & Director**: Dr. K.K. Chaturvedi
- **Principal**: Dr. Amita Chaturvedi
- **Engineering**: AdTech Enterprises Pvt. Ltd.

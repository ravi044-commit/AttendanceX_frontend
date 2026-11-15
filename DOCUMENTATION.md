# AttendanceX — Complete System Documentation

---

## 1. Executive Summary & Project Overview

**AttendanceX** is an enterprise-grade, institutional attendance management and monitoring platform designed for engineering and polytechnic colleges. Built as a high-performance web system, AttendanceX streamlines roll calls for theory lectures and laboratory sessions, enforces strict Role-Based Access Control (RBAC), calculates weighted semester attendance metrics, detects defaulters (<75%), and features cryptographically secure OTP email workflows.

---

## 2. Core Languages & Technology Stack

### A. Programming Languages
* **Frontend:** **JavaScript** (ES6+ / JSX), **HTML5**, **CSS3**
* **Backend:** **JavaScript** (ES6+ Modules), **Node.js**
* **Database & Persistence:** **SQL** (executed on SQLite3)

### B. Frameworks & Core Libraries
| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend UI** | **React 18** | Single Page Application (SPA) component architecture |
| **Frontend Styling** | **Tailwind CSS 3** | Utility-first responsive design & dark/light theme |
| **Bundler & Tooling** | **Vite 5** | Lightning-fast HMR and production bundle optimization |
| **Icons** | **Lucide React** | Consistent iconography throughout dashboards |
| **Backend Framework** | **Express.js 4** | RESTful routing, middleware, and request handling |
| **Database Engine** | **SQLite3** | Embedded serverless SQL engine running in Write-Ahead Logging (WAL) mode |
| **Security & Auth** | **JWT & Bcrypt.js** | Stateless JSON Web Token authentication & salted password hashing |
| **Email Delivery** | **SMTP / Brevo / Resend** | Multi-transport transactional email service for OTP codes |

---

## 3. System Architecture & High-Level Design

```
+-----------------------------------------------------------------+
|                         CLIENT (BROWSER)                        |
|   React 18 + Vite + Tailwind CSS (Responsive Desktop / Mobile)   |
+-------------------------------+---------------------------------+
                                |
                   HTTPS / JSON REST API calls
                                |
+-------------------------------v---------------------------------+
|                         EXPRESS SERVER                          |
|  - Rate Limiting & Gzip Compression Middleware                  |
|  - JWT Authentication & RBAC Privilege Enforcement             |
|  - In-Memory Cache (TTL: 60s for static lists/classes)          |
|  - OTP & SMTP Cryptographic Verification Service                |
+-------------------------------+---------------------------------+
                                |
                     Direct SQLite3 WAL Engine
                                |
+-------------------------------v---------------------------------+
|                 attendancex.db (SQLite3 Database)               |
|   users | students | classes | attendance_records | otps        |
+-----------------------------------------------------------------+
```

---

## 4. Database Schema & Data Models

The system runs on `attendancex.db` configured with `PRAGMA journal_mode = WAL` and `PRAGMA foreign_keys = ON`.

### 1. `users` Table
Stores authenticated credentials and profile details.
* `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
* `uid`: `TEXT UNIQUE NOT NULL` (e.g., ADM001, FAC001, 246250307001)
* `name`: `TEXT NOT NULL`
* `email`: `TEXT UNIQUE NOT NULL`
* `password`: `TEXT NOT NULL` (Bcrypt hash)
* `role`: `TEXT NOT NULL CHECK(role IN ('admin', 'hod', 'faculty', 'student'))`
* `department`: `TEXT DEFAULT 'Computer Department'`
* `phone`: `TEXT`
* `avatar`: `TEXT`
* `google_id`: `TEXT UNIQUE`
* `google_email`: `TEXT`
* `created_at`: `DATETIME DEFAULT CURRENT_TIMESTAMP`

### 2. `students` Table
Tracks student academic details and rolling aggregate attendance counters.
* `uid`: `TEXT PRIMARY KEY`
* `user_id`: `INTEGER FOREIGN KEY -> users(id)`
* `name`: `TEXT NOT NULL`
* `enrolment_number`: `TEXT UNIQUE NOT NULL`
* `student_photo`: `TEXT`
* `department`: `TEXT DEFAULT 'Computer Department'`
* `semester`: `INTEGER DEFAULT 6`
* `division`: `TEXT DEFAULT 'A'`
* `status`: `TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Detained'))`
* `total_classes_present`: `INTEGER DEFAULT 0`
* `total_classes_conducted`: `INTEGER DEFAULT 0`
* `percentage`: `REAL DEFAULT 0.0`
* `weighted_percentage`: `REAL DEFAULT 0.0`
* `lecture_present`: `INTEGER DEFAULT 0`
* `lecture_total`: `INTEGER DEFAULT 0`
* `lab_present`: `INTEGER DEFAULT 0`
* `lab_total`: `INTEGER DEFAULT 0`
* `created_at`: `DATETIME DEFAULT CURRENT_TIMESTAMP`

### 3. `classes` Table
Represents registered academic curriculum subjects and lab divisions.
* `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
* `subject_code`: `TEXT NOT NULL`
* `subject_name`: `TEXT NOT NULL`
* `department`: `TEXT DEFAULT 'Computer Department'`
* `faculty_name`: `TEXT NOT NULL`
* `faculty_email`: `TEXT NOT NULL`
* `type`: `TEXT CHECK(type IN ('Lecture', 'Lab'))`
* `semester`: `INTEGER DEFAULT 6`
* `room`: `TEXT`
* `time_slot`: `TEXT`

### 4. `attendance_records` Table
Granular historical ledger entry for every roll call taken by a faculty member.
* `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
* `student_uid`: `TEXT NOT NULL`
* `subject_code`: `TEXT NOT NULL`
* `subject_name`: `TEXT NOT NULL`
* `faculty_name`: `TEXT NOT NULL`
* `faculty_id`: `TEXT`
* `date`: `TEXT NOT NULL` (YYYY-MM-DD)
* `time_slot`: `TEXT`
* `type`: `TEXT CHECK(type IN ('Lecture', 'Lab'))`
* `status`: `TEXT CHECK(status IN ('Present', 'Absent'))`
* `remarks`: `TEXT`
* `created_at`: `DATETIME DEFAULT CURRENT_TIMESTAMP`
* `FOREIGN KEY(student_uid) REFERENCES students(uid)`

### 5. `otp_verifications` Table
Handles cryptographic one-time passwords with salt & hashes.
* `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
* `email`: `TEXT NOT NULL`
* `otp_hash`: `TEXT NOT NULL` (SHA-256 hashed)
* `salt`: `TEXT NOT NULL`
* `purpose`: `TEXT NOT NULL CHECK(purpose IN ('password_recovery', 'email_change', 'account_setup'))`
* `expires_at`: `DATETIME NOT NULL`
* `attempts`: `INTEGER DEFAULT 0`
* `is_verified`: `INTEGER DEFAULT 0`
* `created_at`: `DATETIME DEFAULT CURRENT_TIMESTAMP`

---

## 5. Attendance Formulas & Calculations

### A. Raw Attendance Percentage
$$\text{Percentage} = \left(\frac{\text{Present Classes}}{\text{Total Classes Conducted}}\right) \times 100$$
*(Capped at institutional maximum of 95.00% to account for mandatory leaves).*

### B. Semester Weighted Score
$$\text{Semester Weighted Score} = 30\% \times \left(\text{Present Ratio}\right) \times 182.5$$
* Measures student contribution towards cumulative semester internal marks.

### C. Defaulter Identification
* **Defaulter Threshold:** `< 75.00%`
* Automatically highlighted in Red on Admin and HOD dashboards with immediate filtering capability.

### D. Practical Lab Batch Partitioning
Students are split automatically by enrollment number and UID:
* **Batch A:** UID 1 through 63
* **Batch B:** UID 64 and above

---

## 6. Software Requirements Specification (SRS) & User Characteristics

### 6.1 User Characteristics
Four distinct types of end users interact with the system. None of them requires technical knowledge beyond using a modern web browser.

#### Table 2.1: Types of Users
| User | Description | Technical Skill |
| :--- | :--- | :--- |
| **Administrator** | Manages classes, subjects, faculty and student accounts; provisions credentials; views all departmental & institutional reports. | Basic computer knowledge |
| **Head of Department (HOD)** | Oversees department-wide attendance, locks/freezes daily attendance to prevent tampering, tracks faculty delivery, and exports defaulter reports. | Basic computer knowledge |
| **Faculty** | Marks and edits attendance of own assigned subjects/labs; manages batch roll calls; views session logs and reports of own classes. | Basic computer knowledge |
| **Student** | Views personal attendance, subject-wise percentage, theory vs. lab ratios, inspects session records, and downloads own reports. | Can use a web browser |

---

### 6.2 Core System Use Cases (9 Essential Workflows)

The entire AttendanceX system is mapped into **9 standardized use cases** organized in a single unified sequence:

#### Table 2.2: Use Case to Actor Traceability Matrix
| # | Use Case | Administrator | Head of Department (HOD) | Faculty | Student | Description |
| :-: | :--- | :-: | :-: | :-: | :-: | :--- |
| **1** | **Login / Logout** | ✔ | ✔ | ✔ | — | Secure authentication with UID/Email, Bcrypt password, or Google OAuth. |
| **2** | **Manage Users** | ✔ | ✔ | — | — | Create, edit, and deactivate Student, Faculty, and HOD accounts. |
| **3** | **Manage Classes & Subjects** | ✔ | ✔ | — | — | Configure subjects, course codes, timetable slots, and faculty assignments. |
| **4** | **Mark Attendance** | — | — | ✔ | — | Conduct lecture and lab roll calls with batch filtering (Batch A & B). |
| **5** | **Edit Attendance** | ✔ | ✔ | ✔ | — | Update recorded attendance prior to daily date freeze/lock. |
| **6** | **View Class Report** | ✔ | ✔ | ✔ | — | Inspect class-wide attendance sheets, session rosters, and faculty delivery. |
| **7** | **View My Attendance** | — | — | — | ✔ | Real-time circular percentage gauge, subject breakdown, and timeline. |
| **8** | **Download Report** | ✔ | ✔ | — | — | Export attendance ledgers and defaulter sheets as CSV/Excel. |
| **9** | **Low Attendance Alert** | — | ✔ | ✔ | ✔ | Automated detection and visual alert for attendance below the 75% threshold. |

---

### 6.3 Five Core Use Case & Test Descriptions

#### Use Case 1: User Login
* **Actor:** Administrator, HOD, Faculty
* **Main Action:**
  1. User enters UID/Email and Password.
  2. System validates credentials with database.
  3. User is redirected to designated role dashboard.
* **Expected Test Result:** Successful authentication and dashboard loads.

#### Use Case 2: Manage Users
* **Actor:** Administrator, HOD
* **Main Action:**
  1. Admin enters new user or student details.
  2. Form is submitted.
  3. System saves record to database.
* **Expected Test Result:** New profile is created and appears in the directory.

#### Use Case 3: Mark Attendance
* **Actor:** Faculty
* **Main Action:**
  1. Faculty selects subject and Lecture/Lab batch.
  2. Clicks "Mark All Present" and marks absentees.
  3. Submits attendance to system.
* **Expected Test Result:** Attendance records saved and student percentage updates immediately.

#### Use Case 4: View My Attendance
* **Actor:** Student
* **Main Action:**
  1. Student opens attendance dashboard.
  2. System loads subject-wise and overall records.
  3. Circular attendance percentage gauge renders.
* **Expected Test Result:** Attendance percentage and session history display correctly.

#### Use Case 5: Low Attendance Alert & Download Report
* **Actor:** Administrator, HOD, Student
* **Main Action:**
  1. System checks if attendance is below 75%.
  2. Defaulter alert badge displays in red.
  3. Admin or HOD downloads defaulter report as CSV.
* **Expected Test Result:** Red alert shows for <75% attendance and report downloads.

---

### 6.4 Functional Requirements (FR)

The functional requirements directly represent the operational features of the live AttendanceX application:

#### A. Administrator Module
* **FR-ADM-01 (User Lifecycle Management):** The system shall allow administrators to create, read, update, and deactivate accounts for Students, Faculty, and HODs with validated UID, email, phone, and role attributes.
* **FR-ADM-02 (Student Registry & Status Control):** The system shall maintain student academic metadata including Enrollment Number, Department, Semester, Division, Batch, and Status (`Active` or `Detained`).
* **FR-ADM-03 (Institutional Metrics & Defaulter Dashboard):** The system shall calculate and display aggregate institutional statistics, including total students, classes held, departmental average attendance, and automatically flag students with attendance `< 75%` as defaulters.
* **FR-ADM-04 (Biometric & Face Enrollment):** The system shall provide an interface for administrators to preview student profiles and initiate face/biometric enrollment modal states.
* **FR-ADM-05 (Paginated Infinite Directory):** The system shall support real-time debounced search by name, UID, or enrollment number with infinite scrolling for low-latency browsing of large student cohorts.

#### B. Head of Department (HOD) Module
* **FR-HOD-01 (Departmental Executive Analytics):** The system shall provide the HOD with high-level department metrics, including overall departmental attendance percentage, total registered students, active faculty count, total sessions held, and defaulter tallies.
* **FR-HOD-02 (Daily Freeze & Session Locking):** The system shall enable the HOD to freeze daily attendance records (`is_frozen = true`), locking past sessions to prevent unauthorized post-session edits by faculty, with quick-freeze actions for pending dates.
* **FR-HOD-03 (Faculty Delivery & Subject Oversight):** The system shall display delivery metrics for each faculty member, including assigned subjects, lectures conducted, lab sessions held, and session completion rates.
* **FR-HOD-04 (Defaulter Management & Export):** The system shall isolate all students falling below the mandatory 75% attendance threshold and allow the HOD to download/export comprehensive departmental defaulter sheets.
* **FR-HOD-05 (Sealed Session Audit & Inspection):** The system shall allow the HOD to open any active or sealed session roster to audit student attendance by batch, status (Present/Absent), and subject.
* **FR-HOD-06 (Biometric & Identity Oversight):** The system shall permit the HOD to inspect student identity cards and launch face/biometric enrollment workflows.

#### C. Faculty Module
* **FR-FAC-01 (Subject & Session Selection):** The system shall permit faculty to select their assigned subjects and choose between Lecture (Theory) and Lab (Practical) session modes.
* **FR-FAC-02 (Batch-Aware Practical Roster):** During Practical sessions, the system shall automatically partition students into **Batch A** (UID 1–63) and **Batch B** (UID 64+) according to lab capacity.
* **FR-FAC-03 (Rapid Roll Call Controls):** The system shall provide a 1-click **"Mark All Present"** toggle alongside individual toggle switches (Present in Green / Absent in Red) and display live present/absent counts.
* **FR-FAC-04 (Atomic Persistence & Cumulative Calculation):** Submitting a roll call shall atomically write to `attendance_records` and immediately recalculate the cumulative percentages and semester weighted scores for all affected students.
* **FR-FAC-05 (Session Locking & Freeze Protection):** The system shall verify `getAttendanceLockStatus` for any given date and block edits if the date is frozen by institutional policy.
* **FR-FAC-06 (Historical Session Inspection):** The system shall allow faculty to browse past session archives, inspect student-by-student attendance status for previous dates, and filter by status.

#### D. Student Module
* **FR-STU-01 (Personal Academic Profile):** The system shall render student profile details including student photo/avatar, institutional UID, enrollment number, semester, division, and assigned lab batch.
* **FR-STU-02 (Visual Attendance Dial & Defaulter Warning):** The system shall display the student's overall attendance on a dynamic circular progress gauge, with clear color-coded indicators (Emerald green for safe $\ge 75\%$, Rose red for defaulter warning $< 75\%$).
* **FR-STU-03 (Subject-Wise & Component Breakdown):** The system shall present detailed subject cards showing conducted vs. attended counts, distinct Theory vs. Practical lab percentages, and semester weighted scores.
* **FR-STU-04 (Chronological Attendance Timeline):** The system shall offer an infinite-scroll historical attendance ledger displaying dates, time slots, subject codes, session types, and faculty remarks.
* **FR-STU-05 (Session Peer Roster Transparency):** The system shall allow students to open a session inspection modal to verify recorded attendance rosters for transparency.
* **FR-STU-06 (Self-Service Credential & Security Management):** Students shall be able to update passwords and review account security status via email-based OTP verification.

#### E. Core Authentication & Security Module
* **FR-AUTH-01 (Multi-Credential Login):** The system shall authenticate users via either Institutional UID or Email address with Bcrypt salted password verification.
* **FR-AUTH-02 (Single Sign-On):** The system shall support Google OAuth2 federated authentication for verified institutional Google accounts.
* **FR-AUTH-03 (Cryptographic Salted OTP Reset):** The system shall generate 6-digit random OTPs hashed with cryptographic salt (SHA-256) with a 5-minute time-to-live (TTL), 60-second resend cooldown, and a 5-attempt brute-force lockout.
* **FR-AUTH-04 (Role-Based Access Control):** The system shall enforce JSON Web Token (JWT) bearer authorization on every API endpoint, strictly preventing privilege escalation between roles.

---

### 6.3 Non-Functional Requirements (NFR)

#### A. Performance & Efficiency
* **NFR-PERF-01 (Response Latency):** Core API endpoints (login, roster retrieval, attendance marking) shall respond within `< 200 ms` under standard campus network load.
* **NFR-PERF-02 (Database Concurrency):** SQLite3 shall operate in Write-Ahead Logging (`WAL`) mode with `PRAGMA synchronous = NORMAL`, allowing concurrent non-blocking reads while attendance writes occur.
* **NFR-PERF-03 (In-Memory Caching):** Static course registries and class metadata shall utilize a server-side in-memory cache with a 60-second TTL to eliminate redundant SQL reads.
* **NFR-PERF-04 (Bundle Optimization):** The client application shall be compiled with Vite code-splitting and asset minification, maintaining an initial download bundle `< 250 KB` gzipped.

#### B. Security & Integrity
* **NFR-SEC-01 (Password Encryption):** All passwords shall be salted and hashed using Bcrypt with a work factor of 10; plain-text passwords shall never be persisted or logged.
* **NFR-SEC-02 (Zero Raw OTP Storage):** OTP codes shall never be stored in plain text; only SHA-256 salted hashes shall be held in the database.
* **NFR-SEC-03 (Rate Limiting & Abuse Prevention):** The authentication API shall enforce rate limiting to prevent brute-force credential stuffing and denial-of-service attacks.
* **NFR-SEC-04 (Relational Integrity):** All relational links (e.g., student UID foreign keys on `attendance_records`) shall enforce database-level cascade constraints (`PRAGMA foreign_keys = ON`).

#### C. Usability & User Experience
* **NFR-USE-01 (Zero-Training Usability):** The interface shall be intuitive, adhering to modern UI conventions with self-explanatory iconography (Lucide React) so that users require no manual or technical training.
* **NFR-USE-02 (Responsive & Device Agnostic):** The UI shall adapt seamlessly to mobile smartphones, tablets, laptops, and desktop screens using a fluid Tailwind CSS grid system.
* **NFR-USE-03 (Skeleton Loading & Perceptual Speed):** All data-fetching views shall display animated skeleton placeholders to provide visual feedback and prevent layout shifting.
* **NFR-USE-04 (High-Contrast Defaulter Cues):** Visual status indicators shall use high-contrast color schemes (Emerald-500 for good standing, Rose-500 for `< 75%` defaulter alert) for immediate readability.

#### D. Reliability & Availability
* **NFR-REL-01 (System Availability):** The system shall achieve `99.5%` operational uptime during academic semesters.
* **NFR-REL-02 (Cold-Start & Wakeup Resilience):** When deployed on sleeping or serverless instances, the client shall present an automatic `DatabaseWakeupNotice` after 2 seconds to gracefully handle spin-up delays.
* **NFR-REL-03 (ACID Transactional Guarantees):** Roll call submissions containing multiple student attendance records shall execute in atomic transactions, ensuring zero partial saves during network drops.

#### E. Portability & Hardware Constraints
* **NFR-PORT-01 (Low-Resource Device Deployment):** The complete backend service and SQLite database shall be capable of operating on low-power single-board computers (such as a **Raspberry Pi with 1 GB RAM and 8 GB MicroSD storage**), maintaining an idle memory footprint `< 60 MB`.
* **NFR-PORT-02 (Cross-Browser Compatibility):** The client web app shall function identically on modern Chromium-based browsers (Google Chrome, Microsoft Edge, Brave), Mozilla Firefox, and Apple Safari without requiring external browser extensions.

---

## 7. Security & OTP Email Verification

* **Cryptographic Generation:** 6-digit random codes generated via `crypto.randomInt(100000, 999999)`.
* **Zero Raw Storage:** Codes are salted and stored exclusively as SHA-256 hashes.
* **5-Minute Expiry:** Codes strictly expire after 300 seconds.
* **Brute-Force Lockout:** Maximum 5 verification attempts before permanent OTP invalidation.
* **Cooldown Throttle:** 60-second wait between successive resend requests.
* **Short-Lived Reset Tokens:** 15-minute cryptographically signed authorization token granted upon successful OTP verification for password change.

---

## 8. REST API Reference

### Authentication & Account
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate user with Email/UID and Password |
| `POST` | `/api/auth/google` | Public | Verify Google OAuth2 token and log in |
| `POST` | `/api/auth/request-otp` | Public | Request salted OTP code for password recovery |
| `POST` | `/api/auth/verify-otp` | Public | Verify OTP code and receive 15-min reset authorization |
| `POST` | `/api/auth/reset-password` | Public | Reset password using valid reset authorization token |

### Students & Profiles
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/students` | Authenticated | List all students with pagination and search |
| `GET` | `/api/students/:uid` | Authenticated | Fetch full profile and records for specific student |
| `POST` | `/api/students` | Admin | Register a new student into the department |
| `PUT` | `/api/students/:uid` | Admin | Update student information |
| `DELETE` | `/api/students/:uid` | Admin | Delete a student profile |

### Attendance Marking
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/attendance/summary` | Admin, HOD | Department aggregate metrics |
| `GET` | `/api/attendance/student/:uid`| Authenticated | Get student historical attendance records |
| `POST` | `/api/attendance/mark` | Faculty, Admin | Submit roll call record for a lecture/lab |
| `GET` | `/api/attendance/defaulters` | Admin, HOD | Fetch list of students with attendance < 75% |

### System Health
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Returns database connection, uptime, and system status |

---

## 9. Installation & Deployment Guide

### A. Local Development Setup

1. **Clone & Install Dependencies:**
   ```bash
   # Root & Server dependencies
   npm install

   # Client dependencies
   cd client
   npm install
   cd ..
   ```

2. **Configure Environment Variables:**
   Create `.env` in `server/` with:
   ```env
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key_here
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```

3. **Start the Application:**
   * Backend Server:
     ```bash
     cd server
     npm start
     ```
   * Frontend Client:
     ```bash
     cd client
     npm run dev
     ```

---

### B. Deployment on Low-Power Devices (Raspberry Pi 1 GB RAM / 8 GB SD)

1. **Use Raspberry Pi OS Lite (Headless):**
   - Keeps idle RAM usage below 60 MB.
2. **Pre-build Frontend on PC:**
   ```bash
   cd client
   npm run build
   ```
   Copy the `client/dist` directory directly onto the Raspberry Pi.
3. **Run Production Server:**
   Configure Express to serve `client/dist` as static assets:
   ```javascript
   app.use(express.static(path.join(__dirname, '../client/dist')));
   app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
   ```
4. **Auto-Start on Boot:**
   Use PM2 or a `systemd` unit file to keep the service running in the background.

---

## 10. Repository Directory Structure

```
AttendanceX/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── components/         # Dashboards, Navbar, Footers, Modals
│   │   ├── hooks/              # Custom React hooks (e.g. useInfiniteList)
│   │   ├── utils/              # API caller and formatting helpers
│   │   ├── App.jsx             # Main routing and portal state
│   │   └── main.jsx            # Entry point
│   ├── package.json
│   └── vite.config.js
├── server/                     # Backend API & Database
│   ├── attendancex.db          # SQLite3 database file (WAL mode)
│   ├── database.js             # SQLite initialization & helper queries
│   ├── emailService.js         # Transactional email dispatcher
│   ├── index.js                # Express application and REST routes
│   ├── otpService.js           # Salted cryptographic OTP logic
│   └── tests/                  # Automated test suites
├── DOCUMENTATION.md            # Comprehensive system documentation
├── package.json                # Root package configuration
└── README.md                   # Quickstart guide
```

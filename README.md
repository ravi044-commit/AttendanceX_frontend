# AttendanceX - Smart Semester Attendance Management System

A full-stack, responsive attendance management web application built with **React**, **Tailwind CSS**, **Node.js Express**, and **SQLite3**.

---

## 🌟 Key Features

### 1. Navigation & Authentication
- **Top Left Header**: Direct **Log In** action button for quick portal authentication.
- **Top Right Header**: Modern **AttendanceX** branding with semester version badge.
- **4 Dedicated Roles**: **Admin**, **Student**, **Faculty**, and **HOD** (Head of Department).
- **Admin-Only Registration**: Account creation / Sign Up is strictly reserved for **Admin**; Student, Faculty, and HOD accounts are managed and provisioned by the Department Administration.

### 2. SQLite3 Database Architecture
- **`users` Table**: Supports multi-role access control (`admin`, `hod`, `faculty`, `student`).
- **`students` Table**: Contains `uid`, `name`, `enrolment_number`, `student_photo`, `department`, `status`, `percentage`, `weighted_percentage`, lecture/lab metrics.
- **`classes` Table**: Computer Department theory courses and laboratory units.
- **`attendance_records` Table**: Granular log of every session marked (Subject, Lecture/Lab, Date, Status, Faculty Name).
- **Calculation Formula**:
  $$\text{Percentage} = \left(\frac{\text{Present Classes}}{\text{Total Classes}}\right) \times 100$$
  $$\text{Semester Weighted Score} = 30\% \times \text{Present Ratio} \times 182.5$$

### 3. Role-Specific Dashboards
- **Admin Dashboard**:
  - Filter and inspect Computer Department attendance statistics.
  - Add or remove users and students.
  - Filter by roles (Admin, Faculty, Student, HOD).
- **Faculty Dashboard**:
  - Roll call marker for **Theory Lectures** and **Practical Labs**.
  - Real-time **Present vs Absent** live counters.
  - 1-Click "Mark All Present" & custom toggles.
- **Student Dashboard**:
  - Student profile badge with photo, UID, and enrollment number.
  - Circular and linear attendance progress gauges.
  - Full attendance history logs with date, subject, type, and present/absent status.
- **HOD Dashboard**:
  - Computer Department analytics & class schedules.
  - Low Attendance Defaulters list (<75%) for administrative tracking.

### 4. Feature 6: Email OTP Verification & Security
- **Cryptographically Secure OTP Generation**: 6-digit random code generated via `crypto.randomInt()`.
- **Server-Side Hash Storage**: OTPs are salted and hashed with SHA-256; raw codes are never logged or stored.
- **5-Minute Expiration Period**: Codes expire automatically after 300 seconds.
- **Strict Purpose Isolation**: Separate purposes for `password_recovery`, `email_change`, and `account_setup`. Codes generated for one purpose cannot be used for another.
- **Rate Limiting & Lockout**: 60-second resend cooldown throttle, previous code invalidation, and maximum 5 verification attempts before permanent code lockout.
- **Single-Use Password Reset Authorization**: Verifying recovery OTP issues a short-lived 15-minute authorization token. Passwords can only be updated with a valid token, invalidated immediately on change.
- **Email Change Protection**: Old email remains unchanged until the new email is verified via OTP; notification alert dispatched to the old address.
- **Real SMTP Delivery**: Native RFC 5321 SMTP client supporting direct TLS (Port 465) and STARTTLS (Port 587) with HTML & text templates and strict delivery failure handling.


---

## 🛠️ How to Run

### Start Backend Server:
```bash
cd server
npm start
```
*Backend runs on `http://localhost:5000`*

### Start Frontend Client:
```bash
cd client
npm run dev
```
*Frontend runs on `http://localhost:5173`*

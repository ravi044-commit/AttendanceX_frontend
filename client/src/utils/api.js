const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  const cleanUrl = envUrl.replace(/\/$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const API_BASE = getApiBase();

const getAuthHeaders = () => {
  try {
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('attendancex_token') || localStorage.getItem('attendx_token'))
      : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

export const api = {
  // System Health
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch {
      return { status: 'offline' };
    }
  },

  // Authentication
  login: async (email, password, role) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to sign in');
    return data;
  },

  register: async (payload) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create account');
    return data;
  },

  // Students
  getStudents: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/students?${query}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  },

  getStudentByUid: async (uid) => {
    const res = await fetch(`${API_BASE}/students/${uid}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch student details');
    return res.json();
  },

  createStudent: async (studentData) => {
    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(studentData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create student');
    return data;
  },

  updateStudent: async (uid, updates) => {
    const res = await fetch(`${API_BASE}/students/${uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update student');
    return data;
  },

  deleteStudent: async (uid) => {
    const res = await fetch(`${API_BASE}/students/${uid}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete student');
    return data;
  },

  // Users (Admin user management)
  getUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/users?${query}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  createUser: async (userData) => {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add user');
    return data;
  },

  deleteUser: async (id) => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete user');
    return data;
  },

  // Classes & Attendance
  getClasses: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/classes?${query}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch classes');
    return res.json();
  },

  markAttendance: async (payload) => {
    const res = await fetch(`${API_BASE}/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit attendance');
    return data;
  },

  getAttendanceSummary: async (department = 'Computer Department') => {
    const res = await fetch(`${API_BASE}/attendance/summary?department=${encodeURIComponent(department)}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch attendance summary');
    return res.json();
  },

  getAttendanceSessions: async (department = 'Computer Department') => {
    const res = await fetch(`${API_BASE}/attendance/sessions-list?department=${encodeURIComponent(department)}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch attendance sessions');
    return res.json();
  },

  getAttendanceRecords: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/attendance/records?${query}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch attendance records');
    return res.json();
  },

  updateSingleAttendanceRecord: async (payload) => {
    const res = await fetch(`${API_BASE}/attendance/update-single`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update attendance status');
    return data;
  },

  getDepartmentStats: async (department = 'Computer Department') => {
    const res = await fetch(`${API_BASE}/department/stats?department=${encodeURIComponent(department)}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch department statistics');
    return res.json();
  },

  freezeAttendance: async (payload) => {
    const res = await fetch(`${API_BASE}/attendance/freeze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to freeze attendance session');
    return data;
  },

  getAttendanceLockStatus: async (date, department = 'Computer Department') => {
    const res = await fetch(`${API_BASE}/attendance/lock-status?date=${encodeURIComponent(date)}&department=${encodeURIComponent(department)}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch lock status');
    return res.json();
  },

  getAllAttendanceLocks: async (department = 'Computer Department') => {
    const res = await fetch(`${API_BASE}/attendance/all-locks?department=${encodeURIComponent(department)}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch attendance locks');
    return res.json();
  }
};

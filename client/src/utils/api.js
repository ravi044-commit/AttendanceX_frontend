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

// Cold start timeout configuration: Free-tier hosts (Render, Railway, Fly) take 30-50s to wake up.
// Default to 60s in production or allow overriding via VITE_API_TIMEOUT_MS.
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || (import.meta.env.PROD ? 60000 : 35000);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithTimeout = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS, maxRetries = 2) => {
  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        signal: options.signal || controller.signal,
      });
      clearTimeout(timer);

      if (res.status === 401 && typeof window !== 'undefined') {
        try {
          localStorage.removeItem('attendancex_user');
          localStorage.removeItem('attendancex_token');
          localStorage.removeItem('attendx_user');
          localStorage.removeItem('attendx_token');
          sessionStorage.clear();
          window.dispatchEvent(new CustomEvent('attendancex_unauthorized'));
        } catch {}
      }

      // If cloud hosting proxy returns 502/503/504 while waking up, retry with backoff
      if ([502, 503, 504].includes(res.status) && attempt < maxRetries) {
        attempt++;
        await sleep(2000 * attempt);
        continue;
      }

      return res;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;

      // If aborted due to timeout or failed to fetch (server cold start / waking up)
      if (
        (err.name === 'AbortError' || err.message?.includes('fetch') || err.message?.includes('network')) &&
        attempt < maxRetries
      ) {
        attempt++;
        await sleep(1500 * attempt);
        continue;
      }

      break;
    }
  }

  if (lastError && lastError.name === 'AbortError') {
    throw new Error('Database/Server request timed out. The backend service may still be waking up. Please retry in a few moments.');
  }

  throw lastError;
};

const parseResponse = async (res, defaultErrorMessage = 'Request failed') => {
  let text = '';
  try {
    text = await res.text();
  } catch (err) {
    if (!res.ok) throw new Error(defaultErrorMessage);
    return {};
  }

  // Detect HTML returned instead of JSON (common when VITE_API_URL is missing or routing to Vercel/Netlify index.html)
  const contentType = res.headers.get('content-type') || '';
  const isHtml =
    contentType.includes('text/html') ||
    text.trim().startsWith('<!DOCTYPE') ||
    text.trim().startsWith('<html');

  if (isHtml) {
    const isProduction =
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1';

    if (isProduction && (API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1'))) {
      throw new Error(
        'VITE_API_URL is configured to localhost in production. Please set VITE_API_URL in your hosting provider (Vercel/Netlify) to your live backend URL (e.g., https://your-server.onrender.com).'
      );
    }

    if (API_BASE === '/api' || API_BASE.endsWith('/api')) {
      throw new Error(
        'Backend server endpoint returned HTML instead of JSON. Ensure your live backend URL is configured as VITE_API_URL in your hosting provider environment variables.'
      );
    }

    throw new Error(
      'Server returned HTML instead of expected JSON data. The service may still be booting or restarting.'
    );
  }

  let data = null;
  if (text && text.trim()) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const errorMsg =
      (data && (data.error || data.message)) ||
      (text && text.length < 200 && !text.includes('<!DOCTYPE') ? text : null) ||
      defaultErrorMessage;
    throw new Error(errorMsg);
  }

  return data !== null ? data : {};
};

export const api = {
  // Silent background wake-up ping for cold-starting cloud backends
  warmupBackend: async () => {
    try {
      await fetch(`${API_BASE}/health`, { method: 'GET', mode: 'cors' });
      return true;
    } catch {
      return false;
    }
  },

  // System Health
  checkHealth: async () => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/health`, {}, 15000, 1);
      return await parseResponse(res, 'Health check failed');
    } catch {
      return { status: 'offline' };
    }
  },

  // Authentication
  login: async (email, password, role) => {
    const res = await fetchWithTimeout(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    return parseResponse(res, 'Failed to sign in');
  },

  register: async (payload) => {
    const res = await fetchWithTimeout(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    return parseResponse(res, 'Failed to create account');
  },

  // Google Identity Services (GIS) OAuth
  googleLogin: async (credential, role = null) => {
    const res = await fetchWithTimeout(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, role }),
    });
    return parseResponse(res, 'Google Sign-In failed');
  },

  linkGoogleAccount: async ({ linkToken, identifier, password }) => {
    const res = await fetchWithTimeout(`${API_BASE}/auth/google/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkToken, identifier, password }),
    });
    return parseResponse(res, 'Failed to link Google account');
  },

  unlinkGoogleAccount: async (password) => {
    const res = await fetchWithTimeout(`${API_BASE}/auth/google/unlink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ password }),
    });
    return parseResponse(res, 'Failed to unlink Google account');
  },

  getGoogleStatus: async () => {
    const res = await fetchWithTimeout(`${API_BASE}/auth/google/status`, {
      headers: { ...getAuthHeaders() },
    });
    return parseResponse(res, 'Failed to fetch Google link status');
  },

  // Feature 6: Email OTP Verification & Account Security
  sendOtp: async (email, purpose, currentEmailOrUser = null) => {
    let currentEmail = null;
    let uid = null;
    if (typeof currentEmailOrUser === 'string') {
      currentEmail = currentEmailOrUser;
    } else if (currentEmailOrUser && typeof currentEmailOrUser === 'object') {
      currentEmail = currentEmailOrUser.email;
      uid = currentEmailOrUser.uid;
    }
    const res = await fetchWithTimeout(`${API_BASE}/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ email, purpose, currentEmail, uid }),
    });
    return parseResponse(res, 'Failed to send verification code');
  },

  verifyOtp: async (email, otp, purpose) => {
    const res = await fetchWithTimeout(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ email, otp, purpose }),
    });
    return parseResponse(res, 'Invalid or expired verification code');
  },

  resetPassword: async (resetAuthorization, newPassword) => {
    const res = await fetchWithTimeout(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetAuthorization, newPassword }),
    });
    return parseResponse(res, 'Failed to reset password');
  },

  verifyEmailChange: async (newEmail, otp, currentEmailOrUser = null) => {
    let currentEmail = null;
    let uid = null;
    if (typeof currentEmailOrUser === 'string') {
      currentEmail = currentEmailOrUser;
    } else if (currentEmailOrUser && typeof currentEmailOrUser === 'object') {
      currentEmail = currentEmailOrUser.email;
      uid = currentEmailOrUser.uid;
    }
    const res = await fetchWithTimeout(`${API_BASE}/auth/otp/verify-email-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ newEmail, otp, currentEmail, uid }),
    });
    return parseResponse(res, 'Failed to verify and update email');
  },

  verifyAccountSetup: async (email, otp, password) => {
    const res = await fetchWithTimeout(`${API_BASE}/auth/otp/verify-account-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, password }),
    });
    return parseResponse(res, 'Failed to complete account setup');
  },

  getMe: async () => {
    const res = await fetchWithTimeout(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeaders() }
    });
    return parseResponse(res, 'Failed to fetch current user profile');
  },

  // Students
  getStudents: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetchWithTimeout(`${API_BASE}/students?${query}`, {
      headers: { ...getAuthHeaders() }
    });
    const data = await parseResponse(res, 'Failed to fetch students');
    if (data && typeof data === 'object' && Array.isArray(data.items)) {
      return data;
    }
    return Array.isArray(data) ? data : [];
  },

  getStudentAttendanceHistory: async (uid, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetchWithTimeout(`${API_BASE}/students/${uid}/attendance-history?${query}`, {
      headers: { ...getAuthHeaders() }
    });
    const data = await parseResponse(res, 'Failed to fetch attendance history');
    if (data && typeof data === 'object' && Array.isArray(data.items)) {
      return data;
    }
    return Array.isArray(data) ? data : [];
  },

  getStudentByUid: async (uid) => {
    const res = await fetchWithTimeout(`${API_BASE}/students/${uid}`, {
      headers: { ...getAuthHeaders() }
    });
    return parseResponse(res, 'Failed to fetch student details');
  },

  createStudent: async (studentData) => {
    const res = await fetchWithTimeout(`${API_BASE}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(studentData),
    });
    return parseResponse(res, 'Failed to create student');
  },

  updateStudent: async (uid, updates) => {
    const res = await fetchWithTimeout(`${API_BASE}/students/${uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updates),
    });
    const data = await parseResponse(res, 'Failed to update student');
    return { uid, ...updates, ...(typeof data === 'object' && data !== null ? data : {}) };
  },

  deleteStudent: async (uid) => {
    const res = await fetchWithTimeout(`${API_BASE}/students/${uid}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    return parseResponse(res, 'Failed to delete student');
  },

  // Users (Admin user management)
  getUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetchWithTimeout(`${API_BASE}/users?${query}`, {
      headers: { ...getAuthHeaders() }
    });
    const data = await parseResponse(res, 'Failed to fetch users');
    if (data && typeof data === 'object' && Array.isArray(data.items)) {
      return data;
    }
    return Array.isArray(data) ? data : [];
  },

  createUser: async (userData) => {
    const res = await fetchWithTimeout(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(userData),
    });
    return parseResponse(res, 'Failed to add user');
  },

  deleteUser: async (id) => {
    const res = await fetchWithTimeout(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    return parseResponse(res, 'Failed to delete user');
  },

  // Classes & Attendance
  getClasses: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetchWithTimeout(`${API_BASE}/classes?${query}`, {
      headers: { ...getAuthHeaders() }
    });
    const data = await parseResponse(res, 'Failed to fetch classes');
    if (data && typeof data === 'object' && Array.isArray(data.items)) {
      if (params.page !== undefined) {
        return data;
      }
      return data.items;
    }
    return Array.isArray(data) ? data : [];
  },

  markAttendance: async (payload) => {
    const res = await fetchWithTimeout(`${API_BASE}/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    return parseResponse(res, 'Failed to submit attendance');
  },

  getAttendanceSummary: async (department = 'Computer Department') => {
    const res = await fetchWithTimeout(`${API_BASE}/attendance/summary?department=${encodeURIComponent(department)}`, {
      headers: { ...getAuthHeaders() }
    });
    return parseResponse(res, 'Failed to fetch attendance summary');
  },

  getAttendanceSessions: async (department = 'Computer Department', params = {}) => {
    const query = new URLSearchParams({ department, ...params }).toString();
    const res = await fetchWithTimeout(`${API_BASE}/attendance/sessions-list?${query}`, {
      headers: { ...getAuthHeaders() }
    });
    const data = await parseResponse(res, 'Failed to fetch attendance sessions');
    if (data && typeof data === 'object' && Array.isArray(data.items)) {
      if (params.page !== undefined) {
        return data;
      }
      return data.items;
    }
    return Array.isArray(data) ? data : [];
  },

  getAttendanceRecords: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetchWithTimeout(`${API_BASE}/attendance/records?${query}`, {
      headers: { ...getAuthHeaders() }
    });
    const data = await parseResponse(res, 'Failed to fetch attendance records');
    if (data && typeof data === 'object' && Array.isArray(data.items)) {
      if (params.page !== undefined) {
        return data;
      }
      return data.items;
    }
    return Array.isArray(data) ? data : [];
  },

  updateSingleAttendanceRecord: async (payload) => {
    const res = await fetchWithTimeout(`${API_BASE}/attendance/update-single`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    return parseResponse(res, 'Failed to update attendance status');
  },

  getDepartmentStats: async (department = 'Computer Department') => {
    const res = await fetchWithTimeout(`${API_BASE}/department/stats?department=${encodeURIComponent(department)}`, {
      headers: { ...getAuthHeaders() }
    });
    return parseResponse(res, 'Failed to fetch department statistics');
  },

  freezeAttendance: async (payload) => {
    const res = await fetchWithTimeout(`${API_BASE}/attendance/freeze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    return parseResponse(res, 'Failed to freeze attendance session');
  },

  getAttendanceLockStatus: async (date, department = 'Computer Department') => {
    const res = await fetchWithTimeout(`${API_BASE}/attendance/lock-status?date=${encodeURIComponent(date)}&department=${encodeURIComponent(department)}`, {
      headers: { ...getAuthHeaders() }
    });
    return parseResponse(res, 'Failed to fetch lock status');
  },

  getAllAttendanceLocks: async (department = 'Computer Department') => {
    const res = await fetchWithTimeout(`${API_BASE}/attendance/all-locks?department=${encodeURIComponent(department)}`, {
      headers: { ...getAuthHeaders() }
    });
    const data = await parseResponse(res, 'Failed to fetch attendance locks');
    return Array.isArray(data) ? data : [];
  },

  // Face Recognition Enrollment
  enrollFace: async (uid, imageBase64) => {
    const res = await fetchWithTimeout(`${API_BASE}/face/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ uid, image: imageBase64 }),
    }, 60000, 1);
    return parseResponse(res, 'Failed to enroll face photo');
  },

  getFacePhotoCount: async (uid) => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/face/count/${encodeURIComponent(uid)}`, {
        headers: { ...getAuthHeaders() }
      });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) return { photoCount: 0, photos: [] };
      return await parseResponse(res, 'Failed to fetch face photo count');
    } catch {
      return { photoCount: 0, photos: [] };
    }
  }
};

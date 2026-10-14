import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Trash2, Filter, Search, Shield,
  GraduationCap, BookOpen, Crown, Building2, CheckCircle2,
  AlertTriangle, RefreshCw, Sparkles, PieChart, Award, Ban,
  X, Mail, Phone, Hash, Camera, Eye, TrendingUp, TrendingDown
} from 'lucide-react';
import { api } from '../utils/api';
import { getAvatarUrl, cleanAvatarUrl } from '../utils/avatarUtils';
import { FaceEnrollmentModal } from './FaceEnrollmentModal';
import { StudentPreviewModal } from './StudentPreviewModal';
import { useInfiniteList } from '../hooks/useInfiniteList';
import { InfiniteTable } from './InfiniteTable';
import {
  SkeletonMetricCard,
  SkeletonTableRow,
  DatabaseWakeupNotice,
  ErrorState,
  EmptyState
} from './Skeleton';

export const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSlowWakeup, setIsSlowWakeup] = useState(false);
  
  // Filters
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedDept, setSelectedDept] = useState('Computer Department');
  const [searchQuery, setSearchQuery] = useState('');

  const adminUsersQuery = useInfiniteList(
    useCallback(
      (params) =>
        api.getUsers({
          department: selectedDept !== 'All' ? selectedDept : '',
          role: selectedRole !== 'All' ? selectedRole : '',
          search: searchQuery,
          ...params,
        }),
      [selectedDept, selectedRole, searchQuery]
    ),
    { department: selectedDept, role: selectedRole, search: searchQuery },
    { limit: 20 }
  );
  
  // Modals & form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [faceEnrollTarget, setFaceEnrollTarget] = useState(null); // { uid, name }
  const [previewUser, setPreviewUser] = useState(null); // user row preview
  const [previewStudent, setPreviewStudent] = useState(null); // dedicated student preview modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'User@123',
    role: 'student',
    department: 'Computer Department',
    enrolment_number: '',
    student_photo: '',
    phone: '',
    status: 'Active'
  });

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const notify = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const wakeupTimer = setTimeout(() => setIsSlowWakeup(true), 2000);

    try {
      const [usersData, studentsData, summaryData] = await Promise.all([
        api.getUsers({ department: selectedDept !== 'All' ? selectedDept : '', all: 'true' }),
        api.getStudents({ department: selectedDept !== 'All' ? selectedDept : '', all: 'true' }),
        api.getAttendanceSummary(selectedDept !== 'All' ? selectedDept : 'Computer Department')
      ]);
      const rawUsers = Array.isArray(usersData) ? usersData : (usersData?.items || []);
      const rawStudents = Array.isArray(studentsData) ? studentsData : (studentsData?.items || []);
      setUsers(rawUsers);
      setStudents(rawStudents);
      setSummary(summaryData || null);
      clearTimeout(wakeupTimer);
      setIsSlowWakeup(false);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      clearTimeout(wakeupTimer);
      setIsSlowWakeup(false);
      setError('Failed to establish database telemetry. SQLite3 service may be initializing.');
      notify('Failed to load data from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDept]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (formData.role === 'student') {
        const newStu = await api.createStudent({
          name: formData.name,
          email: formData.email,
          enrolment_number: formData.enrolment_number || `2024COMP${Date.now().toString().slice(-4)}`,
          student_photo: cleanAvatarUrl(formData.student_photo, formData.name, null, false),
          department: formData.department,
          phone: formData.phone,
          status: formData.status
        });
        notify(`Added new student ${formData.name}! Opening face enrollment...`);
        setShowAddModal(false);
        if (newStu && newStu.uid) {
          setFaceEnrollTarget({ uid: newStu.uid, name: newStu.name });
        }
      } else {
        await api.createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          department: formData.department,
          phone: formData.phone,
          avatar: cleanAvatarUrl(formData.student_photo, formData.name, null, formData.role === 'faculty' || formData.role === 'hod')
        });
        notify(`Added new ${formData.role} successfully!`);
        setShowAddModal(false);
      }
      setFormData({
        name: '',
        email: '',
        password: 'User@123',
        role: 'student',
        department: 'Computer Department',
        enrolment_number: '',
        student_photo: '',
        phone: '',
        status: 'Active'
      });
      loadData();
    } catch (err) {
      notify(err.message || 'Failed to create user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userObj) => {
    if (!window.confirm(`Are you sure you want to remove ${userObj.name} (${userObj.role})?`)) return;
    try {
      if (userObj.role === 'student' && userObj.uid) {
        await api.deleteStudent(userObj.uid);
      } else {
        await api.deleteUser(userObj.id);
      }
      notify(`Removed ${userObj.name} from system.`);
      loadData();
    } catch (err) {
      notify('Failed to remove user', 'error');
    }
  };

  const handleToggleDetainStudent = async (studentUid, currentStatus) => {
    const isDetained = currentStatus === 'Detained';
    const newStatus = isDetained ? 'Active' : 'Detained';
    const confirmMsg = isDetained
      ? `Revoke detention and reinstate student (${studentUid}) back to Active status?`
      : `DETAIN this student (${studentUid}) for 1 academic year?\n\nThey will be BARRED from appearing in examinations and cannot be marked present in daily attendance.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.updateStudent(studentUid, { status: newStatus });
      setStudents((prev) => prev.map((s) => (s.uid === studentUid ? { ...s, status: newStatus } : s)));
      notify(
        isDetained
          ? `Reinstated student ${studentUid} to Active status.`
          : `Student ${studentUid} has been DETAINED for 1 academic year (Exam Barred).`,
        isDetained ? 'success' : 'error'
      );
      loadData();
    } catch (err) {
      notify(err.message || 'Failed to update student detention status', 'error');
    }
  };

  // Combine & filter records safely
  const userList = Array.isArray(users) ? users : (users?.items || []);
  const studentList = Array.isArray(students) ? students : (students?.items || []);

  const filteredUsers = userList.filter((u) => {
    const matchesRole = selectedRole === 'All' || (u.role && u.role.toLowerCase() === selectedRole.toLowerCase());
    const matchesSearch =
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.uid || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Map student percentage stats to user records
  const studentMap = {};
  studentList.forEach((s) => {
    if (s && s.uid) studentMap[s.uid] = s;
  });

  const adminColumns = [
    {
      key: 'user',
      label: 'User / Student',
      headerClassName: 'min-w-[270px]',
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <img
            src={cleanAvatarUrl(u.avatar, u.name, null, u.role === 'faculty' || u.role === 'hod')}
            alt={u.name}
            className="w-8 h-8 rounded-full object-cover bg-slate-800 ring-1 ring-slate-700/80 shrink-0"
          />
          <div className="min-w-0">
            <div className="font-semibold text-white text-xs whitespace-nowrap leading-tight">{u.name}</div>
            <div className="text-[11px] text-slate-400 font-mono leading-tight mt-0.5 whitespace-nowrap">{u.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'uid_enrolment',
      label: 'UID & Enrolment',
      headerClassName: 'min-w-[140px] whitespace-nowrap',
      render: (u) => {
        const studentInfo = studentMap[u.uid];
        const enrolment = studentInfo ? studentInfo.enrolment_number : '-';
        return (
          <div className="leading-tight">
            <div className="font-mono text-xs text-indigo-300 font-semibold">{u.uid}</div>
            {enrolment !== '-' && (
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">EN: {enrolment}</div>
            )}
          </div>
        );
      }
    },
    {
      key: 'role_dept',
      label: 'Role & Dept',
      headerClassName: 'min-w-[150px] whitespace-nowrap',
      render: (u) => (
        <div className="flex flex-col gap-1 items-start leading-tight">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              u.role === 'admin'
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                : u.role === 'hod'
                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                : u.role === 'faculty'
                ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {u.role}
          </span>
          <span className="text-[11px] text-slate-400">{u.department}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      headerClassName: 'min-w-[120px] whitespace-nowrap',
      render: (u) => {
        const studentInfo = studentMap[u.uid];
        return studentInfo?.status === 'Detained' ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Detained (1-Yr Bar)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Active
          </span>
        );
      }
    },
    {
      key: 'attendance_pct',
      label: 'Overall Attendance %',
      headerClassName: 'min-w-[150px] whitespace-nowrap',
      render: (u) => {
        const studentInfo = studentMap[u.uid];
        const rawPercentage = studentInfo ? studentInfo.percentage : null;
        const percentage = rawPercentage !== null ? Math.min(rawPercentage, 95) : null;
        return percentage !== null ? (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={`font-bold ${percentage >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {percentage}%
              </span>
              <span className="text-slate-500 text-[10px] ml-2">
                {Math.min(studentInfo.total_classes_present || 0, studentInfo.total_classes_conducted || 0)}/{studentInfo.total_classes_conducted || 0}
              </span>
            </div>
            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${percentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500">N/A (Staff)</span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'min-w-[180px] text-right whitespace-nowrap',
      className: 'text-right',
      render: (u) => {
        const studentInfo = studentMap[u.uid];
        return (
          <div className="flex items-center justify-end gap-1.5">
            {(u.role === 'student' || (u.uid && u.uid.startsWith('STU-'))) && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const sInfo = studentMap[u.uid];
                    setPreviewStudent({
                      ...u,
                      ...(sInfo || {}),
                      email: u.email || sInfo?.email || '',
                      student_photo: sInfo?.student_photo || u.avatar || '',
                    });
                  }}
                  className="px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all flex items-center gap-1 text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                  title={`Preview student profile for ${u.name}`}
                  aria-label={`Preview ${u.name}`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleDetainStudent(u.uid, studentInfo?.status)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 border cursor-pointer whitespace-nowrap ${
                    studentInfo?.status === 'Detained'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                  }`}
                  title={
                    studentInfo?.status === 'Detained'
                      ? 'Revoke detention and reinstate student'
                      : 'Detain student for 1 academic year (bar from exams & attendance)'
                  }
                  aria-label={studentInfo?.status === 'Detained' ? `Reinstate ${u.name}` : `Detain ${u.name}`}
                >
                  <Ban className="w-3 h-3" />
                  <span>{studentInfo?.status === 'Detained' ? 'Reinstate' : 'Detain'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFaceEnrollTarget({ uid: u.uid, name: u.name })}
                  className="px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all flex items-center gap-1 text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                  title={`Enroll Face for ${u.name} (${u.uid})`}
                  aria-label={`Enroll Face for ${u.name}`}
                >
                  <span className="text-xs">📷</span>
                  <span>Enroll</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => handleDeleteUser(u)}
              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer"
              title="Remove user"
              aria-label={`Remove user ${u.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {notification.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-xl flex items-center gap-3 transition-all ${
            notification.type === 'error'
              ? 'bg-rose-950 border-rose-800 text-rose-200'
              : 'bg-emerald-950 border-emerald-800 text-emerald-200'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Admin Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider mb-3">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Control Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Department Attendance & User Management
            </h1>
            <p className="text-slate-400 text-sm mt-2 max-w-2xl">
              Real-time monitoring for <span className="text-indigo-300 font-semibold">Computer Department</span>. Add, remove, and filter users across Admin, Faculty, Student, and HOD roles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DatabaseWakeupNotice visible={isSlowWakeup} message="Connecting to SQLite database..." />
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User / Student</span>
            </button>
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Global Error Banner if initial fetch failed */}
      {error && userList.length === 0 && !loading && (
        <ErrorState
          title="Database Connection Offline"
          message={error}
          onRetry={loadData}
        />
      )}

      {/* Metric Cards - Skeleton during loading, real when ready */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonMetricCard />
            <SkeletonMetricCard />
            <SkeletonMetricCard />
            <SkeletonMetricCard />
          </>
        ) : (
          <>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 fade-in-content">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-400">Computer Dept Students</span>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black text-white">
                {summary ? summary.totalStudents : studentList.length}
              </div>
              <p className="text-xs text-slate-400 mt-1">Enrolled in 5th Semester</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 fade-in-content">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-400">Dept Avg Attendance</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <PieChart className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black text-emerald-400">
                {summary ? summary.avgAttendance : 85}%
              </div>
              <p className="text-xs text-slate-400 mt-1">Lecture & Lab aggregate</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 fade-in-content">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-400">Faculty Members</span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black text-white">
                {summary ? summary.totalFaculty : 2}
              </div>
              <p className="text-xs text-slate-400 mt-1">Active Professors & Tutors</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 fade-in-content">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-400">Low Attendance (&lt;75%)</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black text-amber-400">
                {summary ? summary.lowAttendanceCount : 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">Requires HOD Attention</p>
            </div>
          </>
        )}
      </div>

      {/* FILTERS & SEARCH BAR */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Department Filter (Computer Department current) */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-xs font-semibold uppercase text-slate-400">Department:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="Computer Department">Computer Department</option>
            <option value="All">All Departments (Future)</option>
          </select>
        </div>

        {/* Center: Role Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold uppercase text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Role:
          </span>
          {['All', 'student', 'faculty', 'hod', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                selectedRole.toLowerCase() === role.toLowerCase()
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Right: Search Box */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Name, UID, Enroll..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* USERS & STUDENTS TABLE */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">
              Members Roster ({filteredUsers.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Click any row to preview · Showing Computer Department accounts
          </span>
        </div>

        <div className="p-4 sm:p-6 min-w-0">
          <InfiniteTable
            columns={adminColumns}
            items={adminUsersQuery.items.length > 0 ? adminUsersQuery.items : (adminUsersQuery.isInitialLoading ? [] : filteredUsers)}
            loading={adminUsersQuery.isInitialLoading}
            loadingMore={adminUsersQuery.isLoadingMore}
            error={adminUsersQuery.error}
            hasMore={adminUsersQuery.hasMore}
            sentinelRef={adminUsersQuery.sentinelRef}
            onRetry={adminUsersQuery.refresh}
            emptyMessage={searchQuery ? `No members match "${searchQuery}" for role "${selectedRole}".` : "No records currently registered under this filter."}
            tableAriaLabel="Members roster management table"
            minWidth="1050px"
            itemCountLabel={`Showing ${adminUsersQuery.items.length > 0 ? adminUsersQuery.items.length : filteredUsers.length} of ${adminUsersQuery.total || (adminUsersQuery.items.length > 0 ? adminUsersQuery.items.length : filteredUsers.length)} members`}
            onRowClick={(u) => {
              const isStudent = u.role === 'student' || (u.uid && u.uid.startsWith('STU-'));
              if (isStudent) {
                const sInfo = studentMap[u.uid];
                setPreviewStudent({
                  ...u,
                  ...(sInfo || {}),
                  email: u.email || sInfo?.email || '',
                  student_photo: sInfo?.student_photo || u.avatar || '',
                });
              } else {
                setPreviewUser(u);
              }
            }}
          />
        </div>
      </div>

      {/* ── SLIDE-OVER PREVIEW PANEL ── */}
      {previewUser && (() => {
        const u = previewUser;
        const studentInfo = studentMap[u.uid];
        const pct = studentInfo?.percentage ?? null;
        const isStudent = u.role === 'student' || (u.uid && u.uid.startsWith('STU-'));
        const roleBg = u.role === 'admin'
          ? 'from-amber-500/20 to-amber-600/10 border-amber-500/40'
          : u.role === 'hod'
          ? 'from-purple-500/20 to-purple-600/10 border-purple-500/40'
          : u.role === 'faculty'
          ? 'from-blue-500/20 to-blue-600/10 border-blue-500/40'
          : 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/40';
        const roleColor = u.role === 'admin' ? 'text-amber-300' : u.role === 'hod' ? 'text-purple-300' : u.role === 'faculty' ? 'text-blue-300' : 'text-indigo-300';
        const detained = studentInfo?.status === 'Detained';
        // SVG attendance ring
        const radius = 36;
        const circumference = 2 * Math.PI * radius;
        const strokeDash = pct !== null ? (pct / 100) * circumference : 0;

        return (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
              onClick={() => setPreviewUser(null)}
              aria-hidden="true"
            />
            {/* Slide-over panel */}
            <div
              className="fixed right-0 top-0 h-full z-50 w-full max-w-sm bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-y-auto"
              role="dialog"
              aria-label={`Preview of ${u.name}`}
            >
              {/* Panel Header */}
              <div className={`bg-gradient-to-br ${roleBg} border-b border-slate-800 p-5 shrink-0`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={cleanAvatarUrl(u.avatar, u.name, null, u.role === 'faculty' || u.role === 'hod')}
                        alt={u.name}
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/20 bg-slate-800"
                      />
                      <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                        detained ? 'bg-amber-400' : 'bg-emerald-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white leading-tight">{u.name}</h3>
                      <span className={`text-xs font-bold uppercase tracking-wider ${roleColor}`}>{u.role}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewUser(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    aria-label="Close preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 p-5 space-y-5">

                {/* Attendance Ring (students only) */}
                {isStudent && pct !== null && (
                  <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                    <div className="relative shrink-0">
                      <svg width="88" height="88" className="-rotate-90">
                        <circle cx="44" cy="44" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
                        <circle
                          cx="44" cy="44" r={radius}
                          fill="none"
                          stroke={pct >= 75 ? '#10b981' : '#f59e0b'}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={circumference - strokeDash}
                          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-sm font-black ${pct >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>{pct}%</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-white">Overall Attendance</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span>Lectures: {studentInfo.lecture_present || 0}/{studentInfo.lecture_total || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <TrendingUp className="w-3 h-3 text-blue-400" />
                        <span>Labs: {studentInfo.lab_present || 0}/{studentInfo.lab_total || 0}</span>
                      </div>
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mt-1 ${
                        pct >= 75
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}>
                        {pct >= 75 ? '✓ Eligible' : '⚠ Below 75% Threshold'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Grid */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Account Details</h4>

                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { icon: Hash, label: 'UID', value: u.uid || '—', mono: true },
                      { icon: Mail, label: 'Email', value: u.email || '—', mono: true },
                      ...(studentInfo?.enrolment_number ? [{ icon: Award, label: 'Enrolment', value: studentInfo.enrolment_number, mono: true }] : []),
                      { icon: Building2, label: 'Department', value: u.department || '—', mono: false },
                      ...(u.phone ? [{ icon: Phone, label: 'Phone', value: u.phone, mono: true }] : []),
                    ].map(({ icon: Icon, label, value, mono }) => (
                      <div key={label} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/30">
                        <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
                          <div className={`text-xs text-slate-200 break-all leading-snug mt-0.5 ${mono ? 'font-mono' : 'font-medium'}`}>{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Academic Status</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                    detained
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${ detained ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400' }`} />
                    {detained ? 'Detained' : 'Active'}
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-5 border-t border-slate-800 space-y-2 shrink-0">
                {isStudent && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const sInfo = studentMap[u.uid];
                        setPreviewStudent({
                          ...u,
                          ...(sInfo || {}),
                          email: u.email || sInfo?.email || '',
                          student_photo: sInfo?.student_photo || u.avatar || '',
                        });
                        setPreviewUser(null);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-indigo-400" />
                      <span>Open Full Student Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFaceEnrollTarget({ uid: u.uid, name: u.name });
                        setPreviewUser(null);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Enroll / Update Face Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleDetainStudent(u.uid, studentInfo?.status);
                        setPreviewUser(null);
                      }}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        detained
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                      }`}
                    >
                      <Ban className="w-4 h-4" />
                      <span>{detained ? 'Reinstate Student' : 'Detain Student (1-Year Bar)'}</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteUser(u);
                    setPreviewUser(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-bold transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove {u.role === 'student' ? 'Student' : 'User'} from System</span>
                </button>
              </div>
            </div>
          </>
        );
      })()}

      {/* ADD USER / STUDENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Add New Member</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="hod">HOD</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Manav Saxena"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500"
                />
              </div>

              {formData.role === 'student' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Enrolment Number</label>
                    <input
                      type="text"
                      value={formData.enrolment_number}
                      onChange={(e) => setFormData({ ...formData, enrolment_number: e.target.value })}
                      placeholder="2024COMP0110"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Academic Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500"
                    >
                      <option value="Active">Active (Eligible)</option>
                      <option value="Detained">Detained (Barred from Exams - 1 Year)</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  disabled
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Photo URL (Optional)</label>
                <input
                  type="url"
                  value={formData.student_photo}
                  onChange={(e) => setFormData({ ...formData, student_photo: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Face Enrollment Modal */}
      {faceEnrollTarget && (
        <FaceEnrollmentModal
          isOpen={!!faceEnrollTarget}
          onClose={() => setFaceEnrollTarget(null)}
          uid={faceEnrollTarget.uid}
          studentName={faceEnrollTarget.name}
          onComplete={(count) => {
            notify(`Enrolled ${count} face photo(s) for ${faceEnrollTarget.name} & replaced avatar!`);
            loadData();
            if (adminUsersQuery && adminUsersQuery.refresh) {
              adminUsersQuery.refresh();
            }
          }}
        />
      )}

      {/* Dedicated Student Preview Modal (Admin Panel Only) */}
      {previewStudent && (
        <StudentPreviewModal
          student={previewStudent}
          onClose={() => setPreviewStudent(null)}
          onStudentUpdated={(updated) => {
            setStudents((prev) => prev.map((s) => (s.uid === updated.uid ? { ...s, ...updated } : s)));
            setUsers((prev) => prev.map((usr) => (usr.uid === updated.uid ? { ...usr, email: updated.email } : usr)));
            notify(`Updated profile for ${updated.name || 'student'}`);
            if (adminUsersQuery && adminUsersQuery.refresh) {
              adminUsersQuery.refresh();
            }
          }}
        />
      )}
    </div>
  );
};

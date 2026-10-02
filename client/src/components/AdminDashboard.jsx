import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Trash2, Filter, Search, Shield,
  GraduationCap, BookOpen, Crown, Building2, CheckCircle2,
  AlertTriangle, RefreshCw, Sparkles, PieChart, Award
} from 'lucide-react';
import { api } from '../utils/api';
import { getAvatarUrl, cleanAvatarUrl } from '../utils/avatarUtils';

export const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedDept, setSelectedDept] = useState('Computer Department');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & form state
  const [showAddModal, setShowAddModal] = useState(false);
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
    try {
      const [usersData, studentsData, summaryData] = await Promise.all([
        api.getUsers({ department: selectedDept !== 'All' ? selectedDept : '' }),
        api.getStudents({ department: selectedDept !== 'All' ? selectedDept : '' }),
        api.getAttendanceSummary(selectedDept !== 'All' ? selectedDept : 'Computer Department')
      ]);
      setUsers(usersData);
      setStudents(studentsData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
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
        await api.createStudent({
          name: formData.name,
          email: formData.email,
          enrolment_number: formData.enrolment_number || `2024COMP${Date.now().toString().slice(-4)}`,
          student_photo: cleanAvatarUrl(formData.student_photo, formData.name, null, false),
          department: formData.department,
          phone: formData.phone,
          status: formData.status
        });
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
      }

      notify(`Added new ${formData.role} successfully!`);
      setShowAddModal(false);
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

  // Combine & filter records
  const filteredUsers = users.filter((u) => {
    const matchesRole = selectedRole === 'All' || u.role.toLowerCase() === selectedRole.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.uid.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Map student percentage stats to user records
  const studentMap = {};
  students.forEach((s) => {
    studentMap[s.uid] = s;
  });

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
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User / Student</span>
            </button>
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Computer Dept Students</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-white">
            {summary ? summary.totalStudents : students.length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Enrolled in 5th Semester</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
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

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
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

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
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
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">
              Members Roster ({filteredUsers.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Showing Computer Department accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5 min-w-[220px]">User / Student</th>
                <th className="px-6 py-3.5 whitespace-nowrap">UID & Enrolment</th>
                <th className="px-6 py-3.5 whitespace-nowrap">Role & Dept</th>
                <th className="px-6 py-3.5 whitespace-nowrap">Status</th>
                <th className="px-6 py-3.5 whitespace-nowrap">Overall Attendance %</th>
                <th className="px-6 py-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const studentInfo = studentMap[u.uid];
                  const percentage = studentInfo ? studentInfo.percentage : null;
                  const enrolment = studentInfo ? studentInfo.enrolment_number : '-';

                  return (
                    <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                      {/* Name & Photo */}
                      <td className="px-6 py-4 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <img
                            src={cleanAvatarUrl(u.avatar, u.name, null, u.role === 'faculty' || u.role === 'hod')}
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover bg-slate-800 ring-1 ring-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-white whitespace-nowrap">{u.name}</div>
                            <div className="text-xs text-slate-400 font-mono truncate max-w-[180px]">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* UID & Enrolment */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono text-xs text-indigo-300 font-semibold">{u.uid}</div>
                        {enrolment !== '-' && (
                          <div className="text-xs text-slate-400 font-mono">EN: {enrolment}</div>
                        )}
                      </td>

                      {/* Role & Dept */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
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
                          <span className="text-xs text-slate-400">{u.department}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          {studentInfo ? studentInfo.status : 'Active'}
                        </span>
                      </td>

                      {/* Overall Attendance Percentage */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {percentage !== null ? (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className={`font-bold ${percentage >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {percentage}%
                              </span>
                              <span className="text-slate-500 text-[10px] ml-2">
                                {studentInfo.total_classes_present}/{studentInfo.total_classes_conducted}
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
                          <span className="text-xs text-slate-500">N/A (Staff)</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
                          title="Remove user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
  );
};

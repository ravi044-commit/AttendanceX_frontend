import React, { useState, useEffect } from 'react';
import { Shield, GraduationCap, BookOpen, Crown, Mail, Lock, Eye, EyeOff, User, Building, AlertCircle, ArrowRight, CheckCircle2, Sparkles, Info } from 'lucide-react';
import { api } from '../utils/api';

export const AuthModal = ({
  isOpen,
  onClose,
  initialRole = 'student',
  onSuccess
}) => {
  const [selectedRole, setSelectedRole] = useState(initialRole);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 4 Roles Configuration
  const roles = [
    {
      id: 'admin',
      name: 'Admin',
      title: 'Administrator',
      desc: 'System oversight & user management',
      icon: Shield,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-400',
      activeBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    },
    {
      id: 'student',
      name: 'Student',
      title: 'Enrolled Student',
      desc: 'View personal attendance & history',
      icon: GraduationCap,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400',
      activeBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    },
    {
      id: 'faculty',
      name: 'Faculty',
      title: 'Professor / Lecturer',
      desc: 'Mark lecture & lab attendance',
      icon: BookOpen,
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/40 text-blue-400',
      activeBadge: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
    },
    {
      id: 'hod',
      name: 'HOD',
      title: 'Head of Department',
      desc: 'Department analytics & monitoring',
      icon: Crown,
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-400',
      activeBadge: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    }
  ];

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const activeRole = initialRole || 'admin';
      setSelectedRole(activeRole);
      setError('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
    }
  }, [isOpen, initialRole]);

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setError('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let loginEmail = email.trim();
      if (selectedRole === 'student') {
        if (!loginEmail.includes('@')) {
          loginEmail = `${loginEmail}@attendancex.edu`;
        } else if (loginEmail.toLowerCase().endsWith('@attedance.edu')) {
          loginEmail = loginEmail.replace(/@attedance\.edu$/i, '@attendancex.edu');
        } else if (loginEmail.toLowerCase().endsWith('@attendance.edu')) {
          loginEmail = loginEmail.replace(/@attendance\.edu$/i, '@attendancex.edu');
        }
      }
      const res = await api.login(loginEmail, password, selectedRole);
      onSuccess(res.user, res.token);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 transition-all">
        
        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 mb-3 shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Welcome to AttendanceX
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Select your portal role and enter your institutional credentials
          </p>
        </div>

        {/* 4 SMALL ROLE BOXES */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Choose Your Role (4 Dedicated Portals)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {roles.map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.id;
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => handleRoleSelect(r.id)}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? `bg-slate-800/90 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg ${r.color}`
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-100">{r.name}</div>
                    <div className="text-[11px] text-slate-400 leading-tight line-clamp-1">{r.title}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* INSTITUTIONAL SECURITY NOTICE (NO PUBLIC SIGNUP PERMITTED) */}
        <div className="mb-6 px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-semibold uppercase tracking-wider text-indigo-300">
              {selectedRole.toUpperCase()} PORTAL
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 text-right">
            <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Public sign up is disabled. Institutional access only.</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form (LOGIN ONLY) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {selectedRole === 'student' ? 'Enrollment Number / Email' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  selectedRole === 'student'
                    ? 'enrollment_number@attendance.edu'
                    : selectedRole === 'faculty'
                    ? 'faculty.name@attendancex.edu'
                    : selectedRole === 'hod'
                    ? 'hod@attendancex.edu'
                    : 'admin@attendancex.edu'
                }
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/25 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Login as {selectedRole.toUpperCase()}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Close Modal Button */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            Cancel and Return
          </button>
        </div>
      </div>
    </div>
  );
};

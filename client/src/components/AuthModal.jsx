import React, { useState, useEffect } from 'react';
import {
  Shield, GraduationCap, BookOpen, Crown, Mail, Lock, Eye, EyeOff,
  AlertCircle, ArrowRight, CheckCircle2, Sparkles, KeyRound, RefreshCw,
  Clock, ArrowLeft, ShieldCheck
} from 'lucide-react';
import { api } from '../utils/api';

export const AuthModal = ({
  isOpen,
  onClose,
  initialRole = 'student',
  onSuccess
}) => {
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [mode, setMode] = useState('login'); // 'login' | 'forgot_password' | 'account_setup'

  // Form fields for Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form fields for Forgot Password / Recovery flow
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Done
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetAuthorization, setResetAuthorization] = useState('');

  // Resend and Expiration Countdown timers
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes (300s)
  const [resendCooldown, setResendCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
      setMode('login');
      setError('');
      setSuccessMsg('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setRecoveryStep(1);
      setRecoveryEmail('');
      setRecoveryOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setResetAuthorization('');
    }
  }, [isOpen, initialRole]);

  // Handle countdown timers
  useEffect(() => {
    let interval = null;
    if (recoveryStep === 2 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recoveryStep, otpTimer]);

  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setError('');
    setSuccessMsg('');
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Normal Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let loginEmail = email.trim();
      if (selectedRole === 'student') {
        if (loginEmail.toLowerCase().endsWith('@attedance.edu')) {
          loginEmail = loginEmail.replace(/@attedance\.edu$/i, '@attendancex.edu');
        } else if (loginEmail.toLowerCase().endsWith('@attendance.edu')) {
          loginEmail = loginEmail.replace(/@attendance\.edu$/i, '@attendancex.edu');
        }
      }
      const res = await api.login(loginEmail, password, selectedRole);
      onSuccess(res.user, res.token);
    } catch (err) {
      if (err.message === 'Failed to fetch' || err.message?.includes('fetch') || err.message?.includes('network')) {
        setError('Backend server is offline or unreachable on port 5000. Please ensure the backend server is running.');
      } else {
        setError(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Recovery Step 1: Send OTP
  const handleSendRecoveryOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    let targetEmail = recoveryEmail.trim();
    if (!targetEmail) {
      setError('Please enter your email address or enrollment number');
      setLoading(false);
      return;
    }

    if (selectedRole === 'student' && !targetEmail.includes('@')) {
      targetEmail = `${targetEmail}@attendancex.edu`;
    }

    try {
      const res = await api.sendOtp(targetEmail, 'password_recovery');
      setRecoveryEmail(targetEmail);
      setRecoveryStep(2);
      setOtpTimer(res.expiresInSeconds || 300);
      setResendCooldown(60);
      if (res.debugOtp) {
        setRecoveryOtp(res.debugOtp);
        setSuccessMsg(`Test Mode: Verification code is ${res.debugOtp}`);
      } else {
        setSuccessMsg(res.message || 'Verification code sent to your email.');
      }
    } catch (err) {
      setError(err.message || 'Failed to send recovery code.');
    } finally {
      setLoading(false);
    }
  };

  // Recovery Step 2: Verify OTP
  const handleVerifyRecoveryOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const cleanOtp = recoveryOtp.trim();
    if (cleanOtp.length !== 6) {
      setError('Please enter the 6-digit code sent to your email.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.verifyOtp(recoveryEmail, cleanOtp, 'password_recovery');
      if (res.resetAuthorization) {
        setResetAuthorization(res.resetAuthorization);
        setRecoveryStep(3);
        setSuccessMsg('Code verified successfully. Please enter your new password.');
      } else {
        setError('Failed to obtain password reset authorization.');
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Recovery Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.resetPassword(resetAuthorization, newPassword);
      setRecoveryStep(4);
      setSuccessMsg(res.message || 'Password has been updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to reset password. Token may have expired.');
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
            {mode === 'forgot_password' ? (
              <KeyRound className="w-6 h-6 text-white" />
            ) : (
              <Sparkles className="w-6 h-6 text-white" />
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {mode === 'forgot_password' ? 'Password Recovery' : 'Welcome to AttendanceX'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {mode === 'forgot_password'
              ? 'Verify your identity via real Email OTP to securely reset your credentials'
              : 'Select your portal role and enter your institutional credentials'}
          </p>
        </div>

        {/* 4 ROLES SELECTOR */}
        {mode === 'login' && (
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
                    className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${isSelected
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
        )}

        {/* Status / Error Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-medium">{error}</span>
            </div>
            {error.toLowerCase().includes('smtp') && (
              <div className="text-xs text-slate-400 pl-6 space-y-1 mt-1">
                <p>To send live emails to your inbox, set your SMTP credentials in <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded">server/.env</code>:</p>
                <div className="font-mono text-[11px] bg-slate-950/90 p-2 rounded-lg text-slate-300 border border-slate-800 leading-relaxed">
                  SMTP_USER=your_email@gmail.com<br />
                  SMTP_PASS=your_16_digit_app_password
                </div>
              </div>
            )}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODE: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                      ? 'Enrollment Number or Email (Gmail / .edu)'
                      : selectedRole === 'faculty'
                        ? 'Email (Gmail, Yahoo, or @attendancex.edu)'
                        : selectedRole === 'hod'
                          ? 'Email (Gmail, Yahoo, or @attendancex.edu)'
                          : 'Email (Gmail, Yahoo, or @attendancex.edu)'
                  }
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-xs sm:text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot_password');
                    setRecoveryStep(1);
                    setRecoveryEmail(email);
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
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
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
        )}

        {/* MODE: FORGOT PASSWORD / EMAIL OTP RECOVERY */}
        {mode === 'forgot_password' && (
          <div className="space-y-4">

            {/* Step 1: Request OTP */}
            {recoveryStep === 1 && (
              <form onSubmit={handleSendRecoveryOtp} className="space-y-4">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    Enter any email address (e.g. Gmail, Yahoo, Outlook) or your Enrollment Number to receive a secure 6-digit verification code.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address or Enrollment Number
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="Email (e.g. name@gmail.com) or Enrollment No."
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Login</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Enter OTP */}
            {recoveryStep === 2 && (
              <form onSubmit={handleVerifyRecoveryOtp} className="space-y-4">
                <div className="text-center py-2">
                  <div className="text-xs text-slate-400">
                    Verification code sent to:
                  </div>
                  <div className="text-sm font-mono font-bold text-indigo-300 mt-0.5">
                    {recoveryEmail}
                  </div>
                </div>

                {/* Spam Folder & Reset OTP Notice */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex flex-col gap-1.5">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      If you don't see the email in your normal inbox, <strong>please check your Spam or Junk folder</strong>.
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-400/80 pl-6">
                    If you change the email address, the current OTP will be cancelled and reset.
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Enter 6-Digit Verification Code
                    </label>
                    <div className="flex items-center gap-1 text-xs font-mono text-amber-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTimer(otpTimer)}</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={recoveryOtp}
                    onChange={(e) => setRecoveryOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-[12px] text-2xl font-mono py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Didn't receive the email?</span>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={() => handleSendRecoveryOtp()}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRecoveryStep(1)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change Email (Reset OTP)</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading || recoveryOtp.length !== 6 || otpTimer <= 0}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Verify Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Enter New Password */}
            {recoveryStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>OTP verified! Single-use reset authorization is active.</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors p-1"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Update Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 4: Success Confirmation */}
            {recoveryStep === 4 && (
              <div className="text-center py-6 space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Password Changed Successfully!</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Your account has been secured with the new password. You can now log into your portal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccessMsg('You can now log in with your updated credentials.');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 transition-all"
                >
                  Proceed to Login
                </button>
              </div>
            )}
          </div>
        )}

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

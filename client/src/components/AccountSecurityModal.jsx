import React, { useState, useEffect } from 'react';
import {
  Shield, Mail, Lock, CheckCircle2, AlertCircle, ArrowRight,
  RefreshCw, Clock, X, KeyRound, User, ArrowLeft, ShieldCheck
} from 'lucide-react';
import { api } from '../utils/api';

export const AccountSecurityModal = ({
  isOpen,
  onClose,
  user,
  onUserUpdated
}) => {
  const [activeTab, setActiveTab] = useState('email'); // 'email' | 'password'

  // Email Change State
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailStep, setEmailStep] = useState(1); // 1: input new email, 2: enter OTP, 3: success
  const [emailOtpTimer, setEmailOtpTimer] = useState(300);
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);

  // In-portal Password Change State
  const [pwdStep, setPwdStep] = useState(1); // 1: request OTP, 2: enter OTP, 3: enter new password, 4: success
  const [pwdOtp, setPwdOtp] = useState('');
  const [pwdOtpTimer, setPwdOtpTimer] = useState(300);
  const [pwdResendCooldown, setPwdResendCooldown] = useState(0);
  const [resetAuthToken, setResetAuthToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab('email');
      setEmailStep(1);
      setNewEmail('');
      setEmailOtp('');
      setPwdStep(1);
      setPwdOtp('');
      setResetAuthToken('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  // Timers for Email Change
  useEffect(() => {
    let interval = null;
    if (emailStep === 2 && emailOtpTimer > 0) {
      interval = setInterval(() => {
        setEmailOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [emailStep, emailOtpTimer]);

  useEffect(() => {
    let interval = null;
    if (emailResendCooldown > 0) {
      interval = setInterval(() => {
        setEmailResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [emailResendCooldown]);

  // Timers for Password Change
  useEffect(() => {
    let interval = null;
    if (pwdStep === 2 && pwdOtpTimer > 0) {
      interval = setInterval(() => {
        setPwdOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pwdStep, pwdOtpTimer]);

  useEffect(() => {
    let interval = null;
    if (pwdResendCooldown > 0) {
      interval = setInterval(() => {
        setPwdResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pwdResendCooldown]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 1. Send OTP for Email Change
  const handleSendEmailChangeOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const emailToVerify = newEmail.trim().toLowerCase();
    if (!emailToVerify || !emailToVerify.includes('@')) {
      setError('Please provide a valid new email address.');
      setLoading(false);
      return;
    }

    if (user?.email && user.email.toLowerCase() === emailToVerify) {
      setError('New email must be different from your current email.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.sendOtp(emailToVerify, 'email_change', user);
      setEmailStep(2);
      setEmailOtpTimer(res.expiresInSeconds || 300);
      setEmailResendCooldown(60);
      if (res.debugOtp) {
        setEmailOtp(res.debugOtp);
        setSuccessMsg(`Test Mode: Verification code is ${res.debugOtp}`);
      } else {
        setSuccessMsg(res.message || `Verification code dispatched to ${emailToVerify}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to dispatch email change code.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP for Email Change
  const handleVerifyEmailChangeOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const cleanOtp = emailOtp.trim();
    if (cleanOtp.length !== 6) {
      setError('Please enter the 6-digit code received on your new email.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.verifyEmailChange(newEmail.trim().toLowerCase(), cleanOtp, user);
      setEmailStep(3);
      setSuccessMsg(res.message || 'Email successfully verified and updated!');
      if (onUserUpdated && res.user) {
        onUserUpdated(res.user, res.token);
      }
    } catch (err) {
      setError(err.message || 'Failed to verify email change code.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Send OTP for In-Portal Password Change
  const handleSendPasswordOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (!user?.email) {
      setError('User email not found.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.sendOtp(user.email, 'password_recovery');
      setPwdStep(2);
      setPwdOtpTimer(res.expiresInSeconds || 300);
      setPwdResendCooldown(60);
      if (res.debugOtp) {
        setPwdOtp(res.debugOtp);
        setSuccessMsg(`Test Mode: Verification code is ${res.debugOtp}`);
      } else {
        setSuccessMsg(res.message || `Verification code sent to ${user.email}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to send password verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Verify OTP for Password Change
  const handleVerifyPasswordOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const cleanOtp = pwdOtp.trim();
    if (cleanOtp.length !== 6) {
      setError('Please enter the 6-digit code sent to your email.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.verifyOtp(user.email, cleanOtp, 'password_recovery');
      if (res.resetAuthorization) {
        setResetAuthToken(res.resetAuthorization);
        setPwdStep(3);
        setSuccessMsg('Code verified! Enter your new password below.');
      } else {
        setError('Authorization failed.');
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Submit New Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.resetPassword(resetAuthToken, newPassword);
      setPwdStep(4);
      setSuccessMsg(res.message || 'Password changed successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 transition-all">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Account Security & Verification</h2>
              <p className="text-xs text-slate-400">Manage verified email address and security credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Account Summary Card */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Current Account</div>
            <div className="text-sm font-bold text-slate-100">{user?.name}</div>
            <div className="text-indigo-400 font-mono mt-0.5">{user?.email}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Email Verified</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold uppercase">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-xl mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('email');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'email'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Update Email (with OTP)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'password'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Change Password (with OTP)</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-medium">{error}</span>
            </div>
            {error.toLowerCase().includes('smtp') && (
              <div className="text-[11px] text-slate-400 pl-6 space-y-1 mt-1">
                <p>To send real emails to your Gmail inbox, open <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded">server/.env</code> and enter your Gmail and App Password:</p>
                <div className="font-mono text-[10px] bg-slate-950/90 p-2 rounded-lg text-slate-300 border border-slate-800 leading-relaxed">
                  SMTP_USER=your_email@gmail.com<br />
                  SMTP_PASS=your_16_digit_app_password
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: EMAIL UPDATE FLOW */}
        {activeTab === 'email' && (
          <div>
            {emailStep === 1 && (
              <form onSubmit={handleSendEmailChangeOtp} className="space-y-4">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    You can set any normal email (Gmail, Yahoo, Outlook, etc.) or institutional (.edu) email. Your old email remains unchanged until the new address is verified via 6-digit OTP.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      New Email Address
                    </label>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      All normal emails supported
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com or college email"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !newEmail}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Send Verification Code to New Email</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {emailStep === 2 && (
              <form onSubmit={handleVerifyEmailChangeOtp} className="space-y-4">
                <div className="text-center py-2">
                  <div className="text-xs text-slate-400">Verification code dispatched to:</div>
                  <div className="text-sm font-mono font-bold text-indigo-300">{newEmail}</div>
                </div>

                {/* Spam Folder & Email Change Reset Notice */}
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
                      <span>{formatTimer(emailOtpTimer)}</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-[12px] text-2xl font-mono py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Didn't receive the email?</span>
                  <button
                    type="button"
                    disabled={emailResendCooldown > 0 || loading}
                    onClick={() => handleSendEmailChangeOtp()}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>{emailResendCooldown > 0 ? `Resend in ${emailResendCooldown}s` : 'Resend Code'}</span>
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEmailStep(1)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change Email (Reset OTP)</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading || emailOtp.length !== 6 || emailOtpTimer <= 0}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Confirm & Update Email</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {emailStep === 3 && (
              <div className="text-center py-6 space-y-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Email Address Updated!</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-mono">
                    {newEmail} is now your primary verified email address.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer"
                >
                  Close Settings
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: IN-PORTAL PASSWORD CHANGE FLOW */}
        {activeTab === 'password' && (
          <div>
            {pwdStep === 1 && (
              <div className="space-y-4 text-center py-2">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 text-left flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    To change your password, a 6-digit OTP verification code will be dispatched to your current email ({user?.email}).
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSendPasswordOtp}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Send Verification Code to My Email</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {pwdStep === 2 && (
              <form onSubmit={handleVerifyPasswordOtp} className="space-y-4">
                <div className="text-center py-2">
                  <div className="text-xs text-slate-400">Code sent to:</div>
                  <div className="text-sm font-mono font-bold text-indigo-300">{user?.email}</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Enter 6-Digit Verification Code
                    </label>
                    <div className="flex items-center gap-1 text-xs font-mono text-amber-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTimer(pwdOtpTimer)}</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pwdOtp}
                    onChange={(e) => setPwdOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-[12px] text-2xl font-mono py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Didn't receive the email?</span>
                  <button
                    type="button"
                    disabled={pwdResendCooldown > 0 || loading}
                    onClick={() => handleSendPasswordOtp()}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>{pwdResendCooldown > 0 ? `Resend in ${pwdResendCooldown}s` : 'Resend Code'}</span>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || pwdOtp.length !== 6 || pwdOtpTimer <= 0}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 cursor-pointer"
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

            {pwdStep === 3 && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Update Password</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {pwdStep === 4 && (
              <div className="text-center py-6 space-y-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Password Changed!</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Your password has been securely updated.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer"
                >
                  Close Settings
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

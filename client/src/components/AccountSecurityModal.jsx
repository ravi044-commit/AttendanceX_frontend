import React, { useState, useEffect } from 'react';
import {
  Shield, Mail, Lock, CheckCircle2, AlertCircle, ArrowRight,
  RefreshCw, Clock, X, KeyRound, User, ArrowLeft, ShieldCheck,
  Eye, EyeOff
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

  // Google Account Linking State
  const [googleStatus, setGoogleStatus] = useState({
    linked: Boolean(user?.google_id),
    googleEmail: user?.google_email || null
  });
  const [unlinkPassword, setUnlinkPassword] = useState('');
  const [showUnlinkPassword, setShowUnlinkPassword] = useState(false);
  const [connectPassword, setConnectPassword] = useState('');
  const [showConnectPassword, setShowConnectPassword] = useState(false);
  const [pendingGoogleLink, setPendingGoogleLink] = useState(null);

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
      setUnlinkPassword('');
      setConnectPassword('');
      setPendingGoogleLink(null);
      setError('');
      setSuccessMsg('');
      if (user) {
        setGoogleStatus({
          linked: Boolean(user.google_id),
          googleEmail: user.google_email || null
        });
      }
    }
  }, [isOpen, user]);

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

  // Google Account Linking Handlers
  const handleUnlinkGoogle = async (e) => {
    e.preventDefault();
    if (!unlinkPassword) {
      setError('Please enter your AttendanceX password to unlink Google account.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.unlinkGoogleAccount(unlinkPassword);
      setGoogleStatus({ linked: false, googleEmail: null });
      setUnlinkPassword('');
      setSuccessMsg('Google account successfully unlinked from your profile.');
      if (onUserUpdated) {
        onUserUpdated({ ...user, google_id: null, google_email: null });
      }
    } catch (err) {
      setError(err.message || 'Failed to unlink Google account.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkCurrentAccountGoogle = async (response) => {
    if (!response || !response.credential) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.googleLogin(response.credential);
      if (res.status === 'unlinked') {
        setPendingGoogleLink(res);
        setConnectPassword('');
        setSuccessMsg(`Google identity ${res.googleEmail} verified. Enter your password to complete linking.`);
      } else if (res.user) {
        setSuccessMsg('Google account is linked.');
        setGoogleStatus({ linked: true, googleEmail: res.user.google_email || res.user.email });
      }
    } catch (err) {
      setError(err.message || 'Failed to authenticate with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmLink = async (e) => {
    e.preventDefault();
    if (!connectPassword || !pendingGoogleLink?.linkToken) {
      setError('Please enter your AttendanceX password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.linkGoogleAccount({
        linkToken: pendingGoogleLink.linkToken,
        identifier: user.email || user.uid,
        password: connectPassword
      });
      setGoogleStatus({ linked: true, googleEmail: res.user?.google_email || pendingGoogleLink.googleEmail });
      setPendingGoogleLink(null);
      setConnectPassword('');
      setSuccessMsg('Google account linked successfully!');
      if (onUserUpdated && res.user) {
        onUserUpdated(res.user);
      }
    } catch (err) {
      setError(err.message || 'Failed to link Google account.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || activeTab !== 'google' || googleStatus.linked) return;

    let timer = null;
    const renderBtn = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '631464953143-s5tkj9oamekrfulm8jqc8l2n5q03co8r.apps.googleusercontent.com',
            callback: handleLinkCurrentAccountGoogle,
            auto_select: false,
          });
          const container = document.getElementById('googleSecurityBtnContainer');
          if (container) {
            container.innerHTML = '';
            window.google.accounts.id.renderButton(container, {
              type: 'standard',
              theme: 'filled_black',
              size: 'large',
              text: 'continue_with',
              shape: 'pill',
              width: 300,
            });
          }
        } catch (e) {
          console.warn('GIS error in security modal:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      renderBtn();
    } else {
      timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          renderBtn();
          clearInterval(timer);
        }
      }, 300);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, activeTab, googleStatus.linked]);

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
          <button
            type="button"
            onClick={() => {
              setActiveTab('google');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'google'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Google Account</span>
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

        {/* TAB 3: GOOGLE ACCOUNT INTEGRATION */}
        {activeTab === 'google' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">Google Single Sign-On</h4>
                    <p className="text-xs text-slate-400">
                      {googleStatus.linked ? 'Your Google account is securely connected.' : 'Link your Google account for 1-click Sign-In.'}
                    </p>
                  </div>
                </div>

                {googleStatus.linked ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Linked</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold">
                    Not Linked
                  </span>
                )}
              </div>

              {googleStatus.linked && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Connected Google Email:</span>
                  <span className="font-mono text-indigo-300 font-semibold">{googleStatus.googleEmail || user?.google_email || 'Linked Google Account'}</span>
                </div>
              )}
            </div>

            {/* UNLINK FORM */}
            {googleStatus.linked ? (
              <form onSubmit={handleUnlinkGoogle} className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                <div className="text-xs text-slate-300">
                  <div className="font-semibold text-rose-300 mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>Disconnect Google Account</span>
                  </div>
                  <p className="text-slate-400">
                    To unlink your Google account, enter your AttendanceX password. You will continue to log in using your institutional email/enrollment and password.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showUnlinkPassword ? 'text' : 'password'}
                      required
                      value={unlinkPassword}
                      onChange={(e) => setUnlinkPassword(e.target.value)}
                      placeholder="Enter your AttendanceX password"
                      className="w-full px-3 pr-10 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowUnlinkPassword(!showUnlinkPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 p-1"
                    >
                      {showUnlinkPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !unlinkPassword}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>Disconnect Google Account</span>
                  )}
                </button>
              </form>
            ) : pendingGoogleLink ? (
              /* CONFIRM LINK FORM WHEN PENDING */
              <form onSubmit={handleConfirmLink} className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
                <div className="text-xs text-indigo-300">
                  <div className="font-semibold text-white mb-1">Confirm Account Binding</div>
                  <p>
                    Connecting Google Identity <span className="font-mono text-indigo-200 font-bold">{pendingGoogleLink.googleEmail}</span> to your current AttendanceX profile. Enter your password to finalize.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">AttendanceX Password</label>
                  <div className="relative">
                    <input
                      type={showConnectPassword ? 'text' : 'password'}
                      required
                      value={connectPassword}
                      onChange={(e) => setConnectPassword(e.target.value)}
                      placeholder="Enter your AttendanceX password"
                      className="w-full px-3 pr-10 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConnectPassword(!showConnectPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 p-1"
                    >
                      {showConnectPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingGoogleLink(null)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !connectPassword}
                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Linking...' : 'Confirm Link'}
                  </button>
                </div>
              </form>
            ) : (
              /* CONNECT VIA GOOGLE BUTTON */
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
                <p className="text-xs text-slate-400">
                  Select your Google account to connect it with your AttendanceX account.
                </p>
                <div className="flex justify-center w-full min-h-[44px]">
                  <div id="googleSecurityBtnContainer"></div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

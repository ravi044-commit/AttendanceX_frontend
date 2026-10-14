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
  const [mode, setMode] = useState('login'); // 'login' | 'forgot_password' | 'account_setup' | 'link_google'

  // Form fields for Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form fields for Google Account Linking
  const [googleLinkData, setGoogleLinkData] = useState({
    linkToken: '',
    googleEmail: '',
    googleName: '',
    suggestedIdentifier: ''
  });
  const [linkIdentifier, setLinkIdentifier] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [showLinkPassword, setShowLinkPassword] = useState(false);
  const [googleScriptReady, setGoogleScriptReady] = useState(false);

  // Form fields for Forgot Password / Recovery flow
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: Email & Password, 2: OTP, 3: New Password, 4: Done
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);
  const [displayEmail, setDisplayEmail] = useState('');
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
      setRecoveryPassword('');
      setShowRecoveryPassword(false);
      setDisplayEmail('');
      setRecoveryOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setResetAuthorization('');
      setGoogleLinkData({ linkToken: '', googleEmail: '', googleName: '', suggestedIdentifier: '' });
      setLinkIdentifier('');
      setLinkPassword('');
      setShowLinkPassword(false);
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

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '631464953143-s5tkj9oamekrfulm8jqc8l2n5q03co8r.apps.googleusercontent.com';

  // Handle Google OAuth Credential Response
  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      setError('Google Sign-In response did not contain credentials.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.googleLogin(response.credential, selectedRole);
      if (res.status === 'unlinked') {
        setGoogleLinkData({
          linkToken: res.linkToken,
          googleEmail: res.googleEmail,
          googleName: res.googleName,
          suggestedIdentifier: res.suggestedIdentifier || res.googleEmail
        });
        setLinkIdentifier(res.suggestedIdentifier || res.googleEmail || '');
        setLinkPassword('');
        setMode('link_google');
      } else if (res.user && res.token) {
        onSuccess(res.user, res.token);
      } else {
        setError(res.error || 'Google authentication failed');
      }
    } catch (err) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  // Google Secure Linking Submit
  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!linkIdentifier.trim() || !linkPassword) {
      setError('Please provide your AttendanceX identifier and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.linkGoogleAccount({
        linkToken: googleLinkData.linkToken,
        identifier: linkIdentifier.trim(),
        password: linkPassword
      });
      if (res.user && res.token) {
        onSuccess(res.user, res.token);
      } else {
        setError(res.error || 'Failed to link account');
      }
    } catch (err) {
      setError(err.message || 'Account linking failed');
    } finally {
      setLoading(false);
    }
  };

  // Google Identity Services (GIS) Button Initialization
  useEffect(() => {
    if (!isOpen || mode !== 'login') return;

    let checkInterval = null;
    let resizeTimer = null;

    const renderGoogleBtn = () => {
      const container = document.getElementById('googleSignInBtnContainer');
      if (!container || !window.google?.accounts?.id) return;

      const containerWidth = container.offsetWidth || container.parentElement?.offsetWidth || 280;
      // Google GIS width must be between 200 and 400 pixels
      const btnWidth = Math.max(200, Math.min(Math.floor(containerWidth), 340));

      container.innerHTML = '';
      try {
        window.google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: btnWidth,
        });
      } catch (err) {
        console.warn('Google Identity Services renderButton error:', err);
      }
    };

    const setupGoogle = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        setGoogleScriptReady(true);
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          renderGoogleBtn();
        } catch (err) {
          console.warn('Google Identity Services init warning:', err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      setupGoogle();
    } else {
      checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          setupGoogle();
          clearInterval(checkInterval);
        }
      }, 300);
    }

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.google?.accounts?.id) {
          renderGoogleBtn();
        }
      }, 200);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, mode, googleClientId, selectedRole]);

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
      const verifiedEmail = res.email || targetEmail;
      setRecoveryEmail(verifiedEmail);
      setDisplayEmail(res.email || targetEmail);
      setRecoveryStep(2);
      setOtpTimer(res.expiresInSeconds || 300);
      setResendCooldown(60);
      if (res.debugOtp) {
        setRecoveryOtp(res.debugOtp);
        setSuccessMsg(`Test Mode: Verification code is ${res.debugOtp}`);
      } else {
        setSuccessMsg(res.message || `Verification code sent to ${res.email || targetEmail}`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto overflow-x-hidden box-border">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 my-auto sm:my-8 transition-all box-border min-w-0 overflow-hidden">

        {/* Modal Header */}
        <div className="text-center mb-5 sm:mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 mb-2.5 sm:mb-3 shadow-lg shadow-indigo-500/30">
            {mode === 'forgot_password' ? (
              <KeyRound className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            ) : mode === 'link_google' ? (
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            ) : (
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            )}
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            {mode === 'forgot_password'
              ? 'Password Recovery'
              : mode === 'link_google'
              ? 'Link Google Account'
              : 'Welcome to AttendanceX'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto leading-normal">
            {mode === 'forgot_password'
              ? 'Verify your identity via real Email OTP to securely reset your credentials'
              : mode === 'link_google'
              ? 'Connect your verified Google Identity to your AttendanceX profile'
              : 'Select your portal role and enter your institutional credentials'}
          </p>
        </div>

        {/* 4 ROLES SELECTOR */}
        {mode === 'login' && (
          <div className="mb-5 sm:mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 sm:mb-3">
              Choose Your Role (4 Dedicated Portals)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full box-border min-w-0">
              {roles.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => handleRoleSelect(r.id)}
                    className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer min-w-0 w-full box-border ${isSelected
                      ? `bg-slate-800/90 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg ${r.color}`
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5 sm:mb-2 min-w-0">
                      <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 shrink-0 ml-1" />
                      )}
                    </div>
                    <div className="w-full min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-slate-100 truncate">{r.name}</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 leading-tight truncate">{r.title}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Status / Error Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex flex-col gap-1.5 box-border">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-medium break-words">{error}</span>
            </div>
            {error.toLowerCase().includes('smtp') && (
              <div className="text-xs text-slate-400 pl-6 space-y-1 mt-1">
                <p>To send live emails to your inbox, set your SMTP credentials in <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded">server/.env</code>:</p>
                <div className="font-mono text-[11px] bg-slate-950/90 p-2 rounded-lg text-slate-300 border border-slate-800 leading-relaxed overflow-x-auto">
                  SMTP_USER=your_email@gmail.com<br />
                  SMTP_PASS=your_16_digit_app_password
                </div>
              </div>
            )}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm flex items-center gap-2 box-border">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="break-words">{successMsg}</span>
          </div>
        )}

        {/* MODE: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 w-full box-border">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {selectedRole === 'student' ? 'Enrollment Number / Email' : 'Email Address'}
              </label>
              <div className="relative w-full min-w-0">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    selectedRole === 'student'
                      ? 'Enrollment No. or Email'
                      : selectedRole === 'faculty'
                        ? 'Email (Gmail, Yahoo, @attendancex.edu)'
                        : 'Institutional Email Address'
                  }
                  className="w-full min-w-0 pl-9 pr-3 sm:pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono box-border"
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
                    setRecoveryPassword(password || '');
                    setShowRecoveryPassword(false);
                    setDisplayEmail('');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative w-full min-w-0">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full min-w-0 pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 box-border"
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
                className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/25 cursor-pointer hover:scale-[1.01] active:scale-[0.99] box-border"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Sign In as {selectedRole.toUpperCase()}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* DIVIDER: OR SIGN IN WITH GOOGLE */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Or Continue With
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* GOOGLE IDENTITY SERVICES BUTTON CONTAINER */}
            <div className="flex flex-col items-center justify-center w-full min-h-[44px] overflow-hidden">
              <div id="googleSignInBtnContainer" className="flex justify-center w-full max-w-full overflow-hidden"></div>

              {!googleScriptReady && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    if (window.google?.accounts?.id) {
                      window.google.accounts.id.prompt();
                    } else {
                      setError('Google Identity Services is loading. Please verify that accounts.google.com is accessible.');
                    }
                  }}
                  className="w-full max-w-full sm:max-w-sm py-2.5 px-4 rounded-full bg-slate-950/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-2.5 shadow-sm cursor-pointer box-border"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* MODE: LINK GOOGLE ACCOUNT */}
        {mode === 'link_google' && (
          <form onSubmit={handleLinkSubmit} className="space-y-4 w-full box-border">
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex flex-col gap-2 box-border">
              <div className="flex items-center gap-2 font-semibold text-slate-100">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Google Identity Verified</span>
              </div>
              <p className="text-slate-300 leading-relaxed break-words">
                Google account <span className="font-mono text-indigo-300 font-bold">{googleLinkData.googleEmail}</span> {googleLinkData.googleName ? `(${googleLinkData.googleName})` : ''} is verified. To complete secure linking, enter your existing AttendanceX credentials below.
              </p>
              <p className="text-[11px] text-slate-400">
                This one-time link securely connects your Google ID while preserving your existing role, UID, and all attendance records.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                AttendanceX Email or Enrollment Number
              </label>
              <div className="relative w-full min-w-0">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={linkIdentifier}
                  onChange={(e) => setLinkIdentifier(e.target.value)}
                  placeholder="e.g. 246250307001 or admin@attendancex.edu"
                  className="w-full min-w-0 pl-9 pr-3 sm:pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono box-border"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                AttendanceX Password
              </label>
              <div className="relative w-full min-w-0">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type={showLinkPassword ? "text" : "password"}
                  required
                  value={linkPassword}
                  onChange={(e) => setLinkPassword(e.target.value)}
                  placeholder="Enter your AttendanceX password"
                  className="w-full min-w-0 pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 box-border"
                />
                <button
                  type="button"
                  onClick={() => setShowLinkPassword(!showLinkPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                  title={showLinkPassword ? "Hide password" : "Show password"}
                >
                  {showLinkPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccessMsg('');
                }}
                className="flex-1 min-w-0 py-2.5 px-3 sm:px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer box-border"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Back to Sign In</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 min-w-0 py-2.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 cursor-pointer box-border"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="truncate">Confirm & Link</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* MODE: FORGOT PASSWORD / EMAIL OTP RECOVERY */}
        {mode === 'forgot_password' && (
          <div className="space-y-4 w-full box-border">

            {/* Step 1: Request OTP */}
            {recoveryStep === 1 && (
              <form onSubmit={handleSendRecoveryOtp} className="space-y-4 w-full box-border">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-2 box-border">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    Enter your Email address or Enrollment Number to receive a secure 6-digit verification code. Once verified, you will be able to set your new password.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address or Enrollment Number
                  </label>
                  <div className="relative w-full min-w-0">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="Email or Enrollment No."
                      className="w-full min-w-0 pl-9 pr-3 sm:pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono box-border"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 sm:gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                    }}
                    className="flex-1 min-w-0 py-2.5 px-3 sm:px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer box-border"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Back to Sign In</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 min-w-0 py-2.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 cursor-pointer box-border"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="truncate">Send Code</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Enter OTP */}
            {recoveryStep === 2 && (
              <form onSubmit={handleVerifyRecoveryOtp} className="space-y-4 w-full box-border">
                <div className="text-center py-2">
                  <div className="text-xs text-slate-400">
                    Verification code sent to registered email:
                  </div>
                  <div className="text-sm font-mono font-bold text-indigo-300 mt-1 px-3 py-1 bg-indigo-500/10 rounded-xl inline-block border border-indigo-500/20 max-w-full truncate">
                    {displayEmail || recoveryEmail}
                  </div>
                </div>

                {/* Spam Folder & Reset OTP Notice */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex flex-col gap-1.5 box-border">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      If you don't see the email, <strong>check your Spam or Junk folder</strong>.
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-400/80 pl-6">
                    Changing the account details will cancel and reset the code.
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Enter 6-Digit Code
                    </label>
                    <div className="flex items-center gap-1 text-xs font-mono text-amber-400">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
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
                    className="w-full text-center tracking-[8px] sm:tracking-[12px] text-xl sm:text-2xl font-mono py-2.5 sm:py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-bold box-border"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>No email?</span>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={() => handleSendRecoveryOtp()}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>{resendCooldown > 0 ? `Wait ${resendCooldown}s` : 'Resend Code'}</span>
                  </button>
                </div>

                <div className="flex gap-2.5 sm:gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRecoveryStep(1)}
                    className="flex-1 min-w-0 py-2.5 px-3 sm:px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer box-border"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Change Details</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading || recoveryOtp.length !== 6 || otpTimer <= 0}
                    className="flex-1 min-w-0 py-2.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 cursor-pointer box-border"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="truncate">Verify Code</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Enter New Password */}
            {recoveryStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4 w-full box-border">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2 box-border">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>OTP verified! Reset authorization active.</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                  <div className="relative w-full min-w-0">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full min-w-0 pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 box-border"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                      title={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
                  <div className="relative w-full min-w-0">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full min-w-0 pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 box-border"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25 cursor-pointer box-border"
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
              <div className="text-center py-6 space-y-4 w-full box-border">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-100">Password Changed Successfully!</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Your account has been secured with the new password. You can now sign into your portal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccessMsg('You can now sign in with your updated credentials.');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 transition-all cursor-pointer box-border"
                >
                  Proceed to Sign In
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

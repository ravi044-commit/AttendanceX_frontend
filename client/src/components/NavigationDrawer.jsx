import React, { useEffect, useState } from 'react';
import {
  Home,
  Bell,
  Info,
  Mail,
  LogIn,
  ArrowRight,
  X,
  Users,
  ShieldCheck,
  Calendar,
  LogOut,
  Layers,
  ChevronRight
} from 'lucide-react';
import { cleanAvatarUrl } from '../utils/avatarUtils';

/**
 * NavigationDrawer Component
 * 
 * Theme-matching left slide-in navigation drawer for AttendanceX.
 * Adheres strictly to the requested dark navy, deep violet & indigo palette:
 * - Drawer background: #0B0D22
 * - Secondary surface: #111432
 * - Border: rgba(139, 92, 246, 0.25)
 * - Primary accent: #8B5CF6
 * - Secondary accent: #6366F1
 * - Highlight: #A78BFA
 * - Main text: #F8FAFC
 * - Muted text: #AAB2CC
 */
export const NavigationDrawer = ({
  isOpen,
  onClose,
  user,
  onOpenAuth,
  onLogout,
  onToggleTimetable,
  showTimetable,
  onOpenSecurity,
}) => {
  const [activeItem, setActiveItem] = useState('home');

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background body scroll while drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Smooth scroll and action handler for navigation links
  const handleNavClick = (e, item) => {
    e.preventDefault();
    setActiveItem(item.id);
    onClose();

    if (item.action) {
      item.action();
      return;
    }

    if (item.href === '#' || item.href === '#home' || item.id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const targetId = item.href?.replace(/^#/, '');
    if (!targetId) return;

    // Check for exact element
    let targetEl = document.getElementById(targetId);

    // Contextual fallback targets without modifying other sections
    if (!targetEl) {
      if (targetId === 'features') {
        targetEl = document.getElementById('portals');
      } else if (targetId === 'notices') {
        if (onToggleTimetable && !showTimetable) {
          onToggleTimetable();
        }
        targetEl = document.getElementById('portals');
      } else if (targetId === 'about' || targetId === 'contact') {
        targetEl = document.querySelector('footer');
      }
    }

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const allNavLinks = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      href: '#home',
      desc: 'Smart Campus Overview',
      showInDashboards: true,
    },
    {
      id: 'notices',
      label: 'Notices',
      icon: Bell,
      href: '#notices',
      desc: 'Semester Timetable & Circulars',
      showInDashboards: true,
    },
    {
      id: 'about',
      label: 'About',
      icon: Info,
      href: '#about',
      desc: 'Smart Campus Platform',
      showInDashboards: false,
    },
    {
      id: 'contact',
      label: 'Contact',
      icon: Mail,
      href: '#contact',
      desc: 'Developer Inquiries & Support',
      showInDashboards: false,
    },
  ];

  // Remove About and Contact when user is logged into the 4 dashboards
  const navLinks = allNavLinks.filter((item) => !user || item.showInDashboards);

  return (
    <>
      {/* ─── Backdrop Overlay ─────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ─── Slide-in Left Drawer ─────────────────────────────────── */}
      <aside
        id="navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="AttendanceX Main Navigation"
        className={`fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85vw] sm:max-w-[340px] h-full bg-[#0B0D22] border-r border-[rgba(139,92,246,0.25)] shadow-[4px_0_35px_rgba(139,92,246,0.18)] flex flex-col justify-between transition-transform duration-300 ease-in-out will-change-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* TOP SECTION: Header & Navigation */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          
          {/* Drawer Header */}
          <div className="h-20 px-5 sm:px-6 flex items-center justify-between border-b border-[rgba(139,92,246,0.25)] shrink-0 bg-[#070A18]/60">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onClose();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-3 group focus:outline-none"
              title="AttendanceX"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6366F1] via-[#8B5CF6] to-[#A78BFA] flex items-center justify-center shadow-md shadow-[#8B5CF6]/30 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
                <Users className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-[#F8FAFC] flex items-center">
                  Attendance<span className="text-[#A78BFA]">X</span>
                </span>
                <p className="text-[9px] uppercase tracking-wider font-semibold text-[#AAB2CC]">
                  Smart Campus System
                </p>
              </div>
            </a>

            {/* Close 'X' Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#AAB2CC] hover:text-[#F8FAFC] hover:bg-[#111432] border border-transparent hover:border-[rgba(139,92,246,0.3)] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card (When Logged In) */}
          {user && (
            <div className="p-4 mx-4 mt-4 rounded-2xl bg-[#111432] border border-[rgba(139,92,246,0.25)] shadow-sm">
              <div className="flex items-center gap-3">
                <img
                  src={cleanAvatarUrl(user.avatar, user.name, null, user.role === 'faculty' || user.role === 'hod')}
                  alt={user.name}
                  className="w-10 h-10 rounded-full ring-2 ring-[#8B5CF6]/50 object-cover bg-slate-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#F8FAFC] truncate">
                    {user.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-[#8B5CF6]/20 text-[#A78BFA] border border-[rgba(139,92,246,0.3)]">
                      {user.role}
                    </span>
                    <span className="text-[10px] text-[#AAB2CC] truncate">
                      {user.department || 'Computer Dept'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Logged In User */}
              <div className="mt-3 pt-2.5 border-t border-[rgba(139,92,246,0.15)] flex items-center gap-2">
                {onOpenSecurity && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSecurity();
                    }}
                    className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-medium text-[#AAB2CC] hover:text-[#F8FAFC] bg-[#070A18]/60 hover:bg-[#070A18] border border-[rgba(139,92,246,0.2)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Security</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="py-1.5 px-3 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}

          {/* Navigation Links Section */}
          <div className="px-4 py-4 space-y-1">
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#AAB2CC]/70">
              Navigation
            </div>

            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`group flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#111432] text-[#A78BFA] border border-[rgba(139,92,246,0.35)] shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                      : 'text-[#AAB2CC] hover:text-[#F8FAFC] hover:bg-[#111432]/70 border border-transparent hover:border-[rgba(139,92,246,0.2)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-[#8B5CF6]/20 text-[#A78BFA]'
                          : 'bg-[#070A18]/80 text-[#AAB2CC] group-hover:text-[#A78BFA] group-hover:bg-[#8B5CF6]/15'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`font-semibold ${isActive ? 'text-[#F8FAFC]' : 'group-hover:text-[#F8FAFC]'}`}>
                        {item.label}
                      </div>
                      <div className="text-[11px] text-[#AAB2CC]/60 group-hover:text-[#AAB2CC]/90">
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isActive
                        ? 'text-[#8B5CF6] translate-x-0.5'
                        : 'text-[#AAB2CC]/30 group-hover:text-[#A78BFA] group-hover:translate-x-0.5'
                    }`}
                  />
                </a>
              );
            })}

            {/* Quick Timetable Toggle Item in Menu */}
            {onToggleTimetable && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onToggleTimetable();
                }}
                className="w-full group flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium text-[#AAB2CC] hover:text-[#F8FAFC] hover:bg-[#111432]/70 border border-transparent hover:border-[rgba(139,92,246,0.2)] transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-[#070A18]/80 text-[#AAB2CC] group-hover:text-[#A78BFA] group-hover:bg-[#8B5CF6]/15 transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold group-hover:text-[#F8FAFC]">
                      {showTimetable ? 'Hide Timetable' : 'Semester Timetable'}
                    </div>
                    <div className="text-[11px] text-[#AAB2CC]/60 group-hover:text-[#AAB2CC]/90">
                      Hall 209 & Lab Slots
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#A78BFA] border border-[rgba(139,92,246,0.25)]">
                  {showTimetable ? 'Active' : 'View'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION: Visually Distinct Actions & Footer Meta */}
        <div className="p-4 border-t border-[rgba(139,92,246,0.25)] bg-[#070A18]/40 space-y-3 shrink-0">
          
          {/* Action Buttons (Login & Get Started for Logged Out users) */}
          {!user ? (
            <div className="space-y-2">
              {/* Login Button - Secondary surface styling */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAuth) onOpenAuth('login');
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#111432] hover:bg-[#181c45] border border-[rgba(139,92,246,0.35)] text-[#F8FAFC] font-semibold text-sm transition-all duration-200 shadow-sm hover:border-[#8B5CF6] hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-[#A78BFA]" />
                <span>Login</span>
              </button>

              {/* Get Started Button - Primary Glowing Indigo/Violet Gradient */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAuth) {
                    onOpenAuth('signup');
                  } else {
                    const portals = document.getElementById('portals');
                    if (portals) portals.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#7C3AED] hover:from-[#5558E6] hover:to-[#6D28D9] text-white font-bold text-sm shadow-md shadow-[#8B5CF6]/25 hover:shadow-lg hover:shadow-[#8B5CF6]/40 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-[#AAB2CC] px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Connected as {user.role}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
              >
                Sign out
              </button>
            </div>
          )}

          {/* Operational Status Note */}
          <div className="pt-2 border-t border-[rgba(139,92,246,0.15)] flex items-center justify-between text-[11px] text-[#AAB2CC]/75">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Session 2026 Active</span>
            </span>
            <span>Computer Dept</span>
          </div>

        </div>
      </aside>
    </>
  );
};

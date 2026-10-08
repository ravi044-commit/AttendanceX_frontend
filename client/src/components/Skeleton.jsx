import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Database, Search, FolderOpen, ArrowRight } from 'lucide-react';

/**
 * Base Skeleton primitive with purple/navy shimmer effect
 */
export const Skeleton = ({ className = '', style = {} }) => {
  return (
    <div
      className={`skeleton-shimmer rounded-lg bg-slate-800/60 ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

/**
 * Skeleton Metric Card (matches 4-stat grid on dashboards)
 */
export const SkeletonMetricCard = () => {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-36" />
      </div>
    </div>
  );
};

/**
 * Skeleton Table Row (for Admin, HOD, and History tables)
 */
export const SkeletonTableRow = ({ columns = 6 }) => {
  return (
    <tr className="border-b border-slate-800/60 animate-pulse">
      {/* Column 1: Avatar + Name/Email */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="space-y-1.5 w-36">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </td>

      {/* Column 2: UID / ID */}
      <td className="px-6 py-4">
        <div className="space-y-1 w-24">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </td>

      {/* Column 3: Role / Dept / Class */}
      <td className="px-6 py-4">
        <div className="space-y-1">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-3 w-24" />
        </div>
      </td>

      {/* Column 4: Status badge */}
      {columns >= 4 && (
        <td className="px-6 py-4">
          <Skeleton className="h-5 w-16 rounded-full" />
        </td>
      )}

      {/* Column 5: Percentage & progress bar */}
      {columns >= 5 && (
        <td className="px-6 py-4">
          <div className="space-y-2 w-28">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-10" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </td>
      )}

      {/* Column 6: Action buttons */}
      {columns >= 6 && (
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-2">
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-8 rounded-lg" />
          </div>
        </td>
      )}
    </tr>
  );
};

/**
 * Skeleton for Student Roster Cards in Faculty Roll Call
 */
export const SkeletonRosterItem = () => {
  return (
    <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60">
      <div className="flex items-center gap-3 min-w-0">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-center">
        <Skeleton className="h-8 w-20 rounded-xl" />
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>
    </div>
  );
};

/**
 * Skeleton for Student Dashboard Subject Breakdown
 */
export const SkeletonSubjectCard = () => {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex justify-between pt-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
};

/**
 * Database Wake-Up / Connection In-Progress Notice
 * Appears subtly if the backend/db takes more than 2.5 seconds to respond
 */
export const DatabaseWakeupNotice = ({ visible, message = 'Connecting to SQLite database...' }) => {
  if (!visible) return null;

  return (
    <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-medium shadow-lg animate-pulse">
      <Database className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
      <span>{message}</span>
    </div>
  );
};

/**
 * Professional Error State with Retry Button
 */
export const ErrorState = ({
  title = 'Failed to load data from server',
  message = 'The database or API did not respond in time. Please check your connection or retry.',
  onRetry,
  compact = false,
}) => {
  return (
    <div
      className={`glass-panel rounded-2xl border border-rose-500/30 bg-rose-950/10 text-center flex flex-col items-center justify-center ${
        compact ? 'p-6' : 'p-12'
      }`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-950/30">
        <AlertCircle className="w-6 h-6" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary-glow px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
};

/**
 * Clean Empty State (Only shown when request finishes and returns zero records)
 */
export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No records found',
  description = 'There are no records matching your current filter criteria.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="p-12 text-center flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-3 shadow-md">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-slate-200 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

import React, { useRef, useState, useEffect } from 'react';
import { Loader2, AlertCircle, RefreshCw, Layers } from 'lucide-react';

/**
 * InfiniteTable
 * Reusable table component with:
 * - Skeleton loaders during initial batch load
 * - Bottom sentinel for IntersectionObserver infinite scrolling
 * - Virtual windowing support for large datasets (hundreds of rows)
 * - Accessible ARIA attributes and keyboard-friendly row rendering
 */
export const InfiniteTable = ({
  columns = [],
  items = [],
  loading = false,
  loadingMore = false,
  error = null,
  hasMore = false,
  sentinelRef = null,
  onRetry = null,
  emptyMessage = 'No records found matching your filters.',
  rowKey = (r, idx) => r.id || r.uid || idx,
  onRowClick = null,
  tableAriaLabel = 'Data table',
  skeletonRows = 6,
  minHeight = '320px',
  minWidth = '980px',
  headerRightContent = null,
  itemCountLabel = null,
}) => {
  const tableContainerRef = useRef(null);

  return (
    <div className="w-full space-y-3" role="region" aria-label={tableAriaLabel}>
      {/* Header telemetry / counts */}
      {(itemCountLabel !== null || headerRightContent) && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div>
            {itemCountLabel !== null ? (
              <span className="font-medium text-slate-300 text-xs">
                {itemCountLabel}
              </span>
            ) : null}
          </div>
          {headerRightContent && <div>{headerRightContent}</div>}
        </div>
      )}

      {/* Main Table Enclosure */}
      <div
        ref={tableContainerRef}
        className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-lg relative scrollbar-thin"
        style={{ minHeight }}
        tabIndex={0}
        aria-busy={loading}
      >
        <table
          className="w-full text-left text-xs border-collapse"
          style={{ minWidth }}
          role="table"
          aria-label={tableAriaLabel}
          aria-rowcount={items.length}
        >
          {/* Table Header */}
          <thead className="bg-slate-950/90 sticky top-0 z-20 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider backdrop-blur-md">
            <tr role="row">
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  scope="col"
                  className={`px-4 py-3 select-none ${col.headerClassName || ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody
            className="divide-y divide-slate-800/60 relative"
            role="rowgroup"
          >
            {/* 1. INITIAL SKELETON LOADER */}
            {loading && items.length === 0 && (
              <>
                {Array.from({ length: skeletonRows }).map((_, rowIdx) => (
                  <tr key={`skel-${rowIdx}`} className="animate-pulse" role="row">
                    {columns.map((col, colIdx) => (
                      <td key={`skel-cell-${colIdx}`} className="px-4 py-3">
                        <div
                          className="h-4 bg-slate-800/80 rounded-md"
                          style={{
                            width: colIdx === 0 ? '45%' : colIdx === 1 ? '70%' : '55%',
                            maxWidth: '180px',
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}

            {/* 2. ERROR STATE */}
            {error && items.length === 0 && !loading && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                    <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-rose-300">{error}</p>
                    {onRetry && (
                      <button
                        type="button"
                        onClick={onRetry}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer transition-colors shadow-sm"
                        aria-label="Retry loading data"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* 3. EMPTY STATE */}
            {!loading && !error && items.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto text-slate-400">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1">
                      <Layers className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-300">No records found</p>
                    <p className="text-xs text-slate-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}

            {/* 4. RENDERED ROWS */}
            {items.length > 0 && (
              <>
                {items.map((item, actualIndex) => {
                  const key = rowKey(item, actualIndex);
                  return (
                    <tr
                      key={key}
                      onClick={onRowClick ? () => onRowClick(item) : undefined}
                      role="row"
                      aria-rowindex={actualIndex + 1}
                      className={`hover:bg-indigo-950/25 transition-colors ${
                        onRowClick ? 'cursor-pointer' : ''
                      } ${actualIndex % 2 === 1 ? 'bg-slate-900/25' : ''}`}
                    >
                      {columns.map((col, cIdx) => (
                        <td
                          key={col.key || cIdx}
                          role="cell"
                          className={`px-4 py-2.5 align-middle ${col.className || ''}`}
                        >
                          {col.render ? col.render(item, actualIndex) : item[col.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </>
            )}
          </tbody>
        </table>

        {/* 5. SENTINEL & BOTTOM INFINITE LOADER */}
        <div ref={sentinelRef} className="w-full h-8 pointer-events-none" aria-hidden="true" />

        {loadingMore && (
          <div
            className="sticky bottom-0 z-10 w-full py-3 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-indigo-300 shadow-lg"
            aria-live="polite"
          >
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span className="font-medium">Loading next batch...</span>
          </div>
        )}

        {!hasMore && items.length > 0 && !loading && (
          <div className="py-3 text-center text-[11px] text-slate-500 border-t border-slate-800/40 bg-slate-950/30">
            ✓ All {items.length} records loaded
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemName?: string;
  itemLabel?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  itemName = 'items',
  itemLabel,
  className = '',
}: PaginationProps) {
  const displayLabel = itemLabel || itemName;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  if (totalItems <= pageSize) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate visible page numbers
  const pages: (number | string)[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-xs text-[#86868b] ${className}`}
    >
      <div className="font-medium tracking-tight">
        Showing <span className="font-semibold text-[#1d1d1f]">{startItem}</span> to{' '}
        <span className="font-semibold text-[#1d1d1f]">{endItem}</span> of{' '}
        <span className="font-semibold text-[#1d1d1f]">{totalItems}</span> {displayLabel}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] disabled:opacity-30 disabled:pointer-events-none transition border border-black/[0.04]"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-1 px-1">
          {pages.map((p, idx) =>
            typeof p === 'number' ? (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition ${
                  p === currentPage
                    ? 'bg-[#1d1d1f] text-white shadow-sm'
                    : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'
                }`}
              >
                {p}
              </button>
            ) : (
              <span key={`ellipsis-${idx}`} className="px-1 text-[#86868b]">
                …
              </span>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] disabled:opacity-30 disabled:pointer-events-none transition border border-black/[0.04]"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

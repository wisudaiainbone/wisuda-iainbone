'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function Pagination({ totalPages, currentPage, totalItems, itemsPerPage }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show before and after current
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift('...');
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-[var(--color-surface)] border-t border-[var(--color-border)] text-sm">
      <div className="text-[var(--color-text-muted)] text-center sm:text-left">
        Menampilkan <span className="font-medium text-[var(--color-text)]">{startItem}</span> - <span className="font-medium text-[var(--color-text)]">{endItem}</span> dari <span className="font-medium text-[var(--color-text)]">{totalItems}</span> data
      </div>

      <div className="flex flex-wrap justify-center items-center gap-1.5">
        <Link
          href={createPageURL(1)}
          className={`p-1.5 rounded-lg border border-[var(--color-border)] transition-colors ${currentPage <= 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-[var(--color-bg-secondary)]'}`}
          aria-label="First page"
        >
          <ChevronsLeft size={16} />
        </Link>
        <Link
          href={createPageURL(currentPage - 1)}
          className={`p-1.5 rounded-lg border border-[var(--color-border)] transition-colors ${currentPage <= 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-[var(--color-bg-secondary)]'}`}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </Link>

        {getVisiblePages().map((page, index) => {
          if (page === '...') {
            return (
              <span key={`dots-${index}`} className="px-2 text-[var(--color-text-muted)]">
                ...
              </span>
            );
          }

          const isCurrent = page === currentPage;
          return (
            <Link
              key={page}
              href={createPageURL(page)}
              className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition-colors ${
                isCurrent
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                  : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              {page}
            </Link>
          );
        })}

        <Link
          href={createPageURL(currentPage + 1)}
          className={`p-1.5 rounded-lg border border-[var(--color-border)] transition-colors ${currentPage >= totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-[var(--color-bg-secondary)]'}`}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </Link>
        <Link
          href={createPageURL(totalPages)}
          className={`p-1.5 rounded-lg border border-[var(--color-border)] transition-colors ${currentPage >= totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-[var(--color-bg-secondary)]'}`}
          aria-label="Last page"
        >
          <ChevronsRight size={16} />
        </Link>
      </div>
    </div>
  );
}

/**
 * Pagination Component
 *
 * @description Reusable pagination component with page numbers, prev/next buttons
 * @requirements 11.7 Support pagination with 20 invoices per page
 *
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   onPageChange={(page) => setCurrentPage(page)}
 * />
 * ```
 */

import { twMerge } from 'tailwind-merge';

export interface PaginationProps {
  /** Current active page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Number of page buttons to show (default: 5) */
  visiblePages?: number;
  /** Custom class name */
  className?: string;
  /** Disable all pagination controls */
  disabled?: boolean;
}

/**
 * Generates an array of page numbers to display
 * Shows ellipsis (...) when there are too many pages
 */
function getPageNumbers(
  currentPage: number,
  totalPages: number,
  visiblePages: number
): (number | 'ellipsis')[] {
  if (totalPages <= visiblePages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const halfVisible = Math.floor(visiblePages / 2);
  const pages: (number | 'ellipsis')[] = [];

  // Always show first page
  pages.push(1);

  let startPage = Math.max(2, currentPage - halfVisible);
  let endPage = Math.min(totalPages - 1, currentPage + halfVisible);

  // Adjust if we're near the start
  if (currentPage <= halfVisible + 1) {
    endPage = Math.min(visiblePages - 1, totalPages - 1);
  }

  // Adjust if we're near the end
  if (currentPage >= totalPages - halfVisible) {
    startPage = Math.max(2, totalPages - visiblePages + 2);
  }

  // Add ellipsis after first page if needed
  if (startPage > 2) {
    pages.push('ellipsis');
  }

  // Add middle pages
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  // Add ellipsis before last page if needed
  if (endPage < totalPages - 1) {
    pages.push('ellipsis');
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  visiblePages = 5,
  className,
  disabled = false,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = getPageNumbers(currentPage, totalPages, visiblePages);

  const handlePrevious = () => {
    if (currentPage > 1 && !disabled) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !disabled) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    if (!disabled && page !== currentPage) {
      onPageChange(page);
    }
  };

  const baseButtonClass =
    'min-w-touch min-h-touch flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';

  const navButtonClass = twMerge(
    baseButtonClass,
    'text-surface-700 bg-white border border-surface-300 hover:bg-surface-50',
    disabled && 'opacity-50 cursor-not-allowed hover:bg-white'
  );

  const pageButtonClass = (page: number) =>
    twMerge(
      baseButtonClass,
      page === currentPage
        ? 'bg-primary-500 text-white border border-primary-500'
        : 'text-surface-700 bg-white border border-surface-300 hover:bg-surface-50',
      disabled && 'opacity-50 cursor-not-allowed'
    );

  return (
    <nav
      className={twMerge('flex items-center justify-center gap-1', className)}
      aria-label="Pagination"
    >
      {/* Previous Button */}
      <button
        type="button"
        onClick={handlePrevious}
        disabled={disabled || currentPage === 1}
        className={twMerge(navButtonClass, currentPage === 1 && 'opacity-50 cursor-not-allowed')}
        aria-label="Previous page"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 py-2 text-surface-500"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => handlePageClick(page)}
              disabled={disabled}
              className={pageButtonClass(page)}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}
      </div>

      {/* Next Button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={disabled || currentPage === totalPages}
        className={twMerge(
          navButtonClass,
          currentPage === totalPages && 'opacity-50 cursor-not-allowed'
        )}
        aria-label="Next page"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}

export default Pagination;

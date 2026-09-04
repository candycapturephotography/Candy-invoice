/**
 * DataTable Component
 *
 * @description Generic table component with sortable columns and pagination
 * @requirements 11.1 Display a searchable list of all invoices with columns
 * @requirements 11.7 Support pagination with 20 invoices per page
 *
 * @example
 * ```tsx
 * const columns: ColumnDef<Invoice>[] = [
 *   { id: 'invoiceNumber', header: 'Invoice #', accessor: 'invoiceNumber', sortable: true },
 *   { id: 'customerName', header: 'Customer', accessor: (row) => row.customer.name, sortable: true },
 *   { id: 'status', header: 'Status', accessor: 'paymentStatus', render: (value) => <Badge>{value}</Badge> },
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={invoices}
 *   keyAccessor="id"
 *   pagination={{ currentPage: 1, totalPages: 10, onPageChange: setPage }}
 * />
 * ```
 */

import { useState, useCallback } from 'react';
import { twMerge } from 'tailwind-merge';
import { Pagination, type PaginationProps } from './Pagination';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  columnId: string | null;
  direction: SortDirection;
}

/**
 * Column definition for the data table
 */
export interface ColumnDef<T> {
  /** Unique column identifier */
  id: string;
  /** Column header text */
  header: string;
  /** Property key or function to access cell value */
  accessor: keyof T | ((row: T) => unknown);
  /** Whether the column is sortable (default: false) */
  sortable?: boolean;
  /** Custom render function for the cell */
  render?: (value: unknown, row: T, rowIndex: number) => React.ReactNode;
  /** Column width (CSS value) */
  width?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Custom class name for the column */
  className?: string;
  /** Custom header class name */
  headerClassName?: string;
}

export interface DataTableProps<T> {
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Data array to display */
  data: T[];
  /** Function to get unique key for each row */
  keyAccessor: keyof T | ((row: T) => string);
  /** Pagination configuration (optional) */
  pagination?: Omit<PaginationProps, 'className'>;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Callback when sort changes */
  onSortChange?: (sort: SortState) => void;
  /** Initial sort state */
  initialSort?: SortState;
  /** Callback when row is clicked */
  onRowClick?: (row: T, index: number) => void;
  /** Custom class name for the table container */
  className?: string;
  /** Custom class name for the table */
  tableClassName?: string;
  /** Whether rows are clickable (shows hover state) */
  clickableRows?: boolean;
  /** Striped rows */
  striped?: boolean;
  /** Compact mode (smaller padding) */
  compact?: boolean;
}

/**
 * Get the value from a row using an accessor
 */
function getAccessorValue<T>(row: T, accessor: keyof T | ((row: T) => unknown)): unknown {
  if (typeof accessor === 'function') {
    return accessor(row);
  }
  return row[accessor];
}

/**
 * Sort icon component
 */
function SortIcon({
  direction,
  active,
}: {
  direction: SortDirection;
  active: boolean;
}) {
  return (
    <span className={twMerge('ml-1 inline-flex', active ? 'text-primary-500' : 'text-surface-400')}>
      {direction === 'asc' ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      ) : direction === 'desc' ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      )}
    </span>
  );
}

/**
 * Loading spinner overlay
 */
function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
      <svg
        className="animate-spin h-8 w-8 text-primary-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={999} className="px-6 py-12 text-center">
        <div className="flex flex-col items-center gap-2">
          <svg
            className="w-12 h-12 text-surface-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-surface-500 text-sm">{message}</p>
        </div>
      </td>
    </tr>
  );
}

export function DataTable<T>({
  columns,
  data,
  keyAccessor,
  pagination,
  loading = false,
  emptyMessage = 'No data available',
  onSortChange,
  initialSort = { columnId: null, direction: null },
  onRowClick,
  className,
  tableClassName,
  clickableRows = false,
  striped = false,
  compact = false,
}: DataTableProps<T>) {
  const [sortState, setSortState] = useState<SortState>(initialSort);

  const getRowKey = useCallback(
    (row: T, index: number): string => {
      if (typeof keyAccessor === 'function') {
        return keyAccessor(row);
      }
      const value = row[keyAccessor];
      return String(value ?? index);
    },
    [keyAccessor]
  );

  const handleSort = useCallback(
    (columnId: string) => {
      let newDirection: SortDirection = 'asc';

      if (sortState.columnId === columnId) {
        if (sortState.direction === 'asc') {
          newDirection = 'desc';
        } else if (sortState.direction === 'desc') {
          newDirection = null;
        }
      }

      const newSortState: SortState = {
        columnId: newDirection ? columnId : null,
        direction: newDirection,
      };

      setSortState(newSortState);
      onSortChange?.(newSortState);
    },
    [sortState, onSortChange]
  );

  const handleRowClick = useCallback(
    (row: T, index: number) => {
      if (clickableRows || onRowClick) {
        onRowClick?.(row, index);
      }
    },
    [clickableRows, onRowClick]
  );

  const cellPadding = compact ? 'px-4 py-2' : 'px-6 py-4';
  const headerPadding = compact ? 'px-4 py-3' : 'px-6 py-4';

  const alignmentClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  return (
    <div className={twMerge('relative', className)}>
      {loading && <LoadingOverlay />}

      <div className="overflow-x-auto rounded-lg border border-surface-200">
        <table
          className={twMerge('min-w-full divide-y divide-surface-200 bg-white', tableClassName)}
        >
          <thead className="bg-surface-50">
            <tr>
              {columns.map((column) => {
                const isSortable = column.sortable;
                const isActive = sortState.columnId === column.id;

                return (
                  <th
                    key={column.id}
                    scope="col"
                    className={twMerge(
                      headerPadding,
                      'text-xs font-semibold uppercase tracking-wider text-surface-700',
                      alignmentClass(column.align),
                      isSortable && 'cursor-pointer select-none hover:bg-surface-100 transition-colors',
                      column.headerClassName
                    )}
                    style={{ width: column.width }}
                    onClick={isSortable ? () => handleSort(column.id) : undefined}
                    aria-sort={
                      isActive && sortState.direction
                        ? sortState.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <div className={twMerge('flex items-center', column.align === 'right' && 'justify-end', column.align === 'center' && 'justify-center')}>
                      {column.header}
                      {isSortable && (
                        <SortIcon
                          direction={isActive ? sortState.direction : null}
                          active={isActive}
                        />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {data.length === 0 ? (
              <EmptyState message={emptyMessage} />
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={getRowKey(row, rowIndex)}
                  className={twMerge(
                    'transition-colors',
                    striped && rowIndex % 2 === 1 && 'bg-surface-50',
                    (clickableRows || onRowClick) &&
                      'cursor-pointer hover:bg-primary-50/50 focus-within:bg-primary-50/50'
                  )}
                  onClick={() => handleRowClick(row, rowIndex)}
                  tabIndex={clickableRows || onRowClick ? 0 : undefined}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && (clickableRows || onRowClick)) {
                      e.preventDefault();
                      handleRowClick(row, rowIndex);
                    }
                  }}
                >
                  {columns.map((column) => {
                    const value = getAccessorValue(row, column.accessor);
                    const displayValue = column.render
                      ? column.render(value, row, rowIndex)
                      : String(value ?? '');

                    return (
                      <td
                        key={column.id}
                        className={twMerge(
                          cellPadding,
                          'text-sm text-surface-700 whitespace-nowrap',
                          alignmentClass(column.align),
                          column.className
                        )}
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
            visiblePages={pagination.visiblePages}
            disabled={pagination.disabled || loading}
          />
        </div>
      )}
    </div>
  );
}

export default DataTable;

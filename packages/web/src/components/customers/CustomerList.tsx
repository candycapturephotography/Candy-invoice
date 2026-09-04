/**
 * CandyCapture Photography Invoice Application
 * CustomerList Component
 *
 * Displays a list of customers with search functionality and invoice count.
 * Search triggers with 1+ characters and shows results within 500ms.
 *
 * @requirements 5.4 Search across Name and Mobile with 1+ character trigger
 * @requirements 5.9 Display invoice count for each customer
 * @requirements 19.2 Search results within 500ms
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { Customer } from '../../types/models';
import { DataTable, Input, Badge, LoadingSpinner } from '../ui';
import type { ColumnDef, SortState } from '../ui/DataTable';
import { cn } from '../../lib/utils';
import { formatDate } from '../../utils/date';

export interface CustomerListProps {
  /** Array of customers to display */
  customers: Customer[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Callback when a customer is selected/clicked */
  onCustomerSelect?: (customer: Customer) => void;
  /** Callback when edit is requested for a customer */
  onEdit?: (customer: Customer) => void;
  /** Callback when delete is requested for a customer */
  onDelete?: (customer: Customer) => void;
  /** Callback when search query changes */
  onSearch?: (query: string) => void;
  /** Search debounce delay in ms (default: 300ms to ensure results within 500ms) */
  searchDebounceMs?: number;
  /** Additional CSS classes */
  className?: string;
  /** Empty state message */
  emptyMessage?: string;
}

/**
 * CustomerList Component
 *
 * Provides a searchable list of customers with:
 * - Search with 1+ character trigger
 * - Results displayed within 500ms of typing
 * - Invoice count for each customer
 * - Sort by name, mobile, or event date
 */
export function CustomerList({
  customers,
  isLoading = false,
  onCustomerSelect,
  onEdit,
  onDelete,
  onSearch,
  searchDebounceMs = 300,
  className,
  emptyMessage = 'No customers found',
}: CustomerListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sort state
  const [sortState, setSortState] = useState<SortState>({
    columnId: 'name',
    direction: 'asc',
  });

  /**
   * Handle search input change with debounce
   * @requirements 5.4 Search triggers with 1+ character
   * @requirements 19.2 Results within 500ms
   */
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce the search callback
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedQuery(query);
        // Trigger search with 1+ characters
        if (query.length >= 1 || query === '') {
          onSearch?.(query);
        }
      }, searchDebounceMs);
    },
    [onSearch, searchDebounceMs]
  );

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  /**
   * Filter and sort customers based on search and sort state
   */
  const filteredAndSortedCustomers = useMemo(() => {
    let result = [...customers];

    // Filter by search query (1+ characters)
    if (debouncedQuery.length >= 1) {
      const searchLower = debouncedQuery.toLowerCase();
      result = result.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchLower) ||
          customer.mobile.includes(searchLower)
      );
    }

    // Sort
    if (sortState.columnId && sortState.direction) {
      result.sort((a, b) => {
        let aVal: string | number = '';
        let bVal: string | number = '';

        switch (sortState.columnId) {
          case 'name':
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case 'mobile':
            aVal = a.mobile;
            bVal = b.mobile;
            break;
          case 'eventDate':
            aVal = new Date(a.eventDate).getTime();
            bVal = new Date(b.eventDate).getTime();
            break;
          case 'invoiceCount':
            aVal = a.invoiceCount;
            bVal = b.invoiceCount;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortState.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortState.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [customers, debouncedQuery, sortState]);

  /**
   * Handle sort change
   */
  const handleSortChange = useCallback((newSort: SortState) => {
    setSortState(newSort);
  }, []);

  /**
   * Column definitions for the DataTable
   */
  const columns: ColumnDef<Customer>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessor: 'name',
        sortable: true,
        render: (value, row) => (
          <div className="flex flex-col">
            <span className="font-medium text-surface-900">{value as string}</span>
            {row.email && (
              <span className="text-xs text-surface-500">{row.email}</span>
            )}
          </div>
        ),
      },
      {
        id: 'mobile',
        header: 'Mobile',
        accessor: 'mobile',
        sortable: true,
        render: (value) => (
          <span className="font-mono text-surface-700">{value as string}</span>
        ),
      },
      {
        id: 'eventType',
        header: 'Event',
        accessor: 'eventType',
        render: (value) => (
          <span className="text-surface-700">{value as string}</span>
        ),
      },
      {
        id: 'eventDate',
        header: 'Event Date',
        accessor: 'eventDate',
        sortable: true,
        render: (value) => (
          <span className="text-surface-700">{formatDate(value as string)}</span>
        ),
      },
      {
        id: 'location',
        header: 'Location',
        accessor: 'location',
        render: (value) => (
          <span className="text-surface-600 truncate max-w-[200px] block">
            {value as string}
          </span>
        ),
      },
      {
        id: 'invoiceCount',
        header: 'Invoices',
        accessor: 'invoiceCount',
        sortable: true,
        align: 'center',
        render: (value) => (
          <Badge
            variant={value === 0 ? 'default' : 'paid'}
            size="sm"
          >
            {value as number}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        accessor: () => null,
        align: 'right',
        render: (_, row) => (
          <div className="flex items-center justify-end gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(row);
                }}
                className={cn(
                  'p-1.5 rounded-md text-surface-500 transition-colors',
                  'hover:bg-surface-100 hover:text-primary-600',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500'
                )}
                aria-label={`Edit ${row.name}`}
                title="Edit customer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(row);
                }}
                className={cn(
                  'p-1.5 rounded-md text-surface-500 transition-colors',
                  'hover:bg-red-50 hover:text-red-600',
                  'focus:outline-none focus:ring-2 focus:ring-red-500'
                )}
                aria-label={`Delete ${row.name}`}
                title="Delete customer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        ),
      },
    ],
    [onEdit, onDelete]
  );

  /**
   * Handle row click
   */
  const handleRowClick = useCallback(
    (customer: Customer) => {
      onCustomerSelect?.(customer);
    },
    [onCustomerSelect]
  );

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Search Input */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search by name or mobile..."
            value={searchQuery}
            onChange={handleSearchChange}
            disabled={isLoading}
            leftIcon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
            helperText={
              searchQuery.length >= 1
                ? `Showing ${filteredAndSortedCustomers.length} of ${customers.length} customers`
                : undefined
            }
          />
        </div>

        {/* Loading indicator for search */}
        {isLoading && (
          <LoadingSpinner size="sm" className="text-primary-500" />
        )}
      </div>

      {/* Customer Table */}
      <DataTable
        columns={columns}
        data={filteredAndSortedCustomers}
        keyAccessor="id"
        loading={isLoading}
        emptyMessage={
          searchQuery.length >= 1
            ? `No customers found matching "${searchQuery}"`
            : emptyMessage
        }
        onSortChange={handleSortChange}
        initialSort={sortState}
        onRowClick={onCustomerSelect ? handleRowClick : undefined}
        clickableRows={!!onCustomerSelect}
        striped
      />

      {/* Results summary */}
      {!isLoading && customers.length > 0 && (
        <div className="text-sm text-surface-500 text-center">
          {searchQuery.length >= 1 ? (
            <>
              Showing {filteredAndSortedCustomers.length} of {customers.length} customers
            </>
          ) : (
            <>Total: {customers.length} customer{customers.length !== 1 ? 's' : ''}</>
          )}
        </div>
      )}
    </div>
  );
}

export default CustomerList;

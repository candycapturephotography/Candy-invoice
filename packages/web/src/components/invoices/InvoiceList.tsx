/**
 * InvoiceList Component
 *
 * @description Searchable, filterable list of invoices with pagination.
 *
 * @requirements 11.1 Display columns: Invoice Number, Customer Name, Event, Event Date, Total, Advance, Balance, Status, Dates
 * @requirements 11.2 Search by Invoice Number and Customer Name
 * @requirements 11.3 Clear search returns to filtered results
 * @requirements 11.4 Payment Status filter (All, Pending, Partially Paid, Paid)
 * @requirements 11.5 Date range filters (From Date, To Date)
 * @requirements 11.6 Search/filter results within 500ms
 * @requirements 11.7 Pagination with 20 items per page
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Input,
  Select,
  DatePicker,
  Pagination,
  LoadingSpinner,
  PaymentStatusBadge,
} from '../ui';
import { getInvoices, type InvoiceQueryOptions, type PaginatedInvoiceResult } from '../../services/invoiceService';
import { customerService } from '../../services/customerService';
import type { Invoice, Customer, PaymentStatus } from '../../types';
import { formatIndianCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';

export interface InvoiceListProps {
  /** Callback when an invoice is selected for viewing */
  onView: (invoice: Invoice) => void;
  /** Callback when an invoice is selected for editing */
  onEdit: (invoice: Invoice) => void;
  /** Callback when print is requested */
  onPrint: (invoice: Invoice) => void;
  /** Callback when PDF download is requested */
  onDownloadPdf: (invoice: Invoice) => void;
  /** Callback when duplicate is requested */
  onDuplicate: (invoice: Invoice) => void;
  /** Initial status filter */
  initialStatusFilter?: PaymentStatus | 'ALL';
}

interface FilterState {
  search: string;
  status: PaymentStatus | 'ALL';
  fromDate: string;
  toDate: string;
}

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { value: 'PAID', label: 'Paid' },
];

export function InvoiceList({
  onView,
  onEdit,
  onPrint,
  onDownloadPdf,
  onDuplicate,
  initialStatusFilter = 'ALL',
}: InvoiceListProps) {
  // State
  const [result, setResult] = useState<PaginatedInvoiceResult | null>(null);
  const [customers, setCustomers] = useState<Map<string, Customer>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: initialStatusFilter,
    fromDate: '',
    toDate: '',
  });

  // Refs for debouncing
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load invoices with current filters
  const loadInvoices = useCallback(
    async (page: number = 1) => {
      setIsLoading(true);
      setError(null);

      try {
        const options: InvoiceQueryOptions = {
          page,
          pageSize: PAGE_SIZE,
          search: filters.search || undefined,
          status: filters.status !== 'ALL' ? filters.status : undefined,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
        };

        const invoiceResult = await getInvoices(options);
        setResult(invoiceResult);

        // Load customer data for the invoices
        const customerIds = [...new Set(invoiceResult.items.map((inv) => inv.customerId))];
        const customerMap = new Map<string, Customer>();

        await Promise.all(
          customerIds.map(async (id) => {
            const customer = await customerService.getCustomerById(id);
            if (customer) {
              customerMap.set(id, customer);
            }
          })
        );

        setCustomers(customerMap);
      } catch (err) {
        console.error('Failed to load invoices:', err);
        setError('Failed to load invoices. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

  // Initial load and filter changes
  useEffect(() => {
    loadInvoices(currentPage);
  }, [currentPage, loadInvoices]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.fromDate, filters.toDate]);

  // Debounced search (within 500ms requirement)
  const handleSearchChange = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setFilters((prev) => ({ ...prev, search: value }));

    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
    }, 300);
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback(
    <K extends keyof FilterState>(field: K, value: FilterState[K]) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'ALL',
      fromDate: '',
      toDate: '',
    });
    setCurrentPage(1);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Get customer name for an invoice
  const getCustomerName = useCallback(
    (customerId: string): string => {
      const customer = customers.get(customerId);
      return customer?.name || 'Unknown Customer';
    },
    [customers]
  );

  // Get customer for an invoice
  const getCustomer = useCallback(
    (customerId: string): Customer | undefined => {
      return customers.get(customerId);
    },
    [customers]
  );

  // Check if any filters are active
  const hasActiveFilters = useMemo(
    () =>
      filters.search !== '' ||
      filters.status !== 'ALL' ||
      filters.fromDate !== '' ||
      filters.toDate !== '',
    [filters]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-surface-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <Input
            placeholder="Search invoice # or customer..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            fullWidth
            leftIcon={
              <svg
                className="w-4 h-4 text-surface-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
          />

          {/* Status Filter */}
          <Select
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={(e) =>
              handleFilterChange('status', e.target.value as PaymentStatus | 'ALL')
            }
            fullWidth
          />

          {/* From Date */}
          <DatePicker
            placeholder="From Date"
            value={filters.fromDate}
            onChange={(e) => handleFilterChange('fromDate', e.target.value)}
            max={filters.toDate || undefined}
            fullWidth
          />

          {/* To Date */}
          <DatePicker
            placeholder="To Date"
            value={filters.toDate}
            onChange={(e) => handleFilterChange('toDate', e.target.value)}
            min={filters.fromDate || undefined}
            fullWidth
          />
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => loadInvoices(currentPage)}
            className="mt-2 text-sm text-red-700 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Invoice Table */}
      {!isLoading && result && (
        <>
          {result.items.length === 0 ? (
            <div className="bg-white rounded-lg border border-surface-200 p-12 text-center">
              <svg
                className="w-12 h-12 text-surface-300 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-surface-600">
                {hasActiveFilters
                  ? 'No invoices match your filters.'
                  : 'No invoices yet. Create your first invoice to get started.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-surface-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                        Invoice #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                        Event Date
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">
                        Advance
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-surface-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                        Invoice Date
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {result.items.map((invoice) => {
                      const customer = getCustomer(invoice.customerId);
                      return (
                        <tr
                          key={invoice.id}
                          className="hover:bg-surface-50 cursor-pointer"
                          onClick={() => onView(invoice)}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-primary-600">
                            {invoice.invoiceNumber}
                          </td>
                          <td className="px-4 py-3 text-sm text-surface-900">
                            {getCustomerName(invoice.customerId)}
                          </td>
                          <td className="px-4 py-3 text-sm text-surface-600">
                            {customer?.eventType || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-surface-600">
                            {customer?.eventDate ? formatDate(customer.eventDate) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-surface-900 text-right font-medium">
                            {formatIndianCurrency(invoice.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-surface-600 text-right">
                            {formatIndianCurrency(invoice.advancePaid)}
                          </td>
                          <td className="px-4 py-3 text-sm text-surface-900 text-right font-medium">
                            {formatIndianCurrency(invoice.balanceDue)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <PaymentStatusBadge status={invoice.paymentStatus} size="sm" />
                          </td>
                          <td className="px-4 py-3 text-sm text-surface-600">
                            {formatDate(invoice.invoiceDate)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div
                              className="flex justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => onEdit(invoice)}
                                className="p-1.5 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded transition-colors"
                                title="Edit"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => onPrint(invoice)}
                                className="p-1.5 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded transition-colors"
                                title="Print"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDownloadPdf(invoice)}
                                className="p-1.5 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded transition-colors"
                                title="Download PDF"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDuplicate(invoice)}
                                className="p-1.5 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded transition-colors"
                                title="Duplicate"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {result.totalPages > 1 && (
                <div className="px-4 py-3 border-t border-surface-100">
                  <Pagination
                    currentPage={result.page}
                    totalPages={result.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default InvoiceList;

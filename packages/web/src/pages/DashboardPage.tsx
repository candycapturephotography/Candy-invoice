/**
 * Dashboard Page Component
 *
 * @description Main dashboard displaying business metrics, recent invoices,
 * and payment status quick links. Implements requirements 10.1-10.12.
 *
 * @requirements 10.1 Total invoice count
 * @requirements 10.2 Total customer count
 * @requirements 10.3 Total Invoice Value in Indian Rupee format
 * @requirements 10.4 Total Advance Received in Indian Rupee format
 * @requirements 10.5 Total Balance Pending in Indian Rupee format
 * @requirements 10.6 Counts by Payment Status
 * @requirements 10.7 Recent invoices widget (10 most recent)
 * @requirements 10.8 Status quick links to filtered invoice list
 * @requirements 10.9 Update metrics within 2 seconds of sync
 * @requirements 10.10 Load metrics within 2 seconds
 * @requirements 10.11 Show zero values for new accounts
 * @requirements 10.12 Handle loading errors with retry
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Invoice, PaymentStatus } from '../types';
import { getInvoiceStats, getRecentInvoices, type InvoiceStats } from '../services/invoiceService';
import { customerService } from '../services/customerService';
import { formatIndianCurrency } from '../utils/currency';
import { LoadingSpinner, Skeleton } from '../components/ui/LoadingSpinner';
import { PaymentStatusBadge } from '../components/ui/Badge';

/**
 * Dashboard metrics state
 */
interface DashboardMetrics {
  invoiceStats: InvoiceStats;
  customerCount: number;
  recentInvoices: Invoice[];
  recentInvoicesWithCustomers: Array<Invoice & { customerName: string }>;
}

/**
 * Dashboard loading/error state
 */
interface DashboardState {
  isLoading: boolean;
  error: string | null;
  metrics: DashboardMetrics | null;
  lastUpdated: Date | null;
}

/**
 * Metric card component for displaying a single metric
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  isLoading?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

function MetricCard({
  title,
  value,
  icon,
  isLoading = false,
  onClick,
  variant = 'default',
}: MetricCardProps) {
  const variantStyles = {
    default: 'bg-white border-surface-200',
    primary: 'bg-primary-50 border-primary-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-orange-50 border-orange-200',
  };

  const iconVariantStyles = {
    default: 'bg-surface-100 text-surface-600',
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-orange-100 text-orange-600',
  };

  const valueVariantStyles = {
    default: 'text-surface-900',
    primary: 'text-primary-700',
    success: 'text-green-700',
    warning: 'text-yellow-700',
    danger: 'text-orange-700',
  };

  const baseClasses = `rounded-lg border p-4 shadow-sm transition-all ${variantStyles[variant]}`;
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
    : '';

  return (
    <div
      className={`${baseClasses} ${interactiveClasses}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-surface-600">{title}</p>
          {isLoading ? (
            <Skeleton width="80%" height="2rem" className="mt-1" />
          ) : (
            <p className={`mt-1 text-2xl font-bold ${valueVariantStyles[variant]}`}>
              {value}
            </p>
          )}
        </div>
        <div className={`rounded-lg p-2 ${iconVariantStyles[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/**
 * Status quick link card component
 */
interface StatusQuickLinkProps {
  status: PaymentStatus;
  count: number;
  isLoading?: boolean;
  onClick: () => void;
}

function StatusQuickLink({ status, count, isLoading = false, onClick }: StatusQuickLinkProps) {
  const statusConfig: Record<
    PaymentStatus,
    { label: string; bgColor: string; textColor: string; hoverBg: string }
  > = {
    PENDING: {
      label: 'Pending',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      hoverBg: 'hover:bg-orange-100',
    },
    PARTIALLY_PAID: {
      label: 'Partially Paid',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      hoverBg: 'hover:bg-yellow-100',
    },
    PAID: {
      label: 'Paid',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      hoverBg: 'hover:bg-green-100',
    },
  };

  const config = statusConfig[status];

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-lg border p-4 transition-all ${config.bgColor} ${config.hoverBg} hover:shadow-md active:scale-[0.98]`}
      aria-label={`View ${config.label} invoices`}
    >
      {isLoading ? (
        <Skeleton width="3rem" height="2.5rem" className="mb-1" />
      ) : (
        <span className={`text-3xl font-bold ${config.textColor}`}>{count}</span>
      )}
      <span className={`text-sm font-medium ${config.textColor}`}>{config.label}</span>
    </button>
  );
}

/**
 * Recent invoices widget component
 * @see Requirement 10.7 Display 10 most recent invoices
 */
interface RecentInvoicesWidgetProps {
  invoices: Array<Invoice & { customerName: string }>;
  isLoading: boolean;
  onInvoiceClick: (invoiceId: string) => void;
}

function RecentInvoicesWidget({
  invoices,
  isLoading,
  onInvoiceClick,
}: RecentInvoicesWidgetProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-surface-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-surface-900">Recent Invoices</h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex-1 space-y-1">
                <Skeleton width="30%" height="1rem" />
                <Skeleton width="50%" height="0.875rem" />
              </div>
              <Skeleton width="5rem" height="1.5rem" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state for new accounts - Requirement 10.11
  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border border-surface-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-surface-900">Recent Invoices</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 rounded-full bg-surface-100 p-3">
            <svg
              className="h-8 w-8 text-surface-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-surface-600">No invoices yet</p>
          <p className="mt-1 text-sm text-surface-500">
            Create your first invoice to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-surface-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-surface-900">Recent Invoices</h3>
      <div className="divide-y divide-surface-100">
        {invoices.map((invoice) => (
          <button
            key={invoice.id}
            onClick={() => onInvoiceClick(invoice.id)}
            className="flex w-full items-center justify-between py-3 text-left transition-colors hover:bg-surface-50"
            aria-label={`View invoice ${invoice.invoiceNumber}`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-primary-600">
                  {invoice.invoiceNumber}
                </span>
                <PaymentStatusBadge status={invoice.paymentStatus} size="sm" />
              </div>
              <p className="mt-0.5 truncate text-sm text-surface-600">
                {invoice.customerName}
              </p>
            </div>
            <div className="ml-4 text-right">
              <p className="font-semibold text-surface-900">
                {formatIndianCurrency(invoice.totalAmount)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Error state component with retry button
 * @see Requirement 10.12 Handle loading errors with retry
 */
interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center">
      <div className="mb-4 rounded-full bg-red-100 p-3">
        <svg
          className="h-8 w-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-red-700">
        Failed to load dashboard
      </h3>
      <p className="mb-4 text-sm text-red-600">{error}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Retry
      </button>
    </div>
  );
}

/**
 * Dashboard Page Component
 *
 * Main dashboard displaying business metrics and recent invoices.
 * Loads data within 2 seconds and updates on sync completion.
 *
 * @see Requirements 10.1-10.12
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<DashboardState>({
    isLoading: true,
    error: null,
    metrics: null,
    lastUpdated: null,
  });

  /**
   * Loads all dashboard metrics
   * @see Requirement 10.10 Load metrics within 2 seconds
   */
  const loadDashboardData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Load all data in parallel for performance
      const [invoiceStats, customersResult, recentInvoices] = await Promise.all([
        getInvoiceStats(),
        customerService.getCustomers({ page: 1, pageSize: 1 }),
        getRecentInvoices(10),
      ]);

      // Fetch customer names for recent invoices
      const recentInvoicesWithCustomers = await Promise.all(
        recentInvoices.map(async (invoice) => {
          const customer = await customerService.getCustomerById(invoice.customerId);
          return {
            ...invoice,
            customerName: customer?.name ?? 'Unknown Customer',
          };
        })
      );

      setState({
        isLoading: false,
        error: null,
        metrics: {
          invoiceStats,
          customerCount: customersResult.totalCount,
          recentInvoices,
          recentInvoicesWithCustomers,
        },
        lastUpdated: new Date(),
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load dashboard data',
      }));
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  /**
   * Handle navigation to filtered invoice list
   * @see Requirement 10.8 Status quick links navigation
   */
  const handleStatusClick = useCallback(
    (status: PaymentStatus) => {
      navigate(`/invoices?status=${status}`);
    },
    [navigate]
  );

  /**
   * Handle navigation to invoice detail
   * @see Requirement 10.7 Link to invoice detail view
   */
  const handleInvoiceClick = useCallback(
    (invoiceId: string) => {
      navigate(`/invoices/${invoiceId}`);
    },
    [navigate]
  );

  // Icons for metric cards
  const InvoiceIcon = () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );

  const CustomerIcon = () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );

  const CurrencyIcon = () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  const AdvanceIcon = () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  );

  const BalanceIcon = () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  // Show error state with retry - Requirement 10.12
  if (state.error && !state.metrics) {
    return (
      <div className="min-h-screen bg-surface-50 p-4 md:p-6 lg:p-8">
        <ErrorState error={state.error} onRetry={loadDashboardData} />
      </div>
    );
  }

  const { metrics, isLoading } = state;

  // Extract values with defaults for empty state - Requirement 10.11
  const invoiceCount = metrics?.invoiceStats.totalInvoices ?? 0;
  const customerCount = metrics?.customerCount ?? 0;
  const totalValue = metrics?.invoiceStats.totalValue ?? 0;
  const totalAdvance = metrics?.invoiceStats.totalAdvance ?? 0;
  const totalBalance = metrics?.invoiceStats.totalBalance ?? 0;
  const statusCounts = metrics?.invoiceStats.countByStatus ?? {
    PENDING: 0,
    PARTIALLY_PAID: 0,
    PAID: 0,
  };
  const recentInvoices = metrics?.recentInvoicesWithCustomers ?? [];

  return (
    <div className="min-h-screen bg-surface-50 p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-surface-600">
            Overview of your business metrics
          </p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-surface-500">
            <LoadingSpinner size="sm" variant="primary" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {/* Main Metrics Grid - Requirements 10.1-10.5 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Invoices - Requirement 10.1 */}
        <MetricCard
          title="Total Invoices"
          value={invoiceCount}
          icon={<InvoiceIcon />}
          isLoading={isLoading}
          variant="primary"
        />

        {/* Total Customers - Requirement 10.2 */}
        <MetricCard
          title="Total Customers"
          value={customerCount}
          icon={<CustomerIcon />}
          isLoading={isLoading}
        />

        {/* Total Invoice Value - Requirement 10.3 */}
        <MetricCard
          title="Total Invoice Value"
          value={formatIndianCurrency(totalValue)}
          icon={<CurrencyIcon />}
          isLoading={isLoading}
        />

        {/* Total Advance Received - Requirement 10.4 */}
        <MetricCard
          title="Total Advance Received"
          value={formatIndianCurrency(totalAdvance)}
          icon={<AdvanceIcon />}
          isLoading={isLoading}
          variant="success"
        />

        {/* Total Balance Pending - Requirement 10.5 */}
        <MetricCard
          title="Total Balance Pending"
          value={formatIndianCurrency(totalBalance)}
          icon={<BalanceIcon />}
          isLoading={isLoading}
          variant={totalBalance > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* Status Quick Links and Recent Invoices */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Status Quick Links - Requirement 10.6, 10.8 */}
        <div className="lg:col-span-1">
          <h3 className="mb-4 text-lg font-semibold text-surface-900">
            Invoices by Status
          </h3>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <StatusQuickLink
              status="PENDING"
              count={statusCounts.PENDING}
              isLoading={isLoading}
              onClick={() => handleStatusClick('PENDING')}
            />
            <StatusQuickLink
              status="PARTIALLY_PAID"
              count={statusCounts.PARTIALLY_PAID}
              isLoading={isLoading}
              onClick={() => handleStatusClick('PARTIALLY_PAID')}
            />
            <StatusQuickLink
              status="PAID"
              count={statusCounts.PAID}
              isLoading={isLoading}
              onClick={() => handleStatusClick('PAID')}
            />
          </div>
        </div>

        {/* Recent Invoices Widget - Requirement 10.7 */}
        <div className="lg:col-span-2">
          <RecentInvoicesWidget
            invoices={recentInvoices}
            isLoading={isLoading}
            onInvoiceClick={handleInvoiceClick}
          />
        </div>
      </div>

      {/* Show error banner if error occurred during refresh */}
      {state.error && metrics && (
        <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-sm font-medium text-yellow-700">
              Failed to update metrics: {state.error}
            </span>
            <button
              onClick={loadDashboardData}
              className="ml-auto text-sm font-medium text-yellow-700 underline hover:text-yellow-800"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;

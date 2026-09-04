/**
 * InvoicesPage Component
 *
 * @description Main page for invoice management including list, create, edit, and view modes.
 *
 * @requirements 8.1-8.13 Invoice creation workflow
 * @requirements 11.1-11.11 Invoice list and management
 * @requirements 11.10 Invoice duplication
 */

import { useState, useCallback } from 'react';
import {
  InvoiceForm,
  InvoiceList,
  InvoiceView,
  type InvoiceFormData,
} from '../components/invoices';
import { useToast, ConfirmModal } from '../components/ui';
import {
  saveInvoice,
  deleteInvoice,
} from '../services/invoiceService';
import { customerService } from '../services/customerService';
import type { Invoice, Customer, PaymentStatus } from '../types';
import { getTodayISO, calculateDueDate } from '../utils/date';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

interface InvoicesPageProps {
  /** Initial status filter from navigation */
  initialStatusFilter?: PaymentStatus | 'ALL';
}

export function InvoicesPage({ initialStatusFilter }: InvoicesPageProps) {
  const { showToast } = useToast();
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [prefillCustomer, setPrefillCustomer] = useState<Customer | undefined>();
  const [duplicateInvoice, setDuplicateInvoice] = useState<Invoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Navigation helpers
  const goToList = useCallback(() => {
    setViewMode('list');
    setSelectedInvoice(null);
    setPrefillCustomer(undefined);
    setDuplicateInvoice(null);
    setRefreshKey((k) => k + 1);
  }, []);

  const goToCreate = useCallback(() => {
    setViewMode('create');
    setSelectedInvoice(null);
    setDuplicateInvoice(null);
  }, []);

  const goToEdit = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewMode('edit');
  }, []);

  const goToView = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewMode('view');
  }, []);

  // Handle form submission (create/update)
  const handleSubmit = useCallback(
    async (formData: InvoiceFormData) => {
      if (!formData.customer) {
        showToast('Customer is required', 'error');
        return;
      }

      setIsSubmitting(true);
      try {
        const isEditing = viewMode === 'edit' && selectedInvoice;

        // Prepare invoice data
        const invoiceData: Invoice = {
          id: isEditing ? selectedInvoice.id : crypto.randomUUID(),
          invoiceNumber: formData.invoiceNumber,
          customerId: formData.customer.id,
          invoiceDate: formData.invoiceDate,
          dueDate: formData.dueDate,
          services: formData.services,
          totalAmount: formData.totalAmount,
          advancePaid: formData.advancePaid,
          balanceDue: 0, // Will be calculated by saveInvoice
          paymentStatus: 'PENDING', // Will be calculated by saveInvoice
          payments: isEditing ? selectedInvoice.payments : [],
          notes: formData.notes || undefined,
          createdAt: isEditing ? selectedInvoice.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending',
        };

        // If editing and advance paid changed, create/update payment
        if (isEditing) {
          // Keep existing payments, the form already has them
          invoiceData.payments = selectedInvoice.payments;
        } else if (formData.advancePaid > 0) {
          // New invoice with advance - create initial payment
          invoiceData.payments = [
            {
              id: crypto.randomUUID(),
              amount: formData.advancePaid,
              paymentDate: formData.invoiceDate,
              createdAt: new Date().toISOString(),
            },
          ];
        }

        const savedInvoice = await saveInvoice(invoiceData);

        // Update customer invoice count
        await customerService.updateCustomerInvoiceCount(formData.customer.id);

        showToast(
          `Invoice ${savedInvoice.invoiceNumber} has been ${isEditing ? 'updated' : 'created'}.`,
          'success'
        );

        // Navigate to view the saved invoice
        goToView(savedInvoice);
      } catch (error) {
        console.error('Failed to save invoice:', error);
        showToast('Failed to save invoice. Please try again.', 'error');
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [viewMode, selectedInvoice, showToast, goToView]
  );

  // Handle invoice view
  const handleViewInvoice = useCallback((invoice: Invoice) => {
    goToView(invoice);
  }, [goToView]);

  // Handle invoice edit
  const handleEditInvoice = useCallback((invoice: Invoice) => {
    goToEdit(invoice);
  }, [goToEdit]);

  // Handle invoice update from view (e.g., after payment)
  const handleInvoiceUpdated = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
  }, []);

  // Handle print
  const handlePrint = useCallback((_invoice: Invoice) => {
    // TODO: Implement PDF generation and print
    showToast('Print functionality will be available in the PDF generation phase.', 'info');
  }, [showToast]);

  // Handle PDF download
  const handleDownloadPdf = useCallback((_invoice: Invoice) => {
    // TODO: Implement PDF generation and download
    showToast('PDF download will be available in the PDF generation phase.', 'info');
  }, [showToast]);

  // Handle duplicate - Requirements 11.10
  const handleDuplicate = useCallback(
    async (invoice: Invoice) => {
      try {
        // Load customer for the duplicate
        const customer = await customerService.getCustomerById(invoice.customerId);

        // Set up duplicate with reset values
        setDuplicateInvoice(invoice);
        setPrefillCustomer(customer);
        setViewMode('create');

        showToast(
          'Creating new invoice from template. Invoice number, dates, and advance will be reset.',
          'info'
        );
      } catch (error) {
        console.error('Failed to prepare duplicate:', error);
        showToast('Failed to duplicate invoice. Please try again.', 'error');
      }
    },
    [showToast]
  );

  // Handle delete
  const handleConfirmDelete = useCallback(async () => {
    if (!invoiceToDelete) return;

    setIsSubmitting(true);
    try {
      await deleteInvoice(invoiceToDelete.id);

      // Update customer invoice count
      await customerService.updateCustomerInvoiceCount(invoiceToDelete.customerId);

      showToast(`Invoice ${invoiceToDelete.invoiceNumber} has been deleted.`, 'success');

      setShowDeleteConfirm(false);
      setInvoiceToDelete(null);
      goToList();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      showToast('Failed to delete invoice. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [invoiceToDelete, showToast, goToList]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">
            {viewMode === 'list' && 'Invoices'}
            {viewMode === 'create' && (duplicateInvoice ? 'Duplicate Invoice' : 'New Invoice')}
            {viewMode === 'edit' && 'Edit Invoice'}
            {viewMode === 'view' && 'Invoice Details'}
          </h1>
          {viewMode === 'list' && (
            <p className="text-surface-500 mt-1">
              Manage your invoices, track payments, and generate PDFs.
            </p>
          )}
        </div>

        {viewMode === 'list' && (
          <button
            type="button"
            onClick={goToCreate}
            className="flex items-center gap-2 px-4 py-2 text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Invoice
          </button>
        )}
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' && (
        <InvoiceList
          key={refreshKey}
          onView={handleViewInvoice}
          onEdit={handleEditInvoice}
          onPrint={handlePrint}
          onDownloadPdf={handleDownloadPdf}
          onDuplicate={handleDuplicate}
          initialStatusFilter={initialStatusFilter}
        />
      )}

      {viewMode === 'create' && (
        <InvoiceForm
          prefillCustomer={prefillCustomer}
          invoice={duplicateInvoice ? {
            ...duplicateInvoice,
            id: crypto.randomUUID(),
            invoiceNumber: '', // Will be assigned
            invoiceDate: getTodayISO(),
            dueDate: calculateDueDate(getTodayISO()),
            advancePaid: 0,
            balanceDue: duplicateInvoice.totalAmount,
            paymentStatus: 'PENDING',
            payments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'pending',
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={goToList}
          isSubmitting={isSubmitting}
        />
      )}

      {viewMode === 'edit' && selectedInvoice && (
        <InvoiceForm
          invoice={selectedInvoice}
          onSubmit={handleSubmit}
          onCancel={() => goToView(selectedInvoice)}
          isSubmitting={isSubmitting}
        />
      )}

      {viewMode === 'view' && selectedInvoice && (
        <InvoiceView
          invoice={selectedInvoice}
          onEdit={() => goToEdit(selectedInvoice)}
          onPrint={() => handlePrint(selectedInvoice)}
          onDownloadPdf={() => handleDownloadPdf(selectedInvoice)}
          onDuplicate={() => handleDuplicate(selectedInvoice)}
          onInvoiceUpdated={handleInvoiceUpdated}
          onClose={goToList}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setInvoiceToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${invoiceToDelete?.invoiceNumber}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}

export default InvoicesPage;

/**
 * CandyCapture Photography Invoice Application
 * SettingsPage Component
 *
 * Main settings page that combines BusinessSettings, BankSettings, and InvoiceSettings
 * into a tabbed or sectioned interface with auto-save and synchronization.
 *
 * @requirements 12.1 Business information
 * @requirements 12.2 Logo upload
 * @requirements 12.3 Logo validation errors
 * @requirements 12.4 Bank details
 * @requirements 12.6 Invoice prefix
 * @requirements 12.7 Default notes/terms
 * @requirements 12.8 Default due date offset
 * @requirements 12.9 Sync changes within 5 seconds
 * @requirements 12.10 Apply to new invoices only
 * @requirements 12.11 No retroactive changes to existing invoices
 * @requirements 12.12 Validation errors prevent saving
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Settings } from '../types/models';
import { getSettings, saveSettings } from '../services/settingsService';
import {
  BusinessSettings,
  BankSettings,
  InvoiceSettings,
} from '../components/settings';
import { LoadingSpinner, Skeleton } from '../components/ui/LoadingSpinner';
import { useToast } from '../components/ui/Toast';
import { cn } from '../lib/utils';
import {
  validateMobileNumber,
  validateRequiredEmail,
  validateInstagramHandle,
  validateInvoicePrefix,
  validateIFSCCode,
  validateUPIId,
  validateBankAccountNumber,
} from '../utils/validation';

/**
 * Settings tab type
 */
type SettingsTab = 'business' | 'bank' | 'invoice';

/**
 * Tab configuration
 */
interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
}

/**
 * Page state
 */
interface PageState {
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  settings: Settings | null;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
}

/**
 * Auto-save debounce delay in milliseconds
 * @see Requirement 12.9 - Sync within 5 seconds
 */
const AUTO_SAVE_DELAY = 3000; // 3 seconds to allow for typing, well within 5 second requirement

/**
 * SettingsPage Component
 *
 * Provides a comprehensive settings management interface with:
 * - Tabbed navigation between Business, Bank, and Invoice settings
 * - Auto-save with debouncing (syncs within 5 seconds)
 * - Validation before saving
 * - Loading and error states
 *
 * @see Requirements 12.1-12.12
 */
export function SettingsPage() {
  const { showToast } = useToast();
  
  // Page state
  const [state, setState] = useState<PageState>({
    isLoading: true,
    isSaving: false,
    error: null,
    settings: null,
    hasUnsavedChanges: false,
    lastSaved: null,
  });

  // Active tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('business');

  // Auto-save timer ref
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Tab configuration with icons
   */
  const tabs: TabConfig[] = [
    {
      id: 'business',
      label: 'Business Info',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      id: 'bank',
      label: 'Payment Details',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    },
    {
      id: 'invoice',
      label: 'Invoice Settings',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
  ];

  /**
   * Load settings on mount
   */
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        const settings = await getSettings();
        setState((prev) => ({
          ...prev,
          isLoading: false,
          settings,
          lastSaved: new Date(),
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load settings',
        }));
        showToast('Failed to load settings', 'error');
      }
    };

    loadSettings();
  }, [showToast]);

  /**
   * Validate all settings fields
   * @see Requirement 12.12
   */
  const validateSettings = useCallback((settings: Settings): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Business info validation
    if (!settings.businessName?.trim()) {
      errors.businessName = 'Business name is required';
    } else if (settings.businessName.length > 100) {
      errors.businessName = 'Business name must not exceed 100 characters';
    }

    if (settings.address && settings.address.length > 500) {
      errors.address = 'Address must not exceed 500 characters';
    }

    const phoneResult = validateMobileNumber(settings.phone || '');
    if (!phoneResult.valid) {
      errors.phone = phoneResult.error || 'Invalid phone number';
    }

    const emailResult = validateRequiredEmail(settings.email || '');
    if (!emailResult.valid) {
      errors.email = emailResult.error || 'Invalid email';
    }

    const instagramResult = validateInstagramHandle(settings.instagramHandle || '');
    if (!instagramResult.valid) {
      errors.instagramHandle = instagramResult.error || 'Invalid Instagram handle';
    }

    // Bank details validation (optional fields, validate format if provided)
    if (settings.bankAccountNumber) {
      const accountResult = validateBankAccountNumber(settings.bankAccountNumber);
      if (!accountResult.valid) {
        errors.bankAccountNumber = accountResult.error || 'Invalid account number';
      }
    }

    if (settings.ifscCode) {
      const ifscResult = validateIFSCCode(settings.ifscCode);
      if (!ifscResult.valid) {
        errors.ifscCode = ifscResult.error || 'Invalid IFSC code';
      }
    }

    if (settings.upiId) {
      const upiResult = validateUPIId(settings.upiId);
      if (!upiResult.valid) {
        errors.upiId = upiResult.error || 'Invalid UPI ID';
      }
    }

    // Invoice settings validation
    const prefixResult = validateInvoicePrefix(settings.invoicePrefix || '');
    if (!prefixResult.valid) {
      errors.invoicePrefix = prefixResult.error || 'Invalid invoice prefix';
    }

    if (settings.defaultNotes && settings.defaultNotes.length > 2000) {
      errors.defaultNotes = 'Default notes must not exceed 2000 characters';
    }

    if (settings.defaultDueDays < 0) {
      errors.defaultDueDays = 'Due date offset cannot be negative';
    } else if (settings.defaultDueDays > 365) {
      errors.defaultDueDays = 'Due date offset cannot exceed 365 days';
    }

    return errors;
  }, []);

  /**
   * Save settings to storage and sync
   * @see Requirement 12.9 - Sync within 5 seconds
   */
  const performSave = useCallback(
    async (settingsToSave: Settings) => {
      // Validate before saving
      const errors = validateSettings(settingsToSave);
      setValidationErrors(errors);

      // Don't save if there are validation errors
      if (Object.keys(errors).length > 0) {
        return;
      }

      setState((prev) => ({ ...prev, isSaving: true }));

      try {
        await saveSettings(settingsToSave);
        setState((prev) => ({
          ...prev,
          isSaving: false,
          hasUnsavedChanges: false,
          lastSaved: new Date(),
        }));
        
        // Silent save - no toast for auto-save to avoid UI noise
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isSaving: false,
        }));
        showToast('Failed to save settings', 'error');
      }
    },
    [showToast, validateSettings]
  );

  /**
   * Handle settings change with debounced auto-save
   * @see Requirement 12.9 - Sync within 5 seconds
   */
  const handleSettingsChange = useCallback(
    (updates: Partial<Settings>) => {
      if (!state.settings) return;

      // Update local state immediately
      const newSettings = { ...state.settings, ...updates };
      setState((prev) => ({
        ...prev,
        settings: newSettings,
        hasUnsavedChanges: true,
      }));

      // Clear existing timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // Schedule auto-save
      saveTimerRef.current = setTimeout(() => {
        performSave(newSettings);
      }, AUTO_SAVE_DELAY);
    },
    [state.settings, performSave]
  );

  /**
   * Manual save (for explicit save button)
   */
  const handleManualSave = useCallback(async () => {
    if (!state.settings) return;

    // Clear pending auto-save
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    await performSave(state.settings);
    
    if (Object.keys(validateSettings(state.settings)).length === 0) {
      showToast('Settings saved successfully', 'success');
    }
  }, [state.settings, performSave, validateSettings, showToast]);

  /**
   * Cleanup timer on unmount
   */
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  /**
   * Retry loading settings
   */
  const handleRetry = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    getSettings()
      .then((settings) => {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          settings,
          lastSaved: new Date(),
        }));
      })
      .catch((err) => {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load settings',
        }));
      });
  }, []);

  // Loading state
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Skeleton width="200px" height="2rem" className="mb-2" />
          <Skeleton width="300px" height="1rem" className="mb-6" />
          
          <div className="rounded-lg border border-surface-200 bg-white p-6">
            <div className="space-y-4">
              <Skeleton width="100%" height="3rem" />
              <Skeleton width="100%" height="3rem" />
              <Skeleton width="100%" height="3rem" />
              <Skeleton width="100%" height="6rem" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error && !state.settings) {
    return (
      <div className="min-h-screen bg-surface-50 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
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
              Failed to load settings
            </h3>
            <p className="mb-4 text-sm text-red-600">{state.error}</p>
            <button
              onClick={handleRetry}
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
        </div>
      </div>
    );
  }

  if (!state.settings) return null;

  return (
    <div className="min-h-screen bg-surface-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Page Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 md:text-3xl">
              Settings
            </h1>
            <p className="mt-1 text-sm text-surface-600">
              Manage your business information and invoice preferences
            </p>
          </div>

          {/* Save Status / Button */}
          <div className="flex items-center gap-3">
            {state.isSaving ? (
              <div className="flex items-center gap-2 text-sm text-surface-500">
                <LoadingSpinner size="sm" variant="primary" />
                <span>Saving...</span>
              </div>
            ) : state.hasUnsavedChanges ? (
              <span className="text-sm text-amber-600">Unsaved changes</span>
            ) : state.lastSaved ? (
              <span className="text-sm text-green-600">
                ✓ Saved
              </span>
            ) : null}

            <button
              onClick={handleManualSave}
              disabled={state.isSaving || !state.hasUnsavedChanges}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                'bg-primary-500 text-white hover:bg-primary-600',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:bg-primary-300'
              )}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Save Changes
            </button>
          </div>
        </div>

        {/* Validation Errors Banner */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <svg
                className="h-5 w-5 flex-shrink-0 text-red-600"
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
              <div>
                <p className="font-medium text-red-700">
                  Please fix the following errors before saving:
                </p>
                <ul className="mt-1 list-inside list-disc text-sm text-red-600">
                  {Object.values(validationErrors).map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-2">
            <svg
              className="h-5 w-5 flex-shrink-0 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-blue-700">
              Settings changes are automatically saved and will apply to new invoices only.
              Existing invoices will not be modified.
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6 border-b border-surface-200">
          <nav className="-mb-px flex gap-2 overflow-x-auto" aria-label="Settings tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-surface-600 hover:border-surface-300 hover:text-surface-900'
                )}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="rounded-lg border border-surface-200 bg-white p-6 shadow-sm">
          {activeTab === 'business' && (
            <BusinessSettings
              settings={state.settings}
              onChange={handleSettingsChange}
              isLoading={state.isSaving}
              errors={validationErrors}
            />
          )}

          {activeTab === 'bank' && (
            <BankSettings
              settings={state.settings}
              onChange={handleSettingsChange}
              isLoading={state.isSaving}
              errors={validationErrors}
            />
          )}

          {activeTab === 'invoice' && (
            <InvoiceSettings
              settings={state.settings}
              onChange={handleSettingsChange}
              isLoading={state.isSaving}
              errors={validationErrors}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;

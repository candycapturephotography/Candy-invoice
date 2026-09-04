/**
 * CandyCapture Photography Invoice Application
 * Settings Storage Service
 *
 * @description Storage service for managing application settings in IndexedDB
 * @requirements 12.1 Business information, 12.4 Bank details
 */

import { db, DB_CONSTANTS } from './db';
import type { Settings } from '../types/models';

/**
 * Default settings for a new installation
 *
 * @description Provides reasonable defaults for all settings fields.
 * Business info and bank details start empty as they must be configured by the user.
 *
 * @see Requirement 12 Settings and configuration
 */
export const DEFAULT_SETTINGS: Settings = {
  id: DB_CONSTANTS.SETTINGS_ID,
  businessName: '',
  address: '',
  phone: '',
  email: '',
  instagramHandle: '',
  logoUrl: undefined,
  bankAccountName: '',
  bankName: '',
  bankAccountNumber: '',
  ifscCode: '',
  upiId: '',
  invoicePrefix: 'CC-',
  defaultNotes: '• 50% advance required to confirm the booking.\n• Balance to be paid before delivery of final work.\n• Raw files will be provided along with edited content.\n• Travelling & accommodation charges extra if applicable.',
  defaultDueDays: 15,
  updatedAt: new Date().toISOString(),
};

/**
 * Get application settings
 *
 * @description Retrieves settings from IndexedDB. If no settings exist,
 * returns default settings (but does not persist them).
 *
 * @returns Promise resolving to the settings object
 *
 * @see Requirement 12.1 Business information
 *
 * @example
 * ```typescript
 * const settings = await getSettings();
 * console.log(settings.businessName);
 * console.log(settings.invoicePrefix);
 * ```
 */
export async function getSettings(): Promise<Settings> {
  const settings = await db.settings.get(DB_CONSTANTS.SETTINGS_ID);

  if (!settings) {
    // Return default settings but don't persist yet
    return { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() };
  }

  return settings;
}

/**
 * Save application settings
 *
 * @description Updates the settings in IndexedDB. Creates the settings
 * record if it doesn't exist.
 *
 * @param settings - Settings object to save
 *
 * @see Requirement 12.1 Business information
 * @see Requirement 12.4 Bank details
 *
 * @example
 * ```typescript
 * const settings = await getSettings();
 * settings.businessName = 'CandyCapture Photography';
 * settings.phone = '9500440272';
 * await saveSettings(settings);
 * ```
 */
export async function saveSettings(settings: Settings): Promise<void> {
  // Ensure the ID is always the singleton key
  const settingsToSave: Settings = {
    ...settings,
    id: DB_CONSTANTS.SETTINGS_ID,
    updatedAt: new Date().toISOString(),
  };

  await db.settings.put(settingsToSave);
}

/**
 * Update specific settings fields
 *
 * @description Convenience method to update only specific fields without
 * having to retrieve and merge the entire settings object.
 *
 * @param updates - Partial settings object with fields to update
 * @returns Promise resolving to the updated settings
 *
 * @example
 * ```typescript
 * // Update just the invoice prefix
 * const updated = await updateSettings({ invoicePrefix: 'INV-' });
 *
 * // Update bank details
 * const updated = await updateSettings({
 *   bankAccountName: 'CandyCapture Photography',
 *   bankName: 'ICICI Bank',
 *   bankAccountNumber: '123456789012',
 *   ifscCode: 'ICIC0001234',
 *   upiId: 'candycapture@upi'
 * });
 * ```
 */
export async function updateSettings(updates: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
  const currentSettings = await getSettings();

  const updatedSettings: Settings = {
    ...currentSettings,
    ...updates,
    id: DB_CONSTANTS.SETTINGS_ID,
    updatedAt: new Date().toISOString(),
  };

  await db.settings.put(updatedSettings);

  return updatedSettings;
}

/**
 * Reset settings to defaults
 *
 * @description Resets all settings to their default values.
 * Use with caution - this will clear all configured business info and bank details.
 *
 * @returns Promise resolving to the default settings
 *
 * @example
 * ```typescript
 * // Reset all settings
 * const defaultSettings = await resetSettings();
 * ```
 */
export async function resetSettings(): Promise<Settings> {
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    updatedAt: new Date().toISOString(),
  };

  await db.settings.put(settings);

  return settings;
}

/**
 * Check if settings have been configured
 *
 * @description Checks if the essential business information has been filled in.
 * Used to determine if the user needs to complete initial setup.
 *
 * @returns Promise resolving to true if settings are configured
 *
 * @example
 * ```typescript
 * const isConfigured = await isSettingsConfigured();
 * if (!isConfigured) {
 *   // Redirect to settings page
 * }
 * ```
 */
export async function isSettingsConfigured(): Promise<boolean> {
  const settings = await getSettings();

  // Check if essential fields are filled
  return Boolean(
    settings.businessName &&
    settings.phone &&
    settings.email
  );
}

/**
 * Get bank details
 *
 * @description Convenience method to retrieve only bank-related settings.
 *
 * @returns Promise resolving to bank details
 *
 * @see Requirement 12.4 Bank details
 *
 * @example
 * ```typescript
 * const bankDetails = await getBankDetails();
 * console.log(bankDetails.bankName);
 * console.log(bankDetails.accountNumber);
 * ```
 */
export async function getBankDetails(): Promise<{
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  ifscCode: string;
  upiId: string;
}> {
  const settings = await getSettings();

  return {
    bankAccountName: settings.bankAccountName,
    bankName: settings.bankName,
    bankAccountNumber: settings.bankAccountNumber,
    ifscCode: settings.ifscCode,
    upiId: settings.upiId,
  };
}

/**
 * Get business information
 *
 * @description Convenience method to retrieve only business-related settings.
 *
 * @returns Promise resolving to business information
 *
 * @see Requirement 12.1 Business information
 *
 * @example
 * ```typescript
 * const businessInfo = await getBusinessInfo();
 * console.log(businessInfo.businessName);
 * console.log(businessInfo.address);
 * ```
 */
export async function getBusinessInfo(): Promise<{
  businessName: string;
  address: string;
  phone: string;
  email: string;
  instagramHandle: string;
  logoUrl?: string;
}> {
  const settings = await getSettings();

  return {
    businessName: settings.businessName,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    instagramHandle: settings.instagramHandle,
    logoUrl: settings.logoUrl,
  };
}

/**
 * Get invoice configuration settings
 *
 * @description Retrieves settings related to invoice generation.
 *
 * @returns Promise resolving to invoice configuration
 *
 * @see Requirement 12.6, 12.7, 12.8 Invoice settings
 *
 * @example
 * ```typescript
 * const invoiceConfig = await getInvoiceConfig();
 * console.log(invoiceConfig.invoicePrefix); // "CC-"
 * console.log(invoiceConfig.defaultDueDays); // 15
 * ```
 */
export async function getInvoiceConfig(): Promise<{
  invoicePrefix: string;
  defaultNotes: string;
  defaultDueDays: number;
}> {
  const settings = await getSettings();

  return {
    invoicePrefix: settings.invoicePrefix,
    defaultNotes: settings.defaultNotes,
    defaultDueDays: settings.defaultDueDays,
  };
}

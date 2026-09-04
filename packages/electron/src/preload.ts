import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

/**
 * Custom API exposed to the renderer process via contextBridge.
 * This provides a secure way for the web app to communicate with
 * the main process for Electron-specific features.
 *
 * Requirements: 13.7, 13.8
 */
const api = {
  /**
   * Sync notification API
   * Used to trigger system tray notifications when sync completes or fails.
   * Requirement: 13.8
   */
  sync: {
    /**
     * Notify that sync has completed successfully.
     * @param message - Optional custom message for the notification
     */
    notifyComplete: (message?: string): void => {
      ipcRenderer.send('sync:complete', message);
    },

    /**
     * Notify that sync has failed.
     * @param message - Optional custom message for the notification
     */
    notifyFailure: (message?: string): void => {
      ipcRenderer.send('sync:failure', message);
    },
  },

  /**
   * Network status API
   * Used to track and communicate online/offline status.
   * Requirement: 13.7
   */
  network: {
    /**
     * Update the main process with current network status.
     * @param online - Whether the app is currently online
     */
    setStatus: (online: boolean): void => {
      ipcRenderer.send('network:status', online);
    },

    /**
     * Get the current network status from main process.
     * @returns Promise resolving to online status
     */
    getStatus: (): Promise<boolean> => {
      return ipcRenderer.invoke('network:get-status');
    },
  },

  /**
   * Notification API
   * Used to show native system notifications.
   */
  notification: {
    /**
     * Show a native notification.
     * @param title - Notification title
     * @param body - Notification body text
     */
    show: (title: string, body: string): void => {
      ipcRenderer.send('notification:show', title, body);
    },
  },

  /**
   * Platform information
   * Provides information about the current platform.
   */
  platform: {
    /**
     * Check if running in Electron.
     */
    isElectron: true,

    /**
     * Get the platform name.
     */
    name: process.platform,
  },
};

// Expose APIs in the main world based on context isolation preference
if (process.contextIsolated) {
  try {
    // Expose electron API from @electron-toolkit/preload
    contextBridge.exposeInMainWorld('electron', electronAPI);
    // Expose custom API for sync and network features
    contextBridge.exposeInMainWorld('candyCapture', api);
  } catch (error) {
    console.error('Failed to expose API in main world:', error);
  }
} else {
  // Fallback for non-isolated context (not recommended)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).electron = electronAPI;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).candyCapture = api;
}

// Export types for TypeScript support in renderer
export type CandyCaptureAPI = typeof api;

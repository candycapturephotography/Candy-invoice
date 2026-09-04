/**
 * Type declarations for the CandyCapture Electron API exposed via preload.
 * This file provides TypeScript support for the renderer process.
 */

export interface CandyCaptureAPI {
  /**
   * Sync notification API for system tray notifications.
   */
  sync: {
    /**
     * Notify that sync has completed successfully.
     * @param message - Optional custom message for the notification
     */
    notifyComplete: (message?: string) => void;

    /**
     * Notify that sync has failed.
     * @param message - Optional custom message for the notification
     */
    notifyFailure: (message?: string) => void;
  };

  /**
   * Network status API for online/offline tracking.
   */
  network: {
    /**
     * Update the main process with current network status.
     * @param online - Whether the app is currently online
     */
    setStatus: (online: boolean) => void;

    /**
     * Get the current network status from main process.
     * @returns Promise resolving to online status
     */
    getStatus: () => Promise<boolean>;
  };

  /**
   * Notification API for native system notifications.
   */
  notification: {
    /**
     * Show a native notification.
     * @param title - Notification title
     * @param body - Notification body text
     */
    show: (title: string, body: string) => void;
  };

  /**
   * Platform information.
   */
  platform: {
    /**
     * Check if running in Electron.
     */
    isElectron: boolean;

    /**
     * Get the platform name.
     */
    name: string;
  };
}

declare global {
  interface Window {
    /**
     * CandyCapture Photography Electron API.
     * Only available when running in Electron desktop app.
     */
    candyCapture?: CandyCaptureAPI;

    /**
     * Electron toolkit API.
     * Only available when running in Electron desktop app.
     */
    electron?: {
      ipcRenderer: {
        on: (
          channel: string,
          listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void
        ) => void;
        off: (
          channel: string,
          listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void
        ) => void;
        send: (channel: string, ...args: unknown[]) => void;
        invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
      };
      process: {
        versions: NodeJS.ProcessVersions;
      };
    };
  }
}

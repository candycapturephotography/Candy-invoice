import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  Notification,
  Tray,
  Menu,
  nativeImage,
} from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';

// Type extension for isQuitting property
interface AppWithQuit extends Electron.App {
  isQuitting: boolean;
}

// Application state
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isOnline = true;

// Icon paths
const iconPath = join(__dirname, '../../assets/icon.ico');
const trayIconPath = join(__dirname, '../../assets/icon.ico');

/**
 * Creates the main application window.
 * Requirements: 13.5, 13.6, 13.7
 */
function createWindow(): void {
  // Create the browser window with optimized settings
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false, // Don't show until ready for smoother UX
    autoHideMenuBar: false,
    icon: iconPath,
    title: 'CandyCapture Photography',
    backgroundColor: '#FDF2F8', // Light pink background matching brand
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Show window when content is ready (improves perceived performance)
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Load the app based on environment
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // Development: load from Vite dev server
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    // Production: load from built files
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // Handle window close - minimize to tray instead
  mainWindow.on('close', (event) => {
    if (!(app as AppWithQuit).isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

/**
 * Creates the system tray icon and menu.
 * Requirements: 13.5, 13.8
 */
function createTray(): void {
  try {
    const trayImage = nativeImage.createFromPath(trayIconPath);
    tray = new Tray(trayImage.resize({ width: 16, height: 16 }));

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open CandyCapture Photography',
        click: () => {
          mainWindow?.show();
        },
      },
      { type: 'separator' },
      {
        label: isOnline ? '● Online' : '○ Offline',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          (app as AppWithQuit).isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setToolTip('CandyCapture Photography');
    tray.setContextMenu(contextMenu);

    // Double-click on tray to show window
    tray.on('double-click', () => {
      mainWindow?.show();
    });
  } catch (error) {
    console.error('Failed to create tray:', error);
  }
}

/**
 * Updates the tray menu with current online status.
 */
function updateTrayMenu(): void {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open CandyCapture Photography',
      click: () => {
        mainWindow?.show();
      },
    },
    { type: 'separator' },
    {
      label: isOnline ? '● Online' : '○ Offline',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        (app as AppWithQuit).isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

/**
 * Shows a system notification for sync status.
 * Requirements: 13.8
 */
function showSyncNotification(
  status: 'complete' | 'failure',
  message?: string
): void {
  if (!Notification.isSupported()) return;

  const notification = new Notification({
    title:
      status === 'complete' ? 'Sync Complete' : 'Sync Failed',
    body:
      message ??
      (status === 'complete'
        ? 'All data has been synchronized successfully.'
        : 'Failed to sync data. Will retry when connection is restored.'),
    icon: iconPath,
  });

  notification.show();
}

// IPC Handlers for renderer process communication

/**
 * Handle sync complete notification from renderer.
 * Requirements: 13.8
 */
ipcMain.on('sync:complete', (_event, message?: string) => {
  showSyncNotification('complete', message);
});

/**
 * Handle sync failure notification from renderer.
 * Requirements: 13.8
 */
ipcMain.on('sync:failure', (_event, message?: string) => {
  showSyncNotification('failure', message);
});

/**
 * Handle online status change from renderer.
 * Requirements: 13.7
 */
ipcMain.on('network:status', (_event, online: boolean) => {
  isOnline = online;
  updateTrayMenu();
});

/**
 * Get current online status.
 */
ipcMain.handle('network:get-status', () => {
  return isOnline;
});

/**
 * Show notification from renderer.
 */
ipcMain.on(
  'notification:show',
  (_event, title: string, body: string) => {
    if (!Notification.isSupported()) return;

    const notification = new Notification({
      title,
      body,
      icon: iconPath,
    });

    notification.show();
  }
);

// App lifecycle events

app.whenReady().then(() => {
  // Set app user model id for windows (required for notifications)
  electronApp.setAppUserModelId('com.candycapture.photography');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();
  createTray();

  app.on('activate', function () {
    // On macOS it's common to re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app quit
app.on('before-quit', () => {
  (app as AppWithQuit).isQuitting = true;
});

// Initialize isQuitting
(app as AppWithQuit).isQuitting = false;

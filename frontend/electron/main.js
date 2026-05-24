const { app, BrowserWindow, ipcMain, Menu, dialog, Tray, Notification, nativeImage } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

const isDev = !app.isPackaged;
const appAny = app;

let mainWindow = null;
let tray = null;

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('AI Construction OS');
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Window', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { label: 'Hide Window', click: () => mainWindow?.hide() },
    { type: 'separator' },
    { label: 'Quit', click: () => { appAny.isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1024, minHeight: 700,
    title: 'AI Construction OS',
    icon: path.join(__dirname, '../resources/icon.png'),
    show: false, frame: false, backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, contextIsolation: true, sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (!isDev) autoUpdater.checkForUpdatesAndNotify();
  });

  mainWindow.on('close', (event) => {
    if (!appAny.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
  setupMenu();
  setupIPC();
}

function setupMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New Project', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('menu-new-project') },
        { label: 'Open Project', accelerator: 'CmdOrCtrl+O', click: () => mainWindow?.webContents.send('menu-open-project') },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => mainWindow?.webContents.send('menu-save') },
        { type: 'separator' },
        { label: 'Export PDF', accelerator: 'CmdOrCtrl+E', click: () => mainWindow?.webContents.send('menu-export-pdf') },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }] },
    { label: 'View', submenu: [{ role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }] },
    { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'close' }] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function setupIPC() {
  ipcMain.handle('minimize-window', () => mainWindow?.minimize());
  ipcMain.handle('maximize-window', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
  ipcMain.handle('close-window', () => mainWindow?.close());
  ipcMain.handle('is-maximized', () => mainWindow?.isMaximized());
  ipcMain.handle('select-file', async (_e, options) => dialog.showOpenDialog(mainWindow, options));
  ipcMain.handle('save-file', async (_e, options) => dialog.showSaveDialog(mainWindow, options));
  ipcMain.handle('show-notification', async (_e, { title, body }) => {
    if (Notification.isSupported()) {
      const notification = new Notification({ title, body });
      notification.on('click', () => { mainWindow?.show(); mainWindow?.focus(); });
      notification.show();
    }
  });
  ipcMain.handle('set-auto-start', async (_e, enable) => { app.setLoginItemSettings({ openAtLogin: enable }); });
  ipcMain.handle('get-auto-start', async () => app.getLoginItemSettings().openAtLogin);
  ipcMain.handle('focus-window', async () => { mainWindow?.show(); mainWindow?.focus(); });
}

appAny.isQuitting = false;

app.whenReady().then(() => { createTray(); createWindow(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on('before-quit', () => { appAny.isQuitting = true; });
app.on('quit', () => { if (tray) { tray.destroy(); tray = null; } });

autoUpdater.on('checking-for-update', () => mainWindow?.webContents.send('update-checking'));
autoUpdater.on('update-available', (info) => mainWindow?.webContents.send('update-available', info));
autoUpdater.on('update-not-available', (info) => mainWindow?.webContents.send('update-not-available', info));
autoUpdater.on('download-progress', (progress) => mainWindow?.webContents.send('update-progress', progress));
autoUpdater.on('update-downloaded', (info) => mainWindow?.webContents.send('update-downloaded', info));

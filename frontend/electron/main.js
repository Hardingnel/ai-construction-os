const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

const isDev = !app.isPackaged;

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'AI Construction OS',
    icon: path.join(__dirname, '../resources/icon.png'),
    show: false,
    frame: false,
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (!isDev) autoUpdater.checkForUpdatesAndNotify();
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
    {
      label: 'View',
      submenu: [{ role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }],
    },
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
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

autoUpdater.on('checking-for-update', () => mainWindow?.webContents.send('update-checking'));
autoUpdater.on('update-available', (info) => mainWindow?.webContents.send('update-available', info));
autoUpdater.on('update-not-available', (info) => mainWindow?.webContents.send('update-not-available', info));
autoUpdater.on('download-progress', (progress) => mainWindow?.webContents.send('update-progress', progress));
autoUpdater.on('update-downloaded', (info) => mainWindow?.webContents.send('update-downloaded', info));

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// Disable Blink CORS restrictions for file:// loading remote APIs
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

function createWindow() {
  const icoPublic = path.join(__dirname, 'public', 'favicon.ico');
  const icoDist = path.join(__dirname, 'dist', 'favicon.ico');
  const resolvedIcon = fs.existsSync(icoPublic) ? icoPublic : (fs.existsSync(icoDist) ? icoDist : undefined);

  const win = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'الرقم الأول - نظام إدارة الحسابات والمبيعات',
    autoHideMenuBar: true,
    backgroundColor: '#090d16',
    show: false, // Prevents white flash before content renders
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false, // Allows file:// origin to interact with Firebase and local assets
      allowRunningInsecureContent: true,
      spellcheck: false,
    },
    icon: resolvedIcon
  });

  // Provide essential clipboard and editing accelerators (Undo, Redo, Cut, Copy, Paste, SelectAll)
  // while hiding the visual top menu bar
  const template = [
    {
      label: 'تعديل',
      submenu: [
        { role: 'undo', label: 'تراجع' },
        { role: 'redo', label: 'إعادة' },
        { type: 'separator' },
        { role: 'cut', label: 'قص' },
        { role: 'copy', label: 'نسخ' },
        { role: 'paste', label: 'لصق' },
        { role: 'selectAll', label: 'تحديد الكل' }
      ]
    }
  ];
  const appMenu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(appMenu);
  win.setMenuBarVisibility(false);

  // Smooth appearance and immediate webContents focus when ready
  win.once('ready-to-show', () => {
    win.show();
    win.focus();
    win.webContents.focus();
  });

  // Fallback if ready-to-show doesn't fire within 1.5s
  setTimeout(() => {
    if (!win.isDestroyed() && !win.isVisible()) {
      win.show();
      win.focus();
      win.webContents.focus();
    }
  }, 1500);

  // Shortcut for DevTools (F12 or Ctrl+Shift+I) for easy diagnostics
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      win.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Load the built app index.html
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  win.loadFile(indexPath).catch((err) => {
    console.error('Failed to load local HTML file at:', indexPath, err);
  });

  // Log renderer console errors
  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (level >= 2) {
      console.log(`[Renderer Log] ${message} (${sourceId}:${line})`);
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


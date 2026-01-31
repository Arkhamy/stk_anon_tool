const { app, BrowserWindow } = require('electron');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "STK Anon",
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Charge l'application locale
  win.loadURL('http://localhost:5173');
};

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
   if (process.platform !== 'darwin') app.quit()
})

const electron = require('electron');
//import electorn from 'electorn'; // es6
const ffmpeg = require('fluent-ffmpeg');
const { app, BrowserWindow, ipcMain } = electron;

let mainWindow;

app.on ('ready', () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
        nodeIntegration: true,
        allowEval: false
    }
  });
  mainWindow.loadURL(`file://${__dirname}/index.html`);
});

ipcMain.on('video:submit', (event, path) => {
  ffmpeg.ffprobe(path, (err, metadata) => {
    console.log('Video duration is: ', metadata.format.duration);
    mainWindow.webContents.send(
      'video:metadata',
      metadata.format.duration);
  });
});

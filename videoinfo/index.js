const electron = require('electron');

//import electorn from 'electorn';

const { app, BrowserWindow } = electron;

app.on ('ready', () => {
  const mainWindow = new BrowserWindow({});
  mainWindow.loadURL(`file://${__dirname}/index.html`);
});

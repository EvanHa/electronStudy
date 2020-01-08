const path = require('path');
const electron = require('electron');
const { app, BrowserWindow, Tray } = electron;

let mainWindow;
let tray;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    height:600,
    width:300,
    frame: false,
    resizable: false,
    show: false
  });
  mainWindow.loadURL(`file://${__dirname}/src/index.html`);

  const iconName = process.platform === 'win32' ? 'windows-icon.png' : 'iconTemplate.png';
  const iconPath = path.join(__dirname, `./src/assets/${iconName}`);
  tray = new Tray(iconPath);
  tray.on('click', (event, bounds)=> {
    console.log(bounds.x, bounds.y);
    // Click event bounds
    const { x, y } = bounds;

    // Window height and width
    const { height, width } = mainWindow.getBounds();

    if (mainWindow.isVisible())
    {
      mainWindow.hide();
    } else {
      const xPosition = process.platform === 'darwin' ? x - width / 2 : parseInt(x - (width/2));
      const yPosition = process.platform === 'darwin' ? y : parseInt(y-height);
      console.log(xPosition, yPosition);
      mainWindow.setBounds({
        x:xPosition,
        y:yPosition,
        height,
        width
      });
      mainWindow.show();
    }
  });
});

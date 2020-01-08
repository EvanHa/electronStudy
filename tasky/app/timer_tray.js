const electron = require('electron');
const { Tray, app, Menu } = electron;

class TimerTray extends Tray {
  constructor(iconPath, mainWindow) {
    super(iconPath);

    this.mainWindow = mainWindow;
    this.setToolTip('Timer App');
    this.on('click', this.onClick.bind(this));
    this.on('right-click', this.onRightClick.bind(this));
  }

  onClick(event, bounds) {
    console.log(bounds.x, bounds.y);
    // Click event bounds
    const { x, y } = bounds;

    // Window height and width
    const { height, width } = this.mainWindow.getBounds();

    if (this.mainWindow.isVisible())
    {
      this.mainWindow.hide();
    } else {
      const xPosition = process.platform === 'darwin' ? x - width / 2 : parseInt(x - (width/2));
      const yPosition = process.platform === 'darwin' ? y : parseInt(y-height);
      console.log(xPosition, yPosition);
      this.mainWindow.setBounds({
        x:xPosition,
        y:yPosition,
        height,
        width
      });
      this.mainWindow.show();
    }
  }

  onRightClick() {
    const menuConfig = Menu.buildFromTemplate([
      {
        label: 'Quit',
        click: () => app.quit()
      }
    ]);

    //메뉴 적용
    this.popUpContextMenu(menuConfig);
  }
}

module.exports = TimerTray;

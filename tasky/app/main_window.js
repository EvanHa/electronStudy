const electron = require('electron');
const { BrowserWindow } = electron;

class MainWindow extends BrowserWindow {
  constructor(url) {
    super({
      height:600,
      width:300,
      frame: false,
      resizable: false,
      show: false,
      webPreferences: { backgroundThrottling: false } // 포커스를 잃어도 백그라운드에서 동작
    });

    this.loadURL(url);
    // 마우스로 다른곳을 눌렀을때 동작
    this.on('blur', this.onBlur.bind(this));
  }

  onBlur() {
    this.hide();
  }
}

module.exports = MainWindow;

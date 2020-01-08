const path = require('path');
const electron = require('electron');
const TimerTray = require('./app/timer_tray');
const MainWindow = require('./app/main_window');

const { app, ipcMain } = electron;

let mainWindow;
let tray;

app.on('ready', () => {
  app.dock.hide();
  mainWindow = new MainWindow(`file://${__dirname}/src/index.html`);

  const iconName = process.platform === 'win32' ? 'windows-icon.png' : 'iconTemplate.png';
  const iconPath = path.join(__dirname, `./src/assets/${iconName}`);
  // 메모리에서 더이상 참조되지 않는 변수는 가비지 콜렉터가 정리해버린다.
  // tray 변수에 TimerTray instance를 담아둬야 사라지지 않음
  tray = new TimerTray(iconPath, mainWindow);
});

ipcMain.on('update-timer', (event, timeLeft)=>{
  tray.setTitle(timeLeft);
});

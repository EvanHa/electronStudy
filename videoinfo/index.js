const electron = require('electron');

//import electorn from 'electorn';

const { app } = electron;

app.on ('ready', () => {
  console.log("App is now ready");

});

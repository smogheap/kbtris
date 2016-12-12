const {app, BrowserWindow} = require('electron');

let mainWindow;

app.on('ready', () => {
	mainWindow = new BrowserWindow({
		backgroundColor: "#445",
		fullscreen: true
		//height: 600,
		//width: 800
	});

	mainWindow.loadURL('file://' + __dirname + '/index.html');
});
app.on('window-all-closed', () => {
  app.quit()
});

const { app, BrowserWindow } = require("electron")

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false, // ⛔️ يخفي الـ toolbar تمامًا
    titleBarStyle: "hidden", // (اختياري للماك)
    webPreferences: {
      nodeIntegration: false
    }
  })

  win.loadURL("http://localhost:3000") // أو ملف HTML في الإنتاج
}

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})

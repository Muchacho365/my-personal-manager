const {
    app,
    BrowserWindow,
    Menu,
    ipcMain,
    clipboard,
    globalShortcut,
    dialog,
} = require("electron");
const path = require("path");
const fs = require("fs");
const CryptoJS = require("crypto-js");
const { autoUpdater } = require("electron-updater");

// Global error handling
process.on("uncaughtException", (error) => {
    dialog.showErrorBox("An error occurred", error.stack || error.message);
});

let mainWindow;
const ENCRYPTION_KEY = "PersonalManager2024SecureKey";
const DATA_FILE = path.join(app.getPath("userData"), "data.json");

function createWindow() {
    // Remove default menu bar
    Menu.setApplicationMenu(null);

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: "#0f172a",
        title: "Muchacho Personal Manager",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"),
        },
        icon: path.join(__dirname, "assets", "icon.ico"),
    });

    mainWindow.loadFile("index.html");
    mainWindow.maximize();

    // Normal close behavior - actually close the app
    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    // Check for updates
    if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify();
    }
}

// Auto-updater events
autoUpdater.on("update-available", () => {
    dialog.showMessageBox(mainWindow, {
        type: "info",
        title: "Update Available",
        message:
            "A new version is available. It will be downloaded in the background.",
        buttons: ["OK"],
    });
});

autoUpdater.on("update-downloaded", () => {
    dialog
        .showMessageBox(mainWindow, {
            type: "info",
            title: "Update Ready",
            message:
                "A new version has been downloaded. Restart now to install?",
            buttons: ["Restart", "Later"],
        })
        .then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
});

app.whenReady().then(() => {
    createWindow();

    // Register global shortcuts
    globalShortcut.register("CommandOrControl+Shift+P", () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.minimize();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on("before-quit", () => {
    app.isQuitting = true;
    globalShortcut.unregisterAll();
});

// IPC Handlers
ipcMain.handle("encrypt", (event, text) => {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
});

ipcMain.handle("decrypt", (event, ciphertext) => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
        return ciphertext;
    }
});

ipcMain.handle("copy-to-clipboard", (event, text) => {
    clipboard.writeText(text);
    return true;
});

ipcMain.handle("minimize-window", () => {
    mainWindow.minimize();
});

ipcMain.handle("maximize-window", () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});

ipcMain.handle("close-window", () => {
    mainWindow.close();
});

ipcMain.handle("quit-app", () => {
    app.isQuitting = true;
    app.quit();
});

ipcMain.handle("generate-password", (event, options) => {
    const {
        length = 16,
        uppercase = true,
        lowercase = true,
        numbers = true,
        symbols = true,
    } = options;
    let chars = "";
    if (uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
    if (numbers) chars += "0123456789";
    if (symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (!chars) chars = "abcdefghijklmnopqrstuvwxyz";

    let password = "";
    const array = new Uint32Array(length);
    require("crypto").randomFillSync(array);
    for (let i = 0; i < length; i++) {
        password += chars[array[i] % chars.length];
    }
    return password;
});

ipcMain.handle("load-data", () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, "utf8");
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error("Failed to load data:", error);
        return null;
    }
});

ipcMain.handle("save-data", (event, data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error("Failed to save data:", error);
        return false;
    }
});

ipcMain.handle("check-for-updates", () => {
    if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify();
    }
});

autoUpdater.on("error", (err) => {
    if (mainWindow) {
        mainWindow.webContents.send("update-error", err.toString());
    }
});

autoUpdater.on("update-not-available", () => {
    if (mainWindow) {
        mainWindow.webContents.send("update-not-available");
    }
});

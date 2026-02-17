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

app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-setuid-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');

// Global error handling
process.on("uncaughtException", (error) => {
    dialog.showErrorBox("An error occurred", error.stack || error.message);
});

let mainWindow;
const allWindows = new Set();
const ENCRYPTION_KEY = "PersonalManager2024SecureKey";
const DATA_FILE = path.join(app.getPath("userData"), "data.json");
const AI_MODELS_DIR = path.join(app.getPath("userData"), "ai-models");

if (!fs.existsSync(AI_MODELS_DIR)) {
    fs.mkdirSync(AI_MODELS_DIR, { recursive: true });
}

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
            v8CacheOptions: "code",
            backgroundThrottling: false,
        },
        icon: path.join(__dirname, "assets", "icon.ico"),
    });

    allWindows.add(mainWindow);

    mainWindow.loadFile("index.html");
    mainWindow.maximize();
    // mainWindow.webContents.openDevTools();

    // Normal close behavior - actually close the app
    mainWindow.on("closed", () => {
        allWindows.delete(mainWindow);
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
        if (!ciphertext) return "";
        const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        // If decryption fails, it often returns an empty string.
        // In that case, return the original ciphertext (it might be plain text).
        return decrypted || ciphertext;
    } catch (error) {
        console.error("Decryption error:", error);
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

ipcMain.handle("new-window", () => {
    createWindow();
});

ipcMain.on("broadcast-state-change", (event, data) => {
    // Broadcast to all windows except sender
    const sender = BrowserWindow.fromWebContents(event.sender);
    allWindows.forEach((win) => {
        if (win !== sender && !win.isDestroyed()) {
            win.webContents.send("state-changed", data);
        }
    });
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
        console.log("Saving data to:", DATA_FILE);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log("Data saved successfully.");
        return true;
    } catch (error) {
        console.error("Failed to save data:", error);
        return false;
    }
});

ipcMain.handle("export-data", async (event, data) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    const defaultName = `personal-manager-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: "Export Backup",
        defaultPath: path.join(app.getPath("documents"), defaultName),
        filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (canceled || !filePath) {
        return { canceled: true };
    }

    try {
        let payload = data && typeof data === "object" ? data : null;
        if (!payload && fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, "utf8");
            payload = JSON.parse(raw);
        }
        if (!payload) {
            payload = { exportedAt: Date.now() };
        }
        fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
        return { canceled: false, filePath };
    } catch (error) {
        console.error("Failed to export data:", error);
        return { canceled: false, error: error.message || String(error) };
    }
});

ipcMain.handle("import-data", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
        title: "Import Backup",
        filters: [{ name: "JSON", extensions: ["json"] }],
        properties: ["openFile"],
    });

    if (canceled || !filePaths || !filePaths[0]) {
        return { canceled: true };
    }

    try {
        const raw = fs.readFileSync(filePaths[0], "utf8");
        const data = JSON.parse(raw);
        if (!data || typeof data !== "object" || Array.isArray(data)) {
            return { canceled: false, error: "Invalid backup format." };
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return { canceled: false, filePath: filePaths[0], data };
    } catch (error) {
        console.error("Failed to import data:", error);
        return { canceled: false, error: error.message || String(error) };
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

// AI Model Management
ipcMain.handle("get-ai-model-path", (event, modelName) => {
    return path.join(AI_MODELS_DIR, modelName);
});

ipcMain.handle("check-ai-model-exists", (event, modelName) => {
    return fs.existsSync(path.join(AI_MODELS_DIR, modelName));
});

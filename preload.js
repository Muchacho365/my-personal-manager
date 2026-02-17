const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    // Encryption
    encrypt: (text) => ipcRenderer.invoke("encrypt", text),
    decrypt: (ciphertext) => ipcRenderer.invoke("decrypt", ciphertext),

    // Clipboard
    copyToClipboard: (text) => ipcRenderer.invoke("copy-to-clipboard", text),

    // Window controls
    minimize: () => ipcRenderer.invoke("minimize-window"),
    maximize: () => ipcRenderer.invoke("maximize-window"),
    close: () => ipcRenderer.invoke("close-window"),
    quit: () => ipcRenderer.invoke("quit-app"),
    openNewWindow: () => ipcRenderer.invoke("new-window"),

    // State Sync
    broadcastStateChange: (data) =>
        ipcRenderer.send("broadcast-state-change", data),
    onStateChange: (callback) =>
        ipcRenderer.on("state-changed", (event, data) => callback(data)),

    // Password generator
    generatePassword: (options) =>
        ipcRenderer.invoke("generate-password", options),

    // Listen for tab changes from tray
    onChangeTab: (callback) =>
        ipcRenderer.on("change-tab", (event, tab) => callback(tab)),

    // Data Persistence
    loadData: () => ipcRenderer.invoke("load-data"),
    saveData: (data) => ipcRenderer.invoke("save-data", data),
    exportData: (data) => ipcRenderer.invoke("export-data", data),
    importData: () => ipcRenderer.invoke("import-data"),

    // Auto Update
    checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
    onUpdateAvailable: (callback) =>
        ipcRenderer.on("update-available", () => callback()),
    onUpdateDownloaded: (callback) =>
        ipcRenderer.on("update-downloaded", () => callback()),
    onUpdateNotAvailable: (callback) =>
        ipcRenderer.on("update-not-available", () => callback()),
    onUpdateError: (callback) =>
        ipcRenderer.on("update-error", (event, err) => callback(err)),

    // AI Model Management
    getAiModelPath: (modelName) =>
        ipcRenderer.invoke("get-ai-model-path", modelName),
    checkAiModelExists: (modelName) =>
        ipcRenderer.invoke("check-ai-model-exists", modelName),
});

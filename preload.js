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

    // Password generator
    generatePassword: (options) =>
        ipcRenderer.invoke("generate-password", options),

    // Listen for tab changes from tray
    onChangeTab: (callback) =>
        ipcRenderer.on("change-tab", (event, tab) => callback(tab)),

    // Data Persistence
    loadData: () => ipcRenderer.invoke("load-data"),
    saveData: (data) => ipcRenderer.invoke("save-data", data),
});

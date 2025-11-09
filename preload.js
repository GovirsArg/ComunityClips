const { contextBridge, ipcRenderer } = require('electron');

// API segura para el renderer process
const electronAPI = {
    // Configuración
    getConfig: () => ipcRenderer.invoke('get-config'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    
    // Selección de carpetas
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    
    // Autenticación
    startAuth: () => ipcRenderer.invoke('start-auth'),
    
    // Subida de clips
    uploadNow: (folders) => ipcRenderer.invoke('upload-now', folders),
    
    // Eventos del proceso principal
    onScanStatus: (callback) => {
        ipcRenderer.on('scan-status', (event, status) => callback(status));
    },
    
    onUploadProgress: (callback) => {
        ipcRenderer.on('upload-progress', (event, progress) => callback(progress));
    },
    
    onError: (callback) => {
        ipcRenderer.on('error', (event, error) => callback(error));
    },
    
    // Remover listeners
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
};

// Exponer API al renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Información de la aplicación
contextBridge.exposeInMainWorld('appInfo', {
    version: process.env.npm_package_version || '1.0.0',
    platform: process.platform,
    arch: process.arch
});
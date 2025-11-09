const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const { authorize, getOAuthClient } = require('./uploader/auth');
const { uploadVideo } = require('./uploader/youtubeUploader');
const { scanFolders } = require('./uploader/scanner');
const { getConfig, saveConfig } = require('./uploader/config');
const { logInfo, logError } = require('./uploader/utils');

// Variables globales
let mainWindow;
let authWindow;
let scanInterval = null;
let isScanning = false;
let uploadQueue = [];

// Crear ventana principal
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        title: 'CommunityClips - Subida Automática de Clips'
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
    
    // Abrir herramientas de desarrollo en modo desarrollo
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
        // Limpiar intervalos al cerrar
        if (scanInterval) {
            clearInterval(scanInterval);
            scanInterval = null;
        }
    });
}

// Manejadores IPC
ipcMain.handle('get-config', async () => {
    try {
        return await getConfig();
    } catch (error) {
        logError('Error obteniendo configuración:', error);
        throw error;
    }
});

ipcMain.handle('save-config', async (event, config) => {
    try {
        await saveConfig(config);
        // Reiniciar auto-scan si está habilitado
        setupAutoScan(config);
        return { success: true };
    } catch (error) {
        logError('Error guardando configuración:', error);
        throw error;
    }
});

ipcMain.handle('select-folder', async () => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
            title: 'Seleccionar carpeta de clips'
        });
        
        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        }
        return null;
    } catch (error) {
        logError('Error seleccionando carpeta:', error);
        throw error;
    }
});

ipcMain.handle('start-auth', async () => {
    try {
        await authorize();
        return { success: true };
    } catch (error) {
        logError('Error en autenticación:', error);
        throw error;
    }
});

ipcMain.handle('upload-now', async (event, folders) => {
    try {
        if (isScanning) {
            throw new Error('Ya hay un escaneo en progreso');
        }
        
        isScanning = true;
        mainWindow.webContents.send('scan-status', { scanning: true });
        
        const config = await getConfig();
        const results = await scanFolders(folders, config, (progress) => {
            mainWindow.webContents.send('upload-progress', progress);
        });
        
        isScanning = false;
        mainWindow.webContents.send('scan-status', { scanning: false });
        
        return results;
    } catch (error) {
        isScanning = false;
        mainWindow.webContents.send('scan-status', { scanning: false });
        logError('Error en subida manual:', error);
        throw error;
    }
});

// Configurar auto-escaneo
function setupAutoScan(config) {
    // Limpiar intervalo existente
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
    
    // Configurar nuevo intervalo si está habilitado
    if (config.autoUpload && config.folders && config.folders.length > 0) {
        const intervalMs = (config.scanInterval || 5) * 60 * 1000; // minutos a ms
        
        scanInterval = setInterval(async () => {
            if (!isScanning) {
                try {
                    isScanning = true;
                    mainWindow.webContents.send('scan-status', { scanning: true });
                    
                    const results = await scanFolders(config.folders, config, (progress) => {
                        mainWindow.webContents.send('upload-progress', progress);
                    });
                    
                    isScanning = false;
                    mainWindow.webContents.send('scan-status', { scanning: false });
                    
                    logInfo(`Auto-scan completado: ${results.uploaded} clips subidos`);
                } catch (error) {
                    isScanning = false;
                    mainWindow.webContents.send('scan-status', { scanning: false });
                    logError('Error en auto-scan:', error);
                }
            }
        }, intervalMs);
        
        logInfo(`Auto-scan configurado cada ${config.scanInterval || 5} minutos`);
    }
}

// Eventos de la aplicación
app.whenReady().then(() => {
    createMainWindow();
    
    // Configurar auto-scan al iniciar
    getConfig().then(config => {
        setupAutoScan(config);
    }).catch(error => {
        logError('Error configurando auto-scan al iniciar:', error);
    });
});

app.on('window-all-closed', () => {
    // Limpiar intervalos
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
    
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

// Manejar cierre de la aplicación
app.on('before-quit', () => {
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    logError('Excepción no capturada:', error);
    if (mainWindow) {
        mainWindow.webContents.send('error', {
            message: 'Error inesperado: ' + error.message
        });
    }
});

process.on('unhandledRejection', (reason, promise) => {
    logError('Rechazo no manejado en:', promise, 'razón:', reason);
});
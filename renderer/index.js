// CommunityClips Renderer JavaScript
// Maneja toda la lógica de la interfaz de usuario

// Estado de la aplicación
let appState = {
    folders: [],
    clips: [],
    logs: [],
    isScanning: false,
    isAuthenticated: false,
    config: {},
    scanInterval: null
};

// Elementos del DOM
const elements = {
    // Configuración
    playerName: document.getElementById('playerName'),
    savePlayerName: document.getElementById('savePlayerName'),
    authStatus: document.getElementById('authStatus'),
    authIndicator: document.getElementById('authIndicator'),
    authText: document.getElementById('authText'),
    authButton: document.getElementById('authButton'),
    
    // Carpetas
    addFolder: document.getElementById('addFolder'),
    refreshFolders: document.getElementById('refreshFolders'),
    foldersList: document.getElementById('foldersList'),
    
    // Opciones
    deleteAfterUpload: document.getElementById('deleteAfterUpload'),
    autoUpload: document.getElementById('autoUpload'),
    scanInterval: document.getElementById('scanInterval'),
    saveInterval: document.getElementById('saveInterval'),
    
    // Controles
    uploadNow: document.getElementById('uploadNow'),
    stopScan: document.getElementById('stopScan'),
    scanStatusText: document.getElementById('scanStatusText'),
    nextScanText: document.getElementById('nextScanText'),
    
    // Progreso
    totalFiles: document.getElementById('totalFiles'),
    uploadedFiles: document.getElementById('uploadedFiles'),
    inProgressFiles: document.getElementById('inProgressFiles'),
    errorFiles: document.getElementById('errorFiles'),
    progressList: document.getElementById('progressList'),
    
    // Logs
    logsContainer: document.getElementById('logsContainer'),
    clearLogs: document.getElementById('clearLogs'),
    exportLogs: document.getElementById('exportLogs'),
    
    // Modales
    addFolderModal: document.getElementById('addFolderModal'),
    closeModal: document.getElementById('closeModal'),
    folderPath: document.getElementById('folderPath'),
    browseFolder: document.getElementById('browseFolder'),
    gameName: document.getElementById('gameName'),
    playlistId: document.getElementById('playlistId'),
    cancelAddFolder: document.getElementById('cancelAddFolder'),
    confirmAddFolder: document.getElementById('confirmAddFolder'),
    
    // Modal edición
    editFolderModal: document.getElementById('editFolderModal'),
    closeEditModal: document.getElementById('closeEditModal'),
    editGameName: document.getElementById('editGameName'),
    editPlaylistId: document.getElementById('editPlaylistId'),
    cancelEditFolder: document.getElementById('cancelEditFolder'),
    confirmEditFolder: document.getElementById('confirmEditFolder')
};

// Funciones de utilidad
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(date) {
    return new Date(date).toLocaleString('es-ES');
}

function getStatusIcon(status) {
    const icons = {
        pending: '⏳',
        uploading: '📤',
        uploaded: '✅',
        error: '❌',
        duplicate: '🔍'
    };
    return icons[status] || '❓';
}

function getStatusColor(status) {
    const colors = {
        pending: '#ffa500',
        uploading: '#007bff',
        uploaded: '#28a745',
        error: '#dc3545',
        duplicate: '#6c757d'
    };
    return colors[status] || '#6c757d';
}

// Funciones de actualización de UI
function updateAuthStatus(isAuthenticated) {
    appState.isAuthenticated = isAuthenticated;
    
    if (isAuthenticated) {
        elements.authIndicator.className = 'status-indicator status-success';
        elements.authText.textContent = 'Autenticado';
        elements.authButton.textContent = 'Cerrar Sesión';
        elements.authButton.className = 'btn btn-danger';
    } else {
        elements.authIndicator.className = 'status-indicator status-error';
        elements.authText.textContent = 'No autenticado';
        elements.authButton.textContent = 'Autenticar con Google';
        elements.authButton.className = 'btn btn-secondary';
    }
}

function updateScanStatus(isScanning) {
    appState.isScanning = isScanning;
    
    if (isScanning) {
        elements.scanStatusText.textContent = 'Escaneando...';
        elements.scanStatusText.className = 'status-scanning';
        elements.stopScan.disabled = false;
        elements.uploadNow.disabled = true;
    } else {
        elements.scanStatusText.textContent = 'Detenido';
        elements.scanStatusText.className = 'status-stopped';
        elements.stopScan.disabled = true;
        elements.uploadNow.disabled = false;
        elements.nextScanText.textContent = '--';
    }
}

function updateProgressSummary() {
    const total = appState.clips.length;
    const uploaded = appState.clips.filter(clip => clip.status === 'uploaded').length;
    const inProgress = appState.clips.filter(clip => clip.status === 'uploading').length;
    const errors = appState.clips.filter(clip => clip.status === 'error').length;
    
    elements.totalFiles.textContent = total;
    elements.uploadedFiles.textContent = uploaded;
    elements.inProgressFiles.textContent = inProgress;
    elements.errorFiles.textContent = errors;
}

function renderFolders() {
    if (!appState.folders || appState.folders.length === 0) {
        elements.foldersList.innerHTML = '<p class="no-folders">No hay carpetas configuradas. Añade una carpeta para comenzar.</p>';
        return;
    }
    
    elements.foldersList.innerHTML = appState.folders.map((folder, index) => `
        <div class="folder-item" data-index="${index}">
            <div class="folder-info">
                <div class="folder-path">${folder.path}</div>
                <div class="folder-details">
                    <span class="folder-game">🎮 ${folder.gameName || 'Sin juego'}</span>
                    <span class="folder-playlist">📋 ${folder.playlistId || 'Auto-crear'}</span>
                </div>
            </div>
            <div class="folder-actions">
                <button class="btn-icon" onclick="editFolder(${index})" title="Editar">✏️</button>
                <button class="btn-icon" onclick="removeFolder(${index})" title="Eliminar">🗑️</button>
                <button class="btn-icon" onclick="scanFolder(${index})" title="Escanear ahora">🔍</button>
            </div>
        </div>
    `).join('');
}

function renderProgressList() {
    if (appState.clips.length === 0) {
        elements.progressList.innerHTML = '<p class="no-clips">No hay clips para mostrar.</p>';
        return;
    }
    
    elements.progressList.innerHTML = appState.clips.map(clip => `
        <div class="progress-item" data-id="${clip.id}">
            <div class="progress-info">
                <div class="progress-title">
                    <span class="status-icon" style="color: ${getStatusColor(clip.status)}">${getStatusIcon(clip.status)}</span>
                    <span class="clip-name">${clip.fileName}</span>
                </div>
                <div class="progress-details">
                    <span class="clip-size">${formatFileSize(clip.fileSize)}</span>
                    <span class="clip-date">${formatDate(clip.createdAt)}</span>
                </div>
            </div>
            <div class="progress-status">
                ${clip.status === 'uploading' && clip.progress ? `
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${clip.progress}%"></div>
                    </div>
                    <span class="progress-text">${clip.progress}%</span>
                ` : `
                    <span class="status-text" style="color: ${getStatusColor(clip.status)}">${getStatusText(clip.status)}</span>
                `}
            </div>
        </div>
    `).join('');
}

function getStatusText(status) {
    const texts = {
        pending: 'Pendiente',
        uploading: 'Subiendo...',
        uploaded: 'Subido',
        error: 'Error',
        duplicate: 'Duplicado'
    };
    return texts[status] || 'Desconocido';
}

function addLog(level, message) {
    const logEntry = {
        level,
        message,
        timestamp: new Date().toISOString()
    };
    
    appState.logs.unshift(logEntry);
    if (appState.logs.length > 1000) {
        appState.logs = appState.logs.slice(0, 1000);
    }
    
    renderLogs();
}

function renderLogs() {
    if (appState.logs.length === 0) {
        elements.logsContainer.innerHTML = '<div class="log-entry"><span class="log-message">No hay registros.</span></div>';
        return;
    }
    
    elements.logsContainer.innerHTML = appState.logs.map(log => `
        <div class="log-entry">
            <span class="log-time">${new Date(log.timestamp).toLocaleTimeString('es-ES')}</span>
            <span class="log-level log-level-${log.level.toLowerCase()}">${log.level}</span>
            <span class="log-message">${log.message}</span>
        </div>
    `).join('');
}

// Funciones de configuración
async function loadConfig() {
    try {
        const config = await window.electronAPI.getConfig();
        appState.config = config;
        
        // Actualizar UI con configuración
        elements.playerName.value = config.playerName || '';
        elements.deleteAfterUpload.checked = config.deleteAfterUpload || false;
        elements.autoUpload.checked = config.autoUpload || false;
        elements.scanInterval.value = config.scanInterval || 5;
        
        appState.folders = config.folders || [];
        renderFolders();
        
        addLog('INFO', 'Configuración cargada');
    } catch (error) {
        addLog('ERROR', `Error al cargar configuración: ${error.message}`);
    }
}

async function saveConfig() {
    try {
        const newConfig = {
            ...appState.config,
            playerName: elements.playerName.value,
            deleteAfterUpload: elements.deleteAfterUpload.checked,
            autoUpload: elements.autoUpload.checked,
            scanInterval: parseInt(elements.scanInterval.value),
            folders: appState.folders
        };
        
        await window.electronAPI.saveConfig(newConfig);
        appState.config = newConfig;
        addLog('INFO', 'Configuración guardada');
    } catch (error) {
        addLog('ERROR', `Error al guardar configuración: ${error.message}`);
    }
}

// Funciones de carpetas
async function addFolder() {
    elements.addFolderModal.style.display = 'flex';
}

async function editFolder(index) {
    const folder = appState.folders[index];
    elements.editGameName.value = folder.gameName || '';
    elements.editPlaylistId.value = folder.playlistId || '';
    elements.editFolderModal.dataset.index = index;
    elements.editFolderModal.style.display = 'flex';
}

async function removeFolder(index) {
    if (confirm('¿Estás seguro de que quieres eliminar esta carpeta?')) {
        appState.folders.splice(index, 1);
        await saveConfig();
        renderFolders();
        addLog('INFO', 'Carpeta eliminada');
    }
}

async function scanFolder(index) {
    const folder = appState.folders[index];
    addLog('INFO', `Escaneando carpeta: ${folder.path}`);
    // Implementar escaneo individual
}

// Funciones de autenticación
async function handleAuth() {
    try {
        if (appState.isAuthenticated) {
            // Cerrar sesión
            await window.electronAPI.logout();
            updateAuthStatus(false);
            addLog('INFO', 'Sesión cerrada');
        } else {
            // Iniciar autenticación
            addLog('INFO', 'Iniciando autenticación...');
            await window.electronAPI.startAuth();
        }
    } catch (error) {
        addLog('ERROR', `Error de autenticación: ${error.message}`);
    }
}

// Funciones de subida
async function handleUploadNow() {
    try {
        addLog('INFO', 'Iniciando subida manual...');
        await window.electronAPI.uploadNow();
    } catch (error) {
        addLog('ERROR', `Error al iniciar subida: ${error.message}`);
    }
}

async function handleStopScan() {
    try {
        addLog('INFO', 'Deteniendo escaneo...');
        await window.electronAPI.stopScan();
    } catch (error) {
        addLog('ERROR', `Error al detener escaneo: ${error.message}`);
    }
}

// Funciones de logs
function clearLogs() {
    appState.logs = [];
    renderLogs();
    addLog('INFO', 'Logs limpiados');
}

function exportLogs() {
    const logContent = appState.logs.map(log => 
        `[${new Date(log.timestamp).toISOString()}] ${log.level}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `communityclips-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('INFO', 'Logs exportados');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar configuración inicial
    await loadConfig();
    
    // Configurar eventos
    elements.authButton.addEventListener('click', handleAuth);
    elements.uploadNow.addEventListener('click', handleUploadNow);
    elements.stopScan.addEventListener('click', handleStopScan);
    elements.clearLogs.addEventListener('click', clearLogs);
    elements.exportLogs.addEventListener('click', exportLogs);
    
    // Configuración
    elements.savePlayerName.addEventListener('click', saveConfig);
    elements.saveInterval.addEventListener('click', saveConfig);
    elements.deleteAfterUpload.addEventListener('change', saveConfig);
    elements.autoUpload.addEventListener('change', saveConfig);
    
    // Carpetas
    elements.addFolder.addEventListener('click', addFolder);
    elements.refreshFolders.addEventListener('click', loadConfig);
    
    // Modales
    elements.closeModal.addEventListener('click', () => {
        elements.addFolderModal.style.display = 'none';
    });
    
    elements.closeEditModal.addEventListener('click', () => {
        elements.editFolderModal.style.display = 'none';
    });
    
    elements.browseFolder.addEventListener('click', async () => {
        try {
            const folderPath = await window.electronAPI.selectFolder();
            if (folderPath) {
                elements.folderPath.value = folderPath;
            }
        } catch (error) {
            addLog('ERROR', `Error al seleccionar carpeta: ${error.message}`);
        }
    });
    
    elements.confirmAddFolder.addEventListener('click', async () => {
        const newFolder = {
            path: elements.folderPath.value,
            gameName: elements.gameName.value,
            playlistId: elements.playlistId.value
        };
        
        if (!newFolder.path) {
            alert('Por favor selecciona una carpeta');
            return;
        }
        
        appState.folders.push(newFolder);
        await saveConfig();
        renderFolders();
        
        // Limpiar formulario
        elements.folderPath.value = '';
        elements.gameName.value = '';
        elements.playlistId.value = '';
        
        elements.addFolderModal.style.display = 'none';
        addLog('INFO', 'Carpeta añadida');
    });
    
    elements.cancelAddFolder.addEventListener('click', () => {
        elements.addFolderModal.style.display = 'none';
    });
    
    elements.confirmEditFolder.addEventListener('click', async () => {
        const index = parseInt(elements.editFolderModal.dataset.index);
        appState.folders[index].gameName = elements.editGameName.value;
        appState.folders[index].playlistId = elements.editPlaylistId.value;
        
        await saveConfig();
        renderFolders();
        elements.editFolderModal.style.display = 'none';
        addLog('INFO', 'Carpeta actualizada');
    });
    
    elements.cancelEditFolder.addEventListener('click', () => {
        elements.editFolderModal.style.display = 'none';
    });
    
    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // Escuchar eventos del proceso principal
    window.electronAPI.onAuthStatus((event, isAuthenticated) => {
        updateAuthStatus(isAuthenticated);
    });
    
    window.electronAPI.onScanStatus((event, isScanning) => {
        updateScanStatus(isScanning);
    });
    
    window.electronAPI.onScanProgress((event, data) => {
        if (data.nextScan) {
            elements.nextScanText.textContent = new Date(data.nextScan).toLocaleTimeString('es-ES');
        }
    });
    
    window.electronAPI.onUploadProgress((event, data) => {
        // Actualizar progreso de subida
        const clipIndex = appState.clips.findIndex(clip => clip.id === data.id);
        if (clipIndex !== -1) {
            appState.clips[clipIndex] = {
                ...appState.clips[clipIndex],
                status: data.status,
                progress: data.progress || 0,
                error: data.error || null
            };
            renderProgressList();
            updateProgressSummary();
        }
    });
    
    window.electronAPI.onNewClip((event, clip) => {
        appState.clips.unshift(clip);
        renderProgressList();
        updateProgressSummary();
        addLog('INFO', `Nuevo clip detectado: ${clip.fileName}`);
    });
    
    window.electronAPI.onLog((event, level, message) => {
        addLog(level, message);
    });
    
    // Verificar estado de autenticación
    try {
        const isAuthenticated = await window.electronAPI.checkAuth();
        updateAuthStatus(isAuthenticated);
    } catch (error) {
        addLog('ERROR', `Error al verificar autenticación: ${error.message}`);
    }
    
    addLog('INFO', 'Aplicación iniciada correctamente');
});

// Hacer funciones disponibles globalmente
window.editFolder = editFolder;
window.removeFolder = removeFolder;
window.scanFolder = scanFolder;
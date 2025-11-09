const fs = require('fs-extra');
const path = require('path');
const { logInfo, logError } = require('./utils');

// Rutas de archivos de configuración
const CONFIG_FILE = path.join(__dirname, 'config.json');
const UPLOADED_FILE = path.join(__dirname, 'uploaded.json');

/**
 * Obtener configuración actual
 * @returns {Promise<Object>} Configuración actual
 */
async function getConfig() {
    try {
        const exists = await fs.pathExists(CONFIG_FILE);
        if (!exists) {
            // Retornar configuración por defecto
            return getDefaultConfig();
        }
        
        const configData = await fs.readFile(CONFIG_FILE, 'utf8');
        const config = JSON.parse(configData);
        
        // Asegurar que tenga todas las propiedades por defecto
        return {
            ...getDefaultConfig(),
            ...config
        };
    } catch (error) {
        logError('Error leyendo configuración:', error);
        return getDefaultConfig();
    }
}

/**
 * Guardar configuración
 * @param {Object} config - Configuración a guardar
 */
async function saveConfig(config) {
    try {
        // Validar configuración
        validateConfig(config);
        
        await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
        logInfo('Configuración guardada exitosamente');
    } catch (error) {
        logError('Error guardando configuración:', error);
        throw error;
    }
}

/**
 * Obtener configuración por defecto
 * @returns {Object} Configuración por defecto
 */
function getDefaultConfig() {
    return {
        playerName: '',
        folders: [],
        autoUpload: false,
        scanInterval: 5, // minutos
        deleteAfterUpload: false,
        privacy: 'unlisted',
        maxConcurrentUploads: 2,
        videoFormats: ['.mp4', '.mov', '.mkv', '.avi', '.wmv', '.flv', '.webm']
    };
}

/**
 * Validar configuración
 * @param {Object} config - Configuración a validar
 * @throws {Error} Si la configuración es inválida
 */
function validateConfig(config) {
    if (!config) {
        throw new Error('Configuración no puede estar vacía');
    }
    
    if (config.playerName && typeof config.playerName !== 'string') {
        throw new Error('Nombre del jugador debe ser un string');
    }
    
    if (config.folders && !Array.isArray(config.folders)) {
        throw new Error('Folders debe ser un array');
    }
    
    if (config.autoUpload && typeof config.autoUpload !== 'boolean') {
        throw new Error('Auto-upload debe ser booleano');
    }
    
    if (config.scanInterval && (typeof config.scanInterval !== 'number' || config.scanInterval < 1)) {
        throw new Error('Intervalo de escaneo debe ser un número mayor a 0');
    }
    
    if (config.deleteAfterUpload && typeof config.deleteAfterUpload !== 'boolean') {
        throw new Error('Delete after upload debe ser booleano');
    }
}

/**
 * Obtener lista de archivos subidos
 * @returns {Promise<Array>} Lista de archivos subidos
 */
async function getUploadedFiles() {
    try {
        const exists = await fs.pathExists(UPLOADED_FILE);
        if (!exists) {
            return [];
        }
        
        const uploadedData = await fs.readFile(UPLOADED_FILE, 'utf8');
        return JSON.parse(uploadedData);
    } catch (error) {
        logError('Error leyendo archivo de subidos:', error);
        return [];
    }
}

/**
 * Agregar archivo a la lista de subidos
 * @param {Object} fileInfo - Información del archivo subido
 */
async function addUploadedFile(fileInfo) {
    try {
        const uploadedFiles = await getUploadedFiles();
        
        // Agregar nuevo archivo
        uploadedFiles.push({
            ...fileInfo,
            timestamp: new Date().toISOString()
        });
        
        // Limitar a últimos 1000 archivos para evitar crecimiento excesivo
        if (uploadedFiles.length > 1000) {
            uploadedFiles.splice(0, uploadedFiles.length - 1000);
        }
        
        await fs.writeFile(UPLOADED_FILE, JSON.stringify(uploadedFiles, null, 2), 'utf8');
        logInfo(`Archivo agregado a subidos: ${fileInfo.filePath}`);
    } catch (error) {
        logError('Error agregando archivo a subidos:', error);
        throw error;
    }
}

/**
 * Verificar si un archivo ya fue subido
 * @param {string} fileHash - Hash del archivo
 * @param {string} filePath - Ruta del archivo
 * @returns {Promise<boolean>} true si ya fue subido
 */
async function isFileUploaded(fileHash, filePath) {
    try {
        const uploadedFiles = await getUploadedFiles();
        
        return uploadedFiles.some(file => 
            file.fileHash === fileHash || file.filePath === filePath
        );
    } catch (error) {
        logError('Error verificando si archivo fue subido:', error);
        return false;
    }
}

/**
 * Limpiar archivos subidos antiguos (mayores a 30 días)
 */
async function cleanupOldUploads() {
    try {
        const uploadedFiles = await getUploadedFiles();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const filteredFiles = uploadedFiles.filter(file => {
            const fileDate = new Date(file.timestamp);
            return fileDate > thirtyDaysAgo;
        });
        
        if (filteredFiles.length < uploadedFiles.length) {
            await fs.writeFile(UPLOADED_FILE, JSON.stringify(filteredFiles, null, 2), 'utf8');
            logInfo(`Limpieza completada: ${uploadedFiles.length - filteredFiles} archivos antiguos eliminados`);
        }
    } catch (error) {
        logError('Error limpiando archivos subidos antiguos:', error);
    }
}

/**
 * Inicializar archivos de configuración si no existen
 */
async function initializeConfigFiles() {
    try {
        // Crear config.json si no existe
        const configExists = await fs.pathExists(CONFIG_FILE);
        if (!configExists) {
            await fs.writeFile(CONFIG_FILE, JSON.stringify(getDefaultConfig(), null, 2), 'utf8');
            logInfo('Archivo config.json creado con configuración por defecto');
        }
        
        // Crear uploaded.json si no existe
        const uploadedExists = await fs.pathExists(UPLOADED_FILE);
        if (!uploadedExists) {
            await fs.writeFile(UPLOADED_FILE, JSON.stringify([], null, 2), 'utf8');
            logInfo('Archivo uploaded.json creado');
        }
        
        // Limpiar archivos antiguos
        await cleanupOldUploads();
        
    } catch (error) {
        logError('Error inicializando archivos de configuración:', error);
        throw error;
    }
}

module.exports = {
    getConfig,
    saveConfig,
    getDefaultConfig,
    getUploadedFiles,
    addUploadedFile,
    isFileUploaded,
    cleanupOldUploads,
    initializeConfigFiles
};
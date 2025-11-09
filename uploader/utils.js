const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');

// Configuración de logging
const LOG_FILE = path.join(__dirname, 'upload.log');
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Calcular hash SHA-1 de un archivo
 * @param {string} filePath - Ruta del archivo
 * @returns {Promise<string>} Hash del archivo
 */
async function calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha1');
        const stream = fs.createReadStream(filePath);
        
        stream.on('error', reject);
        stream.on('data', chunk => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}

/**
 * Verificar si un archivo está completo (tamaño estable)
 * @param {string} filePath - Ruta del archivo
 * @param {number} stabilityTime - Tiempo de estabilidad en ms (default: 10000ms)
 * @returns {Promise<boolean>} true si el archivo está completo
 */
async function isFileComplete(filePath, stabilityTime = 10000) {
    try {
        const stats1 = await fs.stat(filePath);
        const size1 = stats1.size;
        
        // Esperar el tiempo de estabilidad
        await new Promise(resolve => setTimeout(resolve, stabilityTime));
        
        const stats2 = await fs.stat(filePath);
        const size2 = stats2.size;
        
        return size1 === size2 && size1 > 0;
    } catch (error) {
        logError('Error verificando archivo completo:', error);
        return false;
    }
}

/**
 * Formatear tamaño de archivo en formato humano legible
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} Tamaño formateado
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formatear fecha en formato legible
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatDate(date) {
    return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * Rotar archivo de log si excede el tamaño máximo
 */
async function rotateLogIfNeeded() {
    try {
        const exists = await fs.pathExists(LOG_FILE);
        if (!exists) return;
        
        const stats = await fs.stat(LOG_FILE);
        if (stats.size > MAX_LOG_SIZE) {
            const backupFile = LOG_FILE + '.old';
            await fs.move(LOG_FILE, backupFile, { overwrite: true });
        }
    } catch (error) {
        console.error('Error rotando log:', error);
    }
}

/**
 * Escribir mensaje de información al log
 * @param {string} message - Mensaje a loggear
 * @param {...any} args - Argumentos adicionales
 */
async function logInfo(message, ...args) {
    const timestamp = new Date().toISOString();
    const logMessage = `[INFO] ${timestamp} - ${message}`;
    
    console.log(logMessage, ...args);
    
    try {
        await rotateLogIfNeeded();
        const logEntry = logMessage + (args.length > 0 ? ' ' + JSON.stringify(args) : '') + '\n';
        await fs.appendFile(LOG_FILE, logEntry);
    } catch (error) {
        console.error('Error escribiendo log:', error);
    }
}

/**
 * Escribir mensaje de error al log
 * @param {string} message - Mensaje de error
 * @param {Error|any} error - Error a loggear
 * @param {...any} args - Argumentos adicionales
 */
async function logError(message, error, ...args) {
    const timestamp = new Date().toISOString();
    const errorMessage = `[ERROR] ${timestamp} - ${message}`;
    
    console.error(errorMessage, error, ...args);
    
    try {
        await rotateLogIfNeeded();
        let logEntry = errorMessage + '\n';
        
        if (error) {
            if (error instanceof Error) {
                logEntry += `Error: ${error.message}\nStack: ${error.stack}\n`;
            } else {
                logEntry += `Error: ${JSON.stringify(error)}\n`;
            }
        }
        
        if (args.length > 0) {
            logEntry += `Args: ${JSON.stringify(args)}\n`;
        }
        
        await fs.appendFile(LOG_FILE, logEntry);
    } catch (logError) {
        console.error('Error escribiendo log de error:', logError);
    }
}

/**
 * Obtener extensión de archivo de video válida
 * @param {string} filename - Nombre del archivo
 * @returns {boolean} true si es un archivo de video válido
 */
function isValidVideoFile(filename) {
    const validExtensions = ['.mp4', '.mov', '.mkv', '.avi', '.wmv', '.flv', '.webm'];
    const ext = path.extname(filename).toLowerCase();
    return validExtensions.includes(ext);
}

/**
 * Generar título de video basado en el nombre del jugador, juego y archivo
 * @param {string} playerName - Nombre del jugador
 * @param {string} gameName - Nombre del juego
 * @param {string} filename - Nombre del archivo
 * @returns {string} Título generado
 */
function generateVideoTitle(playerName, gameName, filename) {
    const cleanFilename = path.basename(filename, path.extname(filename));
    return `[${playerName}] - [${gameName}] - [${cleanFilename}]`;
}

/**
 * Retraso con promesa
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise<void>} Promesa que se resuelve después del retraso
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Reintentar una función con backoff exponencial
 * @param {Function} fn - Función a ejecutar
 * @param {number} maxRetries - Máximo de reintentos
 * @param {number} baseDelay - Retraso base en ms
 * @returns {Promise<any>} Resultado de la función
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            if (i < maxRetries - 1) {
                const delayTime = baseDelay * Math.pow(2, i);
                logInfo(`Reintentando en ${delayTime}ms (intento ${i + 1}/${maxRetries})`);
                await delay(delayTime);
            }
        }
    }
    
    throw lastError;
}

module.exports = {
    calculateFileHash,
    isFileComplete,
    formatFileSize,
    formatDate,
    logInfo,
    logError,
    isValidVideoFile,
    generateVideoTitle,
    delay,
    retryWithBackoff
};
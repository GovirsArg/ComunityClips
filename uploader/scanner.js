const fs = require('fs-extra');
const path = require('path');
const PQueue = require('p-queue');
const { calculateFileHash, isFileComplete, isValidVideoFile, logInfo, logError, generateVideoTitle } = require('./utils');
const { uploadVideo, createOrGetPlaylist } = require('./youtubeUploader');
const { getConfig } = require('./config');

/**
 * Escanear carpetas en busca de clips nuevos
 * @param {Array} folders - Array de carpetas configuradas
 * @param {Object} config - Configuración actual
 * @param {Function} onProgress - Callback de progreso
 * @returns {Promise<Object>} Resultados del escaneo
 */
async function scanFolders(folders, config, onProgress = null) {
    try {
        logInfo(`Iniciando escaneo de ${folders.length} carpetas`);
        
        const results = {
            scanned: 0,
            found: 0,
            uploaded: 0,
            skipped: 0,
            errors: 0,
            details: []
        };
        
        // Crear cola de procesamiento con límite de concurrencia
        const queue = new PQueue({ concurrency: config.maxConcurrentUploads || 2 });
        
        // Procesar cada carpeta
        for (const folder of folders) {
            try {
                logInfo(`Escaneando carpeta: ${folder.path}`);
                
                // Verificar que la carpeta existe
                const folderExists = await fs.pathExists(folder.path);
                if (!folderExists) {
                    logError(`Carpeta no encontrada: ${folder.path}`);
                    results.errors++;
                    results.details.push({
                        folder: folder.path,
                        status: 'error',
                        error: 'Carpeta no encontrada'
                    });
                    continue;
                }
                
                // Obtener o crear playlist
                let playlistId = folder.playlistId;
                if (!playlistId && folder.gameName) {
                    try {
                        playlistId = await createOrGetPlaylist(folder.gameName);
                        folder.playlistId = playlistId;
                        
                        // Actualizar configuración con el nuevo playlistId
                        const currentConfig = await getConfig();
                        const folderIndex = currentConfig.folders.findIndex(f => f.path === folder.path);
                        if (folderIndex !== -1) {
                            currentConfig.folders[folderIndex].playlistId = playlistId;
                            await require('./config').saveConfig(currentConfig);
                        }
                        
                    } catch (error) {
                        logError(`Error creando playlist para ${folder.gameName}:`, error);
                        results.errors++;
                        results.details.push({
                            folder: folder.path,
                            status: 'error',
                            error: `Error creando playlist: ${error.message}`
                        });
                        continue;
                    }
                }
                
                // Buscar archivos de video
                const videoFiles = await findVideoFiles(folder.path, config.videoFormats);
                results.scanned += videoFiles.length;
                
                // Procesar cada archivo
                for (const file of videoFiles) {
                    try {
                        results.found++;
                        
                        // Reportar progreso
                        if (onProgress) {
                            onProgress({
                                file: path.basename(file),
                                folder: folder.path,
                                status: 'scanning',
                                progress: 0
                            });
                        }
                        
                        // Encolar subida
                        queue.add(async () => {
                            try {
                                const uploadResult = await processVideoFile(
                                    file,
                                    folder,
                                    config,
                                    onProgress
                                );
                                
                                if (uploadResult.success) {
                                    if (uploadResult.skipped) {
                                        results.skipped++;
                                    } else {
                                        results.uploaded++;
                                    }
                                } else {
                                    results.errors++;
                                }
                                
                                results.details.push({
                                    file: path.basename(file),
                                    folder: folder.path,
                                    ...uploadResult
                                });
                                
                            } catch (error) {
                                results.errors++;
                                results.details.push({
                                    file: path.basename(file),
                                    folder: folder.path,
                                    status: 'error',
                                    error: error.message
                                });
                                logError(`Error procesando archivo ${file}:`, error);
                            }
                        });
                        
                    } catch (error) {
                        results.errors++;
                        results.details.push({
                            file: path.basename(file),
                            folder: folder.path,
                            status: 'error',
                            error: error.message
                        });
                        logError(`Error procesando archivo ${file}:`, error);
                    }
                }
                
            } catch (error) {
                results.errors++;
                results.details.push({
                    folder: folder.path,
                    status: 'error',
                    error: error.message
                });
                logError(`Error escaneando carpeta ${folder.path}:`, error);
            }
        }
        
        // Esperar a que termine la cola
        await queue.onIdle();
        
        logInfo(`Escaneo completado. Encontrados: ${results.found}, Subidos: ${results.uploaded}, Omitidos: ${results.skipped}, Errores: ${results.errors}`);
        
        return results;
        
    } catch (error) {
        logError('Error en escaneo de carpetas:', error);
        throw error;
    }
}

/**
 * Buscar archivos de video en una carpeta
 * @param {string} folderPath - Ruta de la carpeta
 * @param {Array} videoFormats - Formatos de video válidos
 * @returns {Promise<Array>} Array de rutas de archivos
 */
async function findVideoFiles(folderPath, videoFormats) {
    try {
        const files = await fs.readdir(folderPath);
        const videoFiles = [];
        
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stats = await fs.stat(filePath);
            
            // Solo archivos (no carpetas)
            if (stats.isFile()) {
                // Verificar extensión
                if (isValidVideoFile(file)) {
                    videoFiles.push(filePath);
                }
            }
        }
        
        return videoFiles;
        
    } catch (error) {
        logError(`Error buscando archivos en ${folderPath}:`, error);
        throw error;
    }
}

/**
 * Procesar archivo de video
 * @param {string} filePath - Ruta del archivo
 * @param {Object} folder - Información de la carpeta
 * @param {Object} config - Configuración
 * @param {Function} onProgress - Callback de progreso
 * @returns {Promise<Object>} Resultado del procesamiento
 */
async function processVideoFile(filePath, folder, config, onProgress = null) {
    try {
        const fileName = path.basename(filePath);
        
        logInfo(`Procesando archivo: ${fileName}`);
        
        // Verificar que el archivo esté completo
        const isComplete = await isFileComplete(filePath);
        if (!isComplete) {
            return {
                success: false,
                skipped: true,
                message: 'Archivo aún en proceso de escritura'
            };
        }
        
        // Generar título del video
        const title = generateVideoTitle(
            config.playerName,
            folder.gameName,
            fileName
        );
        
        // Configurar opciones de subida
        const uploadOptions = {
            privacy: config.privacy || 'unlisted',
            deleteAfterUpload: config.deleteAfterUpload || false,
            onProgress: onProgress
        };
        
        // Subir video
        const uploadResult = await uploadVideo(
            filePath,
            title,
            folder.description || '',
            folder.playlistId,
            uploadOptions
        );
        
        logInfo(`Archivo procesado exitosamente: ${fileName}`);
        
        return {
            success: true,
            skipped: false,
            videoId: uploadResult.videoId,
            playlistId: uploadResult.playlistId,
            title: title,
            message: 'Video subido exitosamente'
        };
        
    } catch (error) {
        logError(`Error procesando archivo ${filePath}:`, error);
        
        return {
            success: false,
            skipped: false,
            error: error.message,
            message: `Error: ${error.message}`
        };
    }
}

/**
 * Monitorear cambios en carpetas (opcional - para futuras versiones)
 * @param {Array} folders - Carpetas a monitorear
 * @param {Function} onChange - Callback cuando hay cambios
 */
function watchFolders(folders, onChange) {
    // Esta función podría implementarse con chokidar o fs.watch
    // Por ahora, usamos el escaneo periódico con setInterval
    logInfo('Monitoreo de carpetas no implementado - usando escaneo periódico');
}

/**
 * Obtener estadísticas de escaneo
 * @returns {Promise<Object>} Estadísticas
 */
async function getScanStats() {
    try {
        const config = await getConfig();
        const stats = {
            totalFolders: config.folders.length,
            autoUpload: config.autoUpload,
            scanInterval: config.scanInterval,
            lastScan: null
        };
        
        return stats;
    } catch (error) {
        logError('Error obteniendo estadísticas de escaneo:', error);
        throw error;
    }
}

module.exports = {
    scanFolders,
    findVideoFiles,
    processVideoFile,
    watchFolders,
    getScanStats
};
const { google } = require('googleapis');
const fs = require('fs-extra');
const path = require('path');
const { getOAuthClient } = require('./auth');
const { calculateFileHash, isFileComplete, logInfo, logError, formatFileSize, retryWithBackoff } = require('./utils');
const { addUploadedFile, isFileUploaded } = require('./config');

/**
 * Subir video a YouTube
 * @param {string} filePath - Ruta del archivo de video
 * @param {string} title - Título del video
 * @param {string} description - Descripción del video
 * @param {string} playlistId - ID de la playlist (opcional)
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} Resultado de la subida
 */
async function uploadVideo(filePath, title, description, playlistId = null, options = {}) {
    try {
        // Verificar que el archivo existe y está completo
        const exists = await fs.pathExists(filePath);
        if (!exists) {
            throw new Error(`Archivo no encontrado: ${filePath}`);
        }
        
        const isComplete = await isFileComplete(filePath);
        if (!isComplete) {
            throw new Error(`Archivo aún en proceso de escritura: ${filePath}`);
        }
        
        // Calcular hash del archivo
        const fileHash = await calculateFileHash(filePath);
        
        // Verificar si ya fue subido
        const alreadyUploaded = await isFileUploaded(fileHash, filePath);
        if (alreadyUploaded) {
            logInfo(`Archivo ya subido previamente: ${filePath}`);
            return {
                success: true,
                skipped: true,
                message: 'Archivo ya subido previamente'
            };
        }
        
        // Obtener estadísticas del archivo
        const stats = await fs.stat(filePath);
        const fileSize = stats.size;
        
        logInfo(`Iniciando subida de: ${path.basename(filePath)} (${formatFileSize(fileSize)})`);
        
        // Obtener cliente OAuth2
        const auth = getOAuthClient();
        const youtube = google.youtube({ version: 'v3', auth });
        
        // Configurar parámetros del video
        const videoParams = {
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title: title,
                    description: description || 'Clip subido automáticamente por CommunityClips.',
                    tags: ['gaming', 'clips', 'automatic'],
                    categoryId: '20' // Gaming
                },
                status: {
                    privacyStatus: options.privacy || 'unlisted'
                }
            },
            media: {
                body: fs.createReadStream(filePath)
            }
        };
        
        // Subir video con reintentos
        const response = await retryWithBackoff(async () => {
            return await youtube.videos.insert(videoParams, {
                onUploadProgress: (evt) => {
                    if (evt.bytesRead && fileSize) {
                        const progress = Math.round((evt.bytesRead / fileSize) * 100);
                        logInfo(`Progreso de subida: ${progress}%`);
                        
                        // Enviar progreso al renderer
                        if (options.onProgress) {
                            options.onProgress({
                                file: path.basename(filePath),
                                progress: progress,
                                status: 'uploading'
                            });
                        }
                    }
                }
            });
        }, 3, 2000);
        
        const videoId = response.data.id;
        logInfo(`Video subido exitosamente. ID: ${videoId}`);
        
        // Agregar a playlist si se especificó
        if (playlistId) {
            await addToPlaylist(videoId, playlistId);
        }
        
        // Registrar en archivo de subidos
        await addUploadedFile({
            fileHash: fileHash,
            filePath: filePath,
            youtubeId: videoId,
            title: title,
            uploadedAt: new Date().toISOString()
        });
        
        // Eliminar archivo local si está habilitado
        if (options.deleteAfterUpload) {
            try {
                await fs.unlink(filePath);
                logInfo(`Archivo local eliminado: ${filePath}`);
            } catch (deleteError) {
                logError(`Error eliminando archivo local: ${filePath}`, deleteError);
                // No fallar la subida si no se puede eliminar el archivo
            }
        }
        
        return {
            success: true,
            videoId: videoId,
            playlistId: playlistId,
            filePath: filePath,
            title: title
        };
        
    } catch (error) {
        logError(`Error subiendo video ${filePath}:`, error);
        
        // Enviar error al renderer
        if (options.onProgress) {
            options.onProgress({
                file: path.basename(filePath),
                progress: 0,
                status: 'error',
                error: error.message
            });
        }
        
        throw error;
    }
}

/**
 * Agregar video a playlist
 * @param {string} videoId - ID del video
 * @param {string} playlistId - ID de la playlist
 * @returns {Promise<Object>} Resultado de la operación
 */
async function addToPlaylist(videoId, playlistId) {
    try {
        const auth = getOAuthClient();
        const youtube = google.youtube({ version: 'v3', auth });
        
        const response = await youtube.playlistItems.insert({
            part: 'snippet',
            requestBody: {
                snippet: {
                    playlistId: playlistId,
                    resourceId: {
                        kind: 'youtube#video',
                        videoId: videoId
                    }
                }
            }
        });
        
        logInfo(`Video agregado a playlist: ${playlistId}`);
        return response.data;
        
    } catch (error) {
        logError(`Error agregando video a playlist:`, error);
        throw error;
    }
}

/**
 * Crear playlist o obtener existente
 * @param {string} gameName - Nombre del juego
 * @param {string} description - Descripción de la playlist (opcional)
 * @returns {Promise<string>} ID de la playlist
 */
async function createOrGetPlaylist(gameName, description = '') {
    try {
        const auth = getOAuthClient();
        const youtube = google.youtube({ version: 'v3', auth });
        
        // Buscar playlist existente
        const searchResponse = await youtube.playlists.list({
            part: 'snippet',
            mine: true,
            maxResults: 50
        });
        
        // Buscar por nombre exacto
        const existingPlaylist = searchResponse.data.items.find(playlist => 
            playlist.snippet.title.toLowerCase() === gameName.toLowerCase()
        );
        
        if (existingPlaylist) {
            logInfo(`Playlist existente encontrada: ${gameName} (${existingPlaylist.id})`);
            return existingPlaylist.id;
        }
        
        // Crear nueva playlist
        logInfo(`Creando nueva playlist: ${gameName}`);
        
        const createResponse = await youtube.playlists.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title: gameName,
                    description: description || `Clips de ${gameName} subidos automáticamente`
                },
                status: {
                    privacyStatus: 'unlisted'
                }
            }
        });
        
        const playlistId = createResponse.data.id;
        logInfo(`Playlist creada exitosamente: ${gameName} (${playlistId})`);
        
        return playlistId;
        
    } catch (error) {
        logError(`Error creando/obteniendo playlist:`, error);
        throw error;
    }
}

/**
 * Obtener información de una playlist
 * @param {string} playlistId - ID de la playlist
 * @returns {Promise<Object>} Información de la playlist
 */
async function getPlaylistInfo(playlistId) {
    try {
        const auth = getOAuthClient();
        const youtube = google.youtube({ version: 'v3', auth });
        
        const response = await youtube.playlists.list({
            part: 'snippet,contentDetails',
            id: playlistId
        });
        
        if (response.data.items.length === 0) {
            throw new Error(`Playlist no encontrada: ${playlistId}`);
        }
        
        return response.data.items[0];
        
    } catch (error) {
        logError(`Error obteniendo información de playlist:`, error);
        throw error;
    }
}

/**
 * Obtener videos de una playlist
 * @param {string} playlistId - ID de la playlist
 * @param {number} maxResults - Máximo de resultados (default: 50)
 * @returns {Promise<Array>} Lista de videos
 */
async function getPlaylistVideos(playlistId, maxResults = 50) {
    try {
        const auth = getOAuthClient();
        const youtube = google.youtube({ version: 'v3', auth });
        
        const response = await youtube.playlistItems.list({
            part: 'snippet',
            playlistId: playlistId,
            maxResults: maxResults
        });
        
        return response.data.items;
        
    } catch (error) {
        logError(`Error obteniendo videos de playlist:`, error);
        throw error;
    }
}

/**
 * Verificar cuota disponible (aproximada)
 * @returns {Promise<Object>} Información de cuota
 */
async function checkQuota() {
    try {
        // YouTube Data API v3 tiene un límite de 10,000 unidades por día
        // Una subida de video consume aproximadamente 1600 unidades
        // Esta función es una aproximación ya que la API no proporciona cuota real en tiempo real
        
        const auth = getOAuthClient();
        const youtube = google.youtube({ version: 'v3', auth });
        
        // Hacer una llamada simple para verificar si podemos acceder a la API
        await youtube.channels.list({
            part: 'snippet',
            mine: true,
            maxResults: 1
        });
        
        return {
            hasQuota: true,
            message: 'Cuota disponible'
        };
        
    } catch (error) {
        if (error.code === 403 && error.message.includes('quota')) {
            return {
                hasQuota: false,
                message: 'Cuota agotada. Intenta mañana.'
            };
        }
        
        logError('Error verificando cuota:', error);
        throw error;
    }
}

module.exports = {
    uploadVideo,
    addToPlaylist,
    createOrGetPlaylist,
    getPlaylistInfo,
    getPlaylistVideos,
    checkQuota
};
const { google } = require('googleapis');
const { BrowserWindow } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const { logInfo, logError } = require('./utils');

// Cargar variables de entorno
require('dotenv').config();

// Rutas de archivos
const TOKEN_PATH = path.join(__dirname, 'token.json');
const SCOPES = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube'
];

let oauth2Client = null;

/**
 * Crear cliente OAuth2
 * @returns {OAuth2Client} Cliente OAuth2 configurado
 */
function createOAuth2Client() {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';
    
    if (!clientId || !clientSecret) {
        throw new Error('Faltan credenciales de YouTube. Por favor configura YOUTUBE_CLIENT_ID y YOUTUBE_CLIENT_SECRET en tu archivo .env');
    }
    
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Cargar token guardado
 * @returns {Promise<Object|null>} Token guardado o null
 */
async function loadToken() {
    try {
        const exists = await fs.pathExists(TOKEN_PATH);
        if (!exists) {
            return null;
        }
        
        const tokenData = await fs.readFile(TOKEN_PATH, 'utf8');
        return JSON.parse(tokenData);
    } catch (error) {
        logError('Error cargando token:', error);
        return null;
    }
}

/**
 * Guardar token
 * @param {Object} token - Token a guardar
 */
async function saveToken(token) {
    try {
        await fs.writeFile(TOKEN_PATH, JSON.stringify(token, null, 2), 'utf8');
        logInfo('Token guardado exitosamente');
    } catch (error) {
        logError('Error guardando token:', error);
        throw error;
    }
}

/**
 * Refrescar token si es necesario
 * @returns {Promise<boolean>} true si el token es válido o fue refrescado
 */
async function refreshTokenIfNeeded() {
    try {
        if (!oauth2Client.credentials) {
            return false;
        }
        
        // Verificar si el token está expirado
        const expiryDate = oauth2Client.credentials.expiry_date;
        if (expiryDate && Date.now() >= expiryDate - 60000) { // Refrescar 1 minuto antes
            logInfo('Token expirado, refrescando...');
            
            const { credentials } = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(credentials);
            await saveToken(credentials);
            
            logInfo('Token refrescado exitosamente');
            return true;
        }
        
        return true;
    } catch (error) {
        logError('Error refrescando token:', error);
        return false;
    }
}

/**
 * Obtener URL de autorización
 * @returns {string} URL de autorización
 */
function getAuthUrl() {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent' // Solicitar refresh token
    });
    
    return authUrl;
}

/**
 * Manejar callback de OAuth
 * @param {string} code - Código de autorización
 * @returns {Promise<Object>} Credenciales obtenidas
 */
async function handleCallback(code) {
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        await saveToken(tokens);
        
        logInfo('Autorización completada exitosamente');
        return tokens;
    } catch (error) {
        logError('Error en callback de OAuth:', error);
        throw error;
    }
}

/**
 * Proceso de autorización completo
 * @returns {Promise<OAuth2Client>} Cliente OAuth2 autorizado
 */
async function authorize() {
    try {
        // Crear cliente OAuth2
        oauth2Client = createOAuth2Client();
        
        // Intentar cargar token existente
        const savedToken = await loadToken();
        if (savedToken) {
            oauth2Client.setCredentials(savedToken);
            
            // Verificar si el token es válido o refrescarlo
            const isValid = await refreshTokenIfNeeded();
            if (isValid) {
                logInfo('Autenticación exitosa con token existente');
                return oauth2Client;
            }
        }
        
        // Si no hay token válido, iniciar flujo de autorización
        logInfo('Iniciando flujo de autorización de OAuth...');
        
        return new Promise((resolve, reject) => {
            // Crear ventana de autorización
            authWindow = new BrowserWindow({
                width: 600,
                height: 700,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                },
                title: 'Autorizar acceso a YouTube'
            });
            
            const authUrl = getAuthUrl();
            authWindow.loadURL(authUrl);
            
            // Manejar redirección
            authWindow.webContents.on('will-navigate', async (event, url) => {
                try {
                    if (url.startsWith(process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/oauth2callback')) {
                        event.preventDefault();
                        
                        const urlObj = new URL(url);
                        const code = urlObj.searchParams.get('code');
                        const error = urlObj.searchParams.get('error');
                        
                        if (error) {
                            throw new Error(`Error de autorización: ${error}`);
                        }
                        
                        if (code) {
                            const tokens = await handleCallback(code);
                            authWindow.close();
                            authWindow = null;
                            resolve(oauth2Client);
                        } else {
                            throw new Error('No se recibió código de autorización');
                        }
                    }
                } catch (err) {
                    authWindow.close();
                    authWindow = null;
                    reject(err);
                }
            });
            
            // Manejar cierre de ventana
            authWindow.on('closed', () => {
                authWindow = null;
                reject(new Error('Ventana de autorización cerrada por el usuario'));
            });
            
            // Manejar errores de carga
            authWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
                logError('Error cargando ventana de autorización:', errorDescription);
                authWindow.close();
                authWindow = null;
                reject(new Error(`Error cargando ventana de autorización: ${errorDescription}`));
            });
        });
        
    } catch (error) {
        logError('Error en proceso de autorización:', error);
        throw error;
    }
}

/**
 * Obtener cliente OAuth2 (debe llamarse después de authorize())
 * @returns {OAuth2Client} Cliente OAuth2
 */
function getOAuthClient() {
    if (!oauth2Client) {
        throw new Error('Cliente OAuth2 no inicializado. Llama a authorize() primero.');
    }
    
    return oauth2Client;
}

/**
 * Revocar acceso (opcional)
 */
async function revokeAccess() {
    try {
        if (oauth2Client && oauth2Client.credentials) {
            await oauth2Client.revokeCredentials();
            
            // Eliminar token guardado
            await fs.remove(TOKEN_PATH);
            
            logInfo('Acceso revocado exitosamente');
        }
    } catch (error) {
        logError('Error revocando acceso:', error);
        throw error;
    }
}

/**
 * Verificar si el usuario está autenticado
 * @returns {Promise<boolean>} true si está autenticado
 */
async function isAuthenticated() {
    try {
        if (!oauth2Client) {
            return false;
        }
        
        return await refreshTokenIfNeeded();
    } catch (error) {
        logError('Error verificando autenticación:', error);
        return false;
    }
}

module.exports = {
    authorize,
    getOAuthClient,
    revokeAccess,
    isAuthenticated,
    loadToken,
    saveToken
};
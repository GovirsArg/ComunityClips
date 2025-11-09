const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Estado de la aplicación
let appState = {
  status: 'ready',
  config: {},
  clips: [],
  uploadQueue: [],
  logs: []
};

// Crear directorio público si no existe
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// HTML de la interfaz web
const htmlInterface = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CommunityClips Web</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.1em; opacity: 0.9; }
        .content { padding: 30px; }
        .section {
            margin-bottom: 30px;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 4px solid #4ECDC4;
        }
        .section h2 { color: #333; margin-bottom: 15px; font-size: 1.4em; }
        .config-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .config-item {
            display: flex;
            flex-direction: column;
        }
        .config-item label {
            font-weight: 600;
            margin-bottom: 5px;
            color: #555;
        }
        .config-item input, .config-item select {
            padding: 12px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        .config-item input:focus, .config-item select:focus {
            outline: none;
            border-color: #4ECDC4;
        }
        .btn {
            background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: transform 0.2s;
            margin: 5px;
        }
        .btn:hover { transform: translateY(-2px); }
        .btn-secondary { background: #6c757d; }
        .btn-success { background: #28a745; }
        .status {
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            font-weight: 600;
        }
        .status.ready { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .status.scanning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .status.uploading { background: #cce5ff; color: #004085; border: 1px solid #b8daff; }
        .clips-list {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
            background: white;
        }
        .clip-item {
            padding: 10px;
            border-bottom: 1px solid #f1f3f4;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .clip-item:last-child { border-bottom: none; }
        .clip-name { font-weight: 600; color: #333; }
        .clip-status { 
            padding: 4px 12px; 
            border-radius: 15px; 
            font-size: 12px; 
            font-weight: 600;
        }
        .status-pending { background: #ffc107; color: #212529; }
        .status-uploaded { background: #28a745; color: white; }
        .status-error { background: #dc3545; color: white; }
        .logs {
            background: #2d3748;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-height: 200px;
            overflow-y: auto;
            margin-top: 15px;
        }
        .folder-input {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
        .folder-input input {
            flex: 1;
        }
        @media (max-width: 768px) {
            .config-grid { grid-template-columns: 1fr; }
            .header h1 { font-size: 2em; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 CommunityClips Web</h1>
            <p>Sube tus clips de juego a YouTube automáticamente</p>
        </div>
        
        <div class="content">
            <!-- Configuración -->
            <div class="section">
                <h2>⚙️ Configuración</h2>
                <div class="config-grid">
                    <div class="config-item">
                        <label>Google Client ID:</label>
                        <input type="text" id="googleClientId" placeholder="Tu Google Client ID">
                    </div>
                    <div class="config-item">
                        <label>Google Client Secret:</label>
                        <input type="password" id="googleClientSecret" placeholder="Tu Google Client Secret">
                    </div>
                    <div class="config-item">
                        <label>Refresh Token:</label>
                        <input type="password" id="refreshToken" placeholder="Tu Refresh Token">
                    </div>
                    <div class="config-item">
                        <label>Carpeta de clips:</label>
                        <div class="folder-input">
                            <input type="text" id="clipsFolder" placeholder="C:\ruta\a\tus\clips">
                            <button class="btn btn-secondary" onclick="selectFolder()">📁</button>
                        </div>
                    </div>
                    <div class="config-item">
                        <label>Frecuencia de escaneo (minutos):</label>
                        <input type="number" id="scanInterval" value="5" min="1" max="60">
                    </div>
                </div>
                <button class="btn" onclick="saveConfig()">💾 Guardar Configuración</button>
                <button class="btn btn-secondary" onclick="loadConfig()">🔄 Cargar Configuración</button>
            </div>

            <!-- Control -->
            <div class="section">
                <h2>🎮 Control</h2>
                <div id="status" class="status ready">Estado: Listo</div>
                <div style="text-align: center; margin: 20px 0;">
                    <button class="btn btn-success" onclick="startScanning()">🔍 Escanear Ahora</button>
                    <button class="btn" onclick="startAutoScan()">▶️ Auto-Escanear</button>
                    <button class="btn btn-secondary" onclick="stopAutoScan()">⏹️ Detener</button>
                </div>
            </div>

            <!-- Clips -->
            <div class="section">
                <h2>📹 Clips Encontrados</h2>
                <div id="clipsList" class="clips-list">
                    <p style="text-align: center; color: #666;">No hay clips escaneados aún</p>
                </div>
            </div>

            <!-- Logs -->
            <div class="section">
                <h2>📋 Logs</h2>
                <div id="logs" class="logs">
                    Sistema iniciado...
                </div>
            </div>
        </div>
    </div>

    <script>
        let autoScanInterval = null;
        let currentConfig = {};

        // Funciones de utilidad
        function log(message) {
            const logs = document.getElementById('logs');
            const timestamp = new Date().toLocaleTimeString();
            logs.innerHTML += `[${timestamp}] ${message}\n`;
            logs.scrollTop = logs.scrollHeight;
        }

        function updateStatus(status, message = '') {
            const statusEl = document.getElementById('status');
            statusEl.className = `status ${status}`;
            statusEl.textContent = `Estado: ${message || status}`;
        }

        // Configuración
        async function saveConfig() {
            const config = {
                googleClientId: document.getElementById('googleClientId').value,
                googleClientSecret: document.getElementById('googleClientSecret').value,
                refreshToken: document.getElementById('refreshToken').value,
                clipsFolder: document.getElementById('clipsFolder').value,
                scanInterval: parseInt(document.getElementById('scanInterval').value)
            };

            try {
                const response = await fetch('/api/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config)
                });

                if (response.ok) {
                    log('Configuración guardada exitosamente');
                    currentConfig = config;
                    updateStatus('ready', 'Configuración guardada');
                } else {
                    throw new Error('Error al guardar configuración');
                }
            } catch (error) {
                log('Error: ' + error.message);
                updateStatus('ready', 'Error al guardar configuración');
            }
        }

        async function loadConfig() {
            try {
                const response = await fetch('/api/config');
                const config = await response.json();
                
                document.getElementById('googleClientId').value = config.googleClientId || '';
                document.getElementById('googleClientSecret').value = config.googleClientSecret || '';
                document.getElementById('refreshToken').value = config.refreshToken || '';
                document.getElementById('clipsFolder').value = config.clipsFolder || '';
                document.getElementById('scanInterval').value = config.scanInterval || 5;
                
                currentConfig = config;
                log('Configuración cargada');
                updateStatus('ready', 'Configuración cargada');
            } catch (error) {
                log('Error al cargar configuración: ' + error.message);
            }
        }

        // Escaneo
        async function startScanning() {
            if (!currentConfig.clipsFolder) {
                alert('Por favor configura la carpeta de clips primero');
                return;
            }

            updateStatus('scanning', 'Escaneando clips...');
            log('Iniciando escaneo de clips...');

            try {
                const response = await fetch('/api/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                const result = await response.json();
                
                if (response.ok) {
                    updateClipsList(result.clips || []);
                    log(`Escaneo completado: ${result.clips?.length || 0} clips encontrados`);
                } else {
                    throw new Error(result.error || 'Error en el escaneo');
                }
            } catch (error) {
                log('Error en escaneo: ' + error.message);
            } finally {
                updateStatus('ready');
            }
        }

        function startAutoScan() {
            if (autoScanInterval) {
                log('Auto-escaneo ya está activo');
                return;
            }

            const interval = currentConfig.scanInterval || 5;
            log(`Iniciando auto-escaneo cada ${interval} minutos`);
            
            startScanning(); // Primer escaneo inmediato
            autoScanInterval = setInterval(startScanning, interval * 60 * 1000);
            
            updateStatus('scanning', `Auto-escaneo activo (${interval} min)`);
        }

        function stopAutoScan() {
            if (autoScanInterval) {
                clearInterval(autoScanInterval);
                autoScanInterval = null;
                log('Auto-escaneo detenido');
                updateStatus('ready', 'Auto-escaneo detenido');
            }
        }

        // UI
        function updateClipsList(clips) {
            const clipsList = document.getElementById('clipsList');
            
            if (clips.length === 0) {
                clipsList.innerHTML = '<p style="text-align: center; color: #666;">No se encontraron clips</p>';
                return;
            }

            clipsList.innerHTML = clips.map(clip => `
                <div class="clip-item">
                    <span class="clip-name">${clip.name}</span>
                    <span class="clip-status status-${clip.status || 'pending'}">${clip.status || 'pendiente'}</span>
                </div>
            `).join('');
        }

        function selectFolder() {
            const folder = prompt('Ingresa la ruta completa de la carpeta:');
            if (folder) {
                document.getElementById('clipsFolder').value = folder;
            }
        }

        // Inicialización
        window.onload = function() {
            log('Interfaz web cargada');
            loadConfig();
        };
    </script>
</body>
</html>
`;

// Escribir interfaz HTML
fs.writeFileSync('public/index.html', htmlInterface);

// Rutas API
app.get('/api/status', (req, res) => {
  res.json({ status: appState.status, timestamp: new Date().toISOString() });
});

app.get('/api/config', (req, res) => {
  res.json(appState.config);
});

app.post('/api/config', (req, res) => {
  appState.config = req.body;
  
  // Guardar configuración
  fs.writeFileSync('config.json', JSON.stringify(appState.config, null, 2));
  
  res.json({ success: true, message: 'Configuración guardada' });
});

app.post('/api/scan', (req, res) => {
  if (!appState.config.clipsFolder) {
    return res.status(400).json({ error: 'Carpeta de clips no configurada' });
  }

  appState.status = 'scanning';
  
  // Simular escaneo (en producción usarías el scanner real)
  setTimeout(() => {
    // Buscar archivos de video
    const clips = [];
    try {
      if (fs.existsSync(appState.config.clipsFolder)) {
        const files = fs.readdirSync(appState.config.clipsFolder);
        files.forEach(file => {
          if (/\.(mp4|avi|mov|mkv)$/i.test(file)) {
            clips.push({
              name: file,
              path: path.join(appState.config.clipsFolder, file),
              size: fs.statSync(path.join(appState.config.clipsFolder, file)).size,
              status: 'pending'
            });
          }
        });
      }
    } catch (error) {
      console.error('Error escaneando:', error);
    }
    
    appState.clips = clips;
    appState.status = 'ready';
    
    res.json({ success: true, clips: clips, count: clips.length });
  }, 2000);
});

// Cargar configuración si existe
if (fs.existsSync('config.json')) {
  try {
    appState.config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  } catch (error) {
    console.log('No se pudo cargar configuración previa');
  }
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 CommunityClips Web Server`);
  console.log(`📡 API disponible en: http://localhost:${PORT}/api`);
  console.log(`🌐 Interfaz web en: http://localhost:${PORT}`);
  console.log(`📁 Carpeta pública: ${path.join(__dirname, 'public')}`);
  console.log('');
  console.log('✅ Servidor web iniciado exitosamente!');
  console.log('💡 Abre tu navegador en http://localhost:3000');
});
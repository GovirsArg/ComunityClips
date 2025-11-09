# 🎮 CommunityClips

Una aplicación de escritorio construida con Electron que automatiza la subida de clips de video a YouTube. Perfecta para streamers y creadores de contenido que quieren gestionar sus clips de forma automática.

## ✨ Características

- 🔐 **Autenticación segura** con Google OAuth2
- 📁 **Escaneo automático** de carpetas configuradas
- 📤 **Subida automática** a YouTube con gestión de colas
- 🎮 **Organización por juegos** con playlists automáticas
- 🔍 **Prevención de duplicados** mediante hash SHA-1
- ⏱️ **Verificación de archivos completos** antes de subir
- 📊 **Interfaz intuitiva** con seguimiento de progreso en tiempo real
- 🗑️ **Eliminación opcional** de archivos locales después de subir
- 📝 **Registro detallado** de todas las operaciones
- 🔄 **Reintentos automáticos** en caso de fallo

## 🚀 Instalación y Configuración

### 1. Requisitos Previos

- Node.js (versión 14 o superior)
- npm o yarn
- Cuenta de Google con acceso a YouTube
- Proyecto en Google Cloud Platform

### 2. Configuración de Google Cloud Platform

1. **Crear proyecto en Google Cloud Console:**
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un nuevo proyecto o selecciona uno existente

2. **Habilitar la YouTube Data API v3:**
   - En el panel de navegación, ve a "APIs y servicios" > "Biblioteca"
   - Busca "YouTube Data API v3"
   - Haz clic en "Habilitar"

3. **Crear credenciales OAuth 2.0:**
   - Ve a "APIs y servicios" > "Credenciales"
   - Haz clic en "Crear credenciales" > "ID de cliente de OAuth"
   - Selecciona "Aplicación de escritorio" como tipo de aplicación
   - Descarga el archivo de credenciales o copia el Client ID y Client Secret

### 3. Instalación de la Aplicación

```bash
# Clonar o descargar el proyecto
git clone [URL_DEL_REPOSITORIO]
cd CommunityClips

# Instalar dependencias
npm install

# Copiar el archivo de configuración
cp .env.example .env

# Editar .env con tus credenciales de Google
# GOOGLE_CLIENT_ID=tu_client_id_aqui
# GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
```

### 4. Ejecutar la Aplicación

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm run start
```

## 📖 Uso de la Aplicación

### Primera Ejecución

1. **Autenticación con Google:**
   - Al iniciar la aplicación, haz clic en "Autenticar con Google"
   - Se abrirá una ventana del navegador para autorizar el acceso
   - Acepta los permisos solicitados

2. **Configurar carpetas:**
   - Haz clic en "+ Añadir Carpeta"
   - Selecciona la carpeta donde se guardan tus clips
   - Asigna un nombre de juego (ej: Valorant, CS:GO, Fortnite)
   - Opcionalmente, especifica un ID de playlist existente

3. **Configurar opciones:**
   - Activa/desactiva "Eliminar clip local después de subirlo"
   - Activa/desactiva "Auto-detección y subida automática"
   - Ajusta el intervalo de escaneo (recomendado: 5 minutos)

### Funcionamiento Diario

1. **Escaneo automático:**
   - La aplicación escaneará las carpetas configuradas
   - Detectará nuevos clips y verificará que estén completos
   - Los encolará para subida automática

2. **Monitoreo del progreso:**
   - Observa el progreso de subida en tiempo real
   - Revisa los logs para ver detalles de las operaciones
   - Verifica el estado de cada clip (pendiente, subiendo, subido, error)

3. **Gestión manual:**
   - Usa "Subir Clips Ahora" para forzar una subida inmediata
   - Usa "Detener Escaneo" para pausar el proceso automático
   - Edita o elimina carpetas según necesites

## 🔧 Configuración Avanzada

### Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| GOOGLE_CLIENT_ID | Client ID de Google OAuth2 | - |
| GOOGLE_CLIENT_SECRET | Client Secret de Google OAuth2 | - |
| PLAYER_NAME | Nombre del jugador | JugadorAnonimo |
| SCAN_INTERVAL | Intervalo de escaneo en minutos | 5 |
| DELETE_AFTER_UPLOAD | Eliminar archivos después de subir | false |
| AUTO_UPLOAD | Activar subida automática | true |
| MAX_CONCURRENT_UPLOADS | Máximo de subidas simultáneas | 2 |
| LOG_LEVEL | Nivel de logging (info, warn, error) | info |
| MAX_RETRIES | Máximo de reintentos en caso de error | 3 |
| RETRY_DELAY | Delay entre reintentos en ms | 5000 |

### Archivos de Configuración

La aplicación crea automáticamente los siguientes archivos:

- `config.json` - Configuración de la aplicación
- `uploaded.json` - Registro de archivos subidos
- `token.json` - Token de autenticación de Google
- `logs/` - Archivos de registro rotativos

## 🛠️ Desarrollo

### Estructura del Proyecto

```
CommunityClips/
├── main.js              # Proceso principal de Electron
├── preload.js           # Preload script para seguridad
├── package.json         # Configuración del proyecto
├── .env.example         # Plantilla de variables de entorno
├── uploader/            # Módulos de subida
│   ├── auth.js         # Autenticación OAuth2
│   ├── youtubeUploader.js # Lógica de subida a YouTube
│   ├── scanner.js      # Escaneo de carpetas
│   ├── config.js       # Gestión de configuración
│   └── utils.js        # Utilidades generales
├── renderer/            # Interfaz de usuario
│   ├── index.html      # HTML principal
│   ├── index.js        # Lógica de la UI
│   └── style.css       # Estilos
└── logs/               # Archivos de registro (se crean al ejecutar)
```

### Scripts de Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Empaquetar para distribución
npm run dist
```

### Plataformas Soportadas

- Windows (x64)
- macOS (x64, arm64)
- Linux (x64, arm64)

## 🧪 Pruebas y Casos de Borde

### Casos de Prueba Recomendados

1. **Archivo en escritura:**
   - Copia un clip grande a la carpeta monitoreada
   - Verifica que no se intente subir hasta que esté completo

2. **Pérdida de conexión:**
   - Desconecta el internet durante una subida
   - Verifica que se reintente automáticamente

3. **Token expirado:**
   - Espera a que expire el token (1 hora)
   - Verifica que se refresque automáticamente

4. **Subidas paralelas:**
   - Coloca varios clips grandes en la carpeta
   - Verifica que no se sobrecargue el sistema

5. **Archivos duplicados:**
   - Intenta subir el mismo clip dos veces
   - Verifica que se detecte como duplicado

## 🐛 Solución de Problemas

### Problemas Comunes

**Error de autenticación:**
- Verifica que las credenciales de Google estén correctas
- Asegúrate de que la YouTube Data API esté habilitada
- Revisa que el redirect URI esté configurado correctamente

**Clips no se suben:**
- Verifica que el archivo esté completo (no esté siendo grabado)
- Revisa los logs para ver errores específicos
- Asegúrate de tener suficiente espacio en YouTube

**Problemas de rendimiento:**
- Reduce el número de subidas simultáneas
- Aumenta el intervalo de escaneo
- Verifica que no haya demasiados archivos en las carpetas

**Errores de red:**
- Verifica la conexión a internet
- Revisa el firewall/antivirus
- Intenta aumentar el tiempo de espera

### Logs y Debugging

Los logs se guardan en la carpeta `logs/` con rotación automática. Para debugging:

1. Activa el nivel de log más detallado: `LOG_LEVEL=debug`
2. Revisa el archivo `logs/communityclips.log`
3. Exporta los logs desde la interfaz de la aplicación

## 🔒 Seguridad

### Mejores Prácticas

- **Nunca compartas** tu archivo `.env` o credenciales de Google
- **Actualiza regularmente** las dependencias del proyecto
- **Revisa los permisos** de las carpetas monitoreadas
- **Usa cuentas de prueba** durante el desarrollo
- **Implementa backups** regulares de tus configuraciones

### Consideraciones de Privacidad

- La aplicación solo accede a YouTube con tus permisos explícitos
- Los tokens de autenticación se almacenan localmente de forma segura
- No se envían datos a servidores externos sin tu consentimiento
- Puedes revocar el acceso en cualquier momento desde tu cuenta de Google

## 📋 API de YouTube y Límites

### Quota y Límites

- **Subidas:** ~6 videos por día (límite no oficial)
- **Requests API:** 10,000 unidades por día
- **Playlist management:** 200 videos por playlist

### Optimización de Uso

- La aplicación implementa verificación de quota disponible
- Usa reintentos con backoff exponencial
- Implementa caché local para reducir requests
- Agrupa operaciones cuando sea posible

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Contribución

- Mantén el código limpio y bien documentado
- Sigue las convenciones de estilo existentes
- Añade tests para nuevas funcionalidades
- Actualiza la documentación cuando sea necesario

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- [Electron](https://electronjs.org/) por el framework de escritorio
- [Google APIs](https://developers.google.com/apis-explorer) por la integración con YouTube
- [Node.js](https://nodejs.org/) por el runtime de JavaScript
- La comunidad de código abierto por las herramientas y librerías utilizadas

## 📞 Soporte

Si encuentras problemas o tienes preguntas:

1. Revisa primero esta documentación y los logs
2. Busca issues similares en el repositorio
3. Crea un nuevo issue con detalles del problema
4. Incluye logs relevantes y pasos para reproducir

---

**⚡ Hecho con ❤️ para la comunidad de creadores de contenido**
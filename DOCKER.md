# 🐳 CommunityClips con Docker

Esta guía te ayudará a ejecutar CommunityClips en contenedores Docker con diferentes opciones.

## 📋 Opciones disponibles

### 🔧 Opción 1: GUI con VNC (Recomendada para usuarios)
Interfaz gráfica completa accesible mediante VNC.

### ⚙️ Opción 2: CLI con API REST (Para desarrolladores)
Versión sin interfaz gráfica con API REST para integraciones.

### 🌐 Opción 3: Interfaz Web (Adicional)
Interfaz web simple basada en nginx.

## 🚀 Instalación rápida

### 1. Clonar y construir
```bash
# Construir todas las imágenes
./docker-scripts.sh build-all

# O construir individualmente
./docker-scripts.sh build-gui   # Solo GUI
./docker-scripts.sh build-cli   # Solo CLI
```

### 2. Iniciar servicios
```bash
# Iniciar todos los servicios
./docker-scripts.sh up-all

# O iniciar individualmente
./docker-scripts.sh up-gui      # Solo GUI
./docker-scripts.sh up-cli      # Solo CLI
```

### 3. Acceder a los servicios
- **GUI (VNC):** `localhost:5900`
- **API REST:** `http://localhost:3000`
- **Web Interface:** `http://localhost:8080`

## 📖 Uso detallado

### GUI con VNC
```bash
# Iniciar
./docker-scripts.sh up-gui

# Conectar con VNC (automático)
./docker-scripts.sh vnc

# O manualmente con tu cliente VNC favorito
# Servidor: localhost:5900
# Contraseña: communityclips123
```

### CLI con API REST
```bash
# Iniciar
./docker-scripts.sh up-cli

# Verificar estado
curl http://localhost:3000/api/status

# Obtener configuración
curl http://localhost:3000/api/config

# Ejecutar escaneo
curl -X POST http://localhost:3000/api/scan
```

## 📁 Volúmenes y persistencia

Los siguientes datos se persisten en volúmenes Docker:

- `./data/` - Datos de la aplicación
- `./config/` - Archivos de configuración
- `./uploads/` - Archivos subidos temporalmente
- `./logs/` - Registros de la aplicación

## 🔧 Comandos útiles

```bash
# Ver logs
./docker-scripts.sh logs [servicio]

# Ver estado de contenedores
./docker-scripts.sh status

# Detener todos los servicios
./docker-scripts.sh down

# Limpiar todo (⚠️ elimina datos)
./docker-scripts.sh clean

# Ayuda
./docker-scripts.sh help
```

## 🛠️ Construcción manual

Si prefieres usar docker-compose directamente:

```bash
# Construir y ejecutar GUI
docker-compose up -d communityclips-gui

# Construir y ejecutar CLI
docker-compose up -d communityclips-cli

# Ejecutar todo
docker-compose up -d
```

## 🔧 Personalización

### Variables de entorno
Puedes personalizar los contenedores con variables de entorno:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - VNC_PASSWORD=tu_contraseña
```

### Redes personalizadas
```yaml
networks:
  custom-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

## 🔒 Seguridad

### En producción
- Cambia las contraseñas por defecto
- Usa HTTPS con certificados SSL
- Implementa autenticación para la API
- Restringe acceso a puertos VNC

### Ejemplo con autenticación
```bash
# Generar contraseña segura para VNC
VNC_PASS=$(openssl rand -base64 12)
echo "VNC_PASSWORD=$VNC_PASS" >> .env
```

## 🐛 Solución de problemas

### Error: "Cannot connect to X display"
- Asegúrate de que Xvfb esté ejecutándose
- Verifica que el puerto 5900 no esté en uso

### Error: "Port already in use"
```bash
# Ver qué proceso usa el puerto
sudo lsof -i :5900
# O cambia el puerto en docker-compose.yml
```

### Contenedor no responde
```bash
# Ver logs
./docker-scripts.sh logs communityclips-gui

# Reiniciar
./docker-scripts.sh down
./docker-scripts.sh up-gui
```

## 📊 Monitoreo

### Ver recursos
```bash
# Uso de CPU y memoria
docker stats

# Logs en tiempo real
./docker-scripts.sh logs -f communityclips-gui
```

### Health checks
Los contenedores incluyen health checks automáticos:
- GUI: Verifica puerto VNC
- CLI: Verifica endpoint API

## 🔄 Actualizaciones

```bash
# Detener servicios
./docker-scripts.sh down

# Reconstruir con cambios
./docker-scripts.sh build-all

# Iniciar de nuevo
./docker-scripts.sh up-all
```

## 📚 Referencias

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Electron Docker](https://github.com/electron/electron-docker)
- [VNC Client Options](https://www.realvnc.com/en/connect/download/viewer/)

## ❓ ¿Necesitas ayuda?

Si tienes problemas:
1. Verifica los logs: `./docker-scripts.sh logs`
2. Asegúrate de tener Docker y Docker Compose instalados
3. Comprueba que los puertos no estén en uso
4. Revisa que tengas suficiente memoria RAM disponible
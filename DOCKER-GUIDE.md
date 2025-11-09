# 🐳 Guía de Dockerización para CommunityClips

## 📋 **Resumen rápido de opciones**

| Opción | Requisitos | Uso recomendado | Recursos |
|--------|------------|------------------|----------|
| **GUI + VNC** | Docker Desktop | Usuarios principiantes | ~500MB RAM |
| **CLI + API** | Docker Engine | Desarrolladores/Servidores | ~200MB RAM |
| **Podman** | Podman | Alternativa ligera | ~200MB RAM |
| **WSL2** | Windows + WSL2 | Desarrollo local | Variable |

---

## 🚀 **Opción 1: Docker Desktop (Recomendada para usuarios)**

### Paso 1: Instalar Docker Desktop
```powershell
# Ejecutar instalador
.\install-docker.bat

# O descargar manualmente:
# https://www.docker.com/products/docker-desktop
```

### Paso 2: Verificar instalación
```powershell
# Verificar Docker
docker --version
docker compose version
```

### Paso 3: Ejecutar CommunityClips
```powershell
# Construir imágenes
.\docker-scripts.bat build-all

# Iniciar servicios
.\docker-scripts.bat up-all

# Acceder:
# - GUI: localhost:5900 (VNC)
# - API: localhost:3000
# - Web: localhost:8080
```

---

## ⚙️ **Opción 2: Docker Engine (Ligera)**

### Paso 1: Instalar Docker Engine (sin GUI)
```powershell
# Abrir PowerShell como Administrador

# Instalar Chocolatey (si no lo tienes)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar Docker Engine
choco install docker-engine -y

# Instalar Docker Compose
choco install docker-compose -y
```

### Paso 2: Configurar sin GUI
```powershell
# Solo CLI/API (más ligero)
.\docker-scripts.bat build-cli
.\docker-scripts.bat up-cli
```

---

## 🌟 **Opción 3: Podman (Alternativa ligera)**

### Paso 1: Instalar Podman
```powershell
# Con Chocolatey
choco install podman -y

# O descargar manualmente:
# https://podman.io/getting-started/installation
```

### Paso 2: Usar con Podman
```powershell
# Podman es compatible con Docker CLI
podman-compose up -d

# O crear contenedor manualmente
podman run -d -p 3000:3000 --name clips-cli communityclips:cli
```

---

## 🎯 **Opción 4: Ejecución directa sin Docker**

Si Docker no es opción, puedo crear una versión portable:

### Opción 4A: Versión portable con Node.js
```powershell
# Crear versión portable
npm install -g pkg
pkg package.json --target node18-win-x64 --output CommunityClips-Portable.exe

# Ejecutar sin instalación
.\CommunityClips-Portable.exe
```

### Opción 4B: Versión web con servidor
```powershell
# Servidor web simple
npm install -g http-server
http-server . -p 8080 -o
```

---

## 📊 **Comparación de recursos**

| Método | RAM mínima | Disco | CPU | Tiempo arranque |
|--------|------------|--------|-----|------------------|
| Docker Desktop | 2GB | 3GB | Alto | 30s |
| Docker Engine | 512MB | 1GB | Medio | 10s |
| Podman | 256MB | 500MB | Bajo | 5s |
| Node.js directo | 128MB | 200MB | Mínimo | 2s |

---

## 🔧 **Solución de problemas**

### Error: "Docker no está en el PATH"
```powershell
# Agregar Docker al PATH
$env:PATH += ";C:\Program Files\Docker\Docker\resources\bin"

# Verificar
Get-Command docker -ErrorAction SilentlyContinue
```

### Error: "WSL2 no está instalado"
```powershell
# Instalar WSL2
wsl --install

# Reiniciar
Restart-Computer
```

### Error: "Puerto ya en uso"
```powershell
# Ver puertos en uso
netstat -ano | findstr :5900
netstat -ano | findstr :3000

# Cambiar puertos en docker-compose.yml
```

---

## 🎯 **¿Qué opción elegir?**

### **Para principiantes:**
1. **Docker Desktop** → Interfaz gráfica completa
2. **Ejecutar directamente** → Sin complicaciones

### **Para desarrolladores:**
1. **Docker Engine** → Más control
2. **Podman** → Más ligero
3. **WSL2** → Integración total

### **Para servidores:**
1. **Docker Engine** → Producción
2. **CLI/API** → Sin interfaz gráfica

---

## 🚀 **Empecemos con la más simple**

### **Opción más fácil: Ejecutar directamente**
```powershell
# Ya lo tenemos funcionando!
npm run start
```

### **Segunda opción: Docker Engine**
```powershell
# Instalar Docker Engine ligero
.\install-docker.bat

# Solo CLI (sin GUI)
.\docker-scripts.bat build-cli
.\docker-scripts.bat up-cli
```

---

## ❓ **¿Qué prefieres probar?**

**A)** Seguir con Node.js directo (más fácil)
**B)** Docker Desktop (interfaz completa)  
**C)** Docker Engine (más ligero)
**D)** Podman (alternativa)
**E)** Versión portable (sin instalaciones)

**¿Cuál te interesa más?** ¡Te ayudo a implementarla paso a paso!
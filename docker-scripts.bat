@echo off
REM CommunityClips Docker Scripts para Windows
REM Script de ayuda para gestionar los contenedores Docker

setlocal enabledelayedexpansion

echo ======================================
echo CommunityClips Docker Manager
echo ======================================
echo.

REM Verificar si Docker está instalado
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker no está instalado.
    echo Por favor instala Docker Desktop desde: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Verificar si Docker Compose está disponible
docker compose version >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker Compose no está disponible.
    echo Por favor actualiza Docker Desktop.
    pause
    exit /b 1
)

REM Función de ayuda
:show_help
echo Comandos disponibles:
echo   build-gui    - Construir imagen GUI (con VNC)
echo   build-cli    - Construir imagen CLI (API REST)
echo   build-all    - Construir todas las imágenes
echo   up-gui       - Iniciar servicio GUI
echo   up-cli       - Iniciar servicio CLI
echo   up-all       - Iniciar todos los servicios
echo   down         - Detener todos los servicios
echo   logs         - Ver logs
echo   status       - Estado de los contenedores
echo   clean        - Limpiar todo (imágenes, volúmenes)
echo   help         - Mostrar esta ayuda
echo.
echo Ejemplos:
echo   docker-scripts.bat build-all
echo   docker-scripts.bat up-gui
echo   docker-scripts.bat logs communityclips-gui
exit /b 0

REM Obtener comando
set "COMMAND=%~1"

if "%COMMAND%"=="" set "COMMAND=help"

REM Ejecutar comando
if "%COMMAND%"=="build-gui" goto :build_gui
if "%COMMAND%"=="build-cli" goto :build_cli
if "%COMMAND%"=="build-all" goto :build_all
if "%COMMAND%"=="up-gui" goto :up_gui
if "%COMMAND%"=="up-cli" goto :up_cli
if "%COMMAND%"=="up-all" goto :up_all
if "%COMMAND%"=="down" goto :down
if "%COMMAND%"=="logs" goto :logs
if "%COMMAND%"=="status" goto :status
if "%COMMAND%"=="clean" goto :clean
if "%COMMAND%"=="help" goto :show_help
echo ❌ Comando no reconocido: %COMMAND%
goto :show_help

:build_gui
echo 📦 Construyendo imagen GUI...
docker build -f Dockerfile.gui -t communityclips:gui .
echo ✅ Imagen GUI construida
exit /b 0

:build_cli
echo 📦 Construyendo imagen CLI...
docker build -f Dockerfile.cli -t communityclips:cli .
echo ✅ Imagen CLI construida
exit /b 0

:build_all
call :build_gui
call :build_cli
exit /b 0

:up_gui
echo 🚀 Iniciando CommunityClips GUI...
docker compose up -d communityclips-gui
echo ✅ Servicio GUI iniciado
echo 📱 Acceso VNC: localhost:5900
exit /b 0

:up_cli
echo 🚀 Iniciando CommunityClips CLI...
docker compose up -d communityclips-cli
echo ✅ Servicio CLI iniciado
echo 🌐 API: http://localhost:3000
exit /b 0

:up_all
echo 🚀 Iniciando todos los servicios...
docker compose up -d
echo ✅ Servicios iniciados:
echo   - GUI (VNC): localhost:5900
echo   - CLI (API): http://localhost:3000
echo   - Web: http://localhost:8080
exit /b 0

:down
echo ⏹️  Deteniendo servicios...
docker compose down
echo ✅ Servicios detenidos
exit /b 0

:logs
if "%~2"=="" (
    docker compose logs -f
) else (
    docker compose logs -f %~2
)
exit /b 0

:status
echo 📊 Estado de los contenedores:
docker compose ps
exit /b 0

:clean
echo ⚠️  Esta acción eliminará todos los datos.
set /p "response=¿Continuar? (S/N): "
if /i "%response%"=="S" (
    echo 🧹 Limpiando todo...
    docker compose down -v --remove-orphans
    docker system prune -f
    docker volume prune -f
    echo ✅ Limpieza completada
) else (
    echo ✅ Operación cancelada
)
exit /b 0
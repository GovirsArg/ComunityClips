@echo off
echo ======================================
echo Instalador de Node.js para CommunityClips
echo ======================================
echo.

:: Verificar si Node.js ya está instalado
where node >nul 2>nul
if %errorlevel% == 0 (
    echo ✅ Node.js ya está instalado
    node --version
    echo.
    echo Verificando npm...
    where npm >nul 2>nul
    if %errorlevel% == 0 (
        echo ✅ npm ya está instalado
        npm --version
        echo.
        echo Instalación completada. Presiona cualquier tecla para salir...
        pause >nul
        exit /b 0
    )
)

echo 📥 Descargando Node.js...
echo.

:: Crear directorio temporal
set "temp_dir=%temp%\nodejs-install"
if not exist "%temp_dir%" mkdir "%temp_dir%"
cd "%temp_dir%"

:: Descargar Node.js (versión LTS)
echo Descargando Node.js LTS...
powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/latest-v18.x/node-v18.20.4-x64.msi' -OutFile 'nodejs.msi'"

if %errorlevel% neq 0 (
    echo ❌ Error al descargar Node.js
    echo Por favor descarga manualmente desde: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo 📦 Instalando Node.js...
echo.

:: Instalar Node.js en modo silencioso
start /wait msiexec /i nodejs.msi /quiet /norestart

if %errorlevel% neq 0 (
    echo ❌ Error durante la instalación
    pause
    exit /b 1
)

echo.
echo ✅ Node.js instalado correctamente
echo.

:: Verificar instalación
echo Verificando instalación...
where node >nul 2>nul
if %errorlevel% == 0 (
    echo ✅ Node.js: 
    node --version
) else (
    echo ❌ Node.js no se instaló correctamente
)

where npm >nul 2>nul
if %errorlevel% == 0 (
    echo ✅ npm: 
    npm --version
) else (
    echo ❌ npm no se instaló correctamente
)

:: Limpiar
echo.
echo 🧹 Limpiando archivos temporales...
del /f /q nodejs.msi >nul 2>nul

:: Volver al directorio original
cd /d "%~dp0"

echo.
echo ======================================
echo 🎉 Instalación completada!
echo ======================================
echo.
echo Ahora puedes ejecutar:
echo   npm install   - Para instalar las dependencias
echo   npm run dev   - Para ejecutar en modo desarrollo
echo.
pause
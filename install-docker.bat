@echo off
echo ======================================
echo Instalador de Docker para CommunityClips
echo ======================================
echo.

REM Verificar si Docker ya está instalado
where docker >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Docker ya está instalado
    docker --version
    echo.
    echo ¿Quieres verificar la instalación de Docker Desktop? (S/N)
    set /p verify_choice=
    if /i "%verify_choice%"=="S" (
        echo Abriendo Docker Desktop...
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe" 2>nul || (
            echo No se encontró Docker Desktop, pero Docker CLI está disponible
        )
    )
    pause
    exit /b 0
)

echo 📦 Docker no está instalado. ¿Quieres instalarlo automáticamente? (S/N)
set /p install_choice=

if /i "%install_choice%"=="S" (
    echo.
    echo 📥 Descargando Docker Desktop...
    echo Esto puede tardar varios minutos...
    
    REM Crear directorio temporal
    set "temp_dir=%TEMP%\docker_install"
    mkdir "%temp_dir%" 2>nul
    
    REM Descargar Docker Desktop
    echo Descargando Docker Desktop installer...
    powershell -Command "Invoke-WebRequest -Uri 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe' -OutFile '%temp_dir%\DockerDesktopInstaller.exe'"
    
    if %errorlevel% neq 0 (
        echo ❌ Error al descargar Docker Desktop
        echo Por favor descárgalo manualmente desde: https://www.docker.com/products/docker-desktop
        pause
        exit /b 1
    )
    
    echo ✅ Docker Desktop descargado
    echo.
    echo 🔧 Instalando Docker Desktop...
    echo ⚠️  La instalación puede tardar 5-10 minutos
    echo ⚠️  Se abrirá el instalador de Docker Desktop
    echo ⚠️  Sigue las instrucciones en pantalla
    echo.
    
    REM Ejecutar instalador
    start /wait "%temp_dir%\DockerDesktopInstaller.exe" --quiet
    
    if %errorlevel% equ 0 (
        echo ✅ Docker Desktop instalado correctamente
        echo.
        echo 🔄 Reiniciando el sistema es recomendable
        echo ¿Quieres reiniciar ahora? (S/N)
        set /p restart_choice=
        
        if /i "%restart_choice%"=="S" (
            echo Reiniciando en 10 segundos...
            timeout /t 10 /nobreak >nul
            shutdown /r /t 0
        ) else (
            echo ✅ Instalación completada
            echo Por favor reinicia tu computadora manualmente para asegurar el correcto funcionamiento
            echo.
            echo Después del reinicio, ejecuta:
            echo   docker-scripts.bat up-gui
            echo.
        )
    ) else (
        echo ❌ Error durante la instalación
        echo Por favor instala Docker Desktop manualmente desde: https://www.docker.com/products/docker-desktop
    )
    
    REM Limpiar
    rmdir /s /q "%temp_dir%" 2>nul
    
) else (
    echo Por favor instala Docker Desktop manualmente desde: https://www.docker.com/products/docker-desktop
    echo Después de la instalación, ejecuta:
    echo   docker-scripts.bat up-gui
)

pause
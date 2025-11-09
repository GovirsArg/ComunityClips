@echo off
echo ======================================
echo CommunityClips - Instalador y Ejecutor
echo ======================================
echo.

:: Verificar si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado en este sistema.
    echo.
    echo ¿Quieres instalar Node.js automáticamente? (S/N)
    set /p install_choice=
    
    if /i "%install_choice%"=="S" (
        echo.
        echo 📥 Ejecutando instalador de Node.js...
        echo.
        
        :: Ejecutar el instalador PowerShell
        powershell -ExecutionPolicy Bypass -File "install-node.ps1"
        
        if %errorlevel% neq 0 (
            echo ❌ Error al instalar Node.js
            echo Por favor instala Node.js manualmente desde: https://nodejs.org/
            pause
            exit /b 1
        )
        
        echo.
        echo ✅ Node.js instalado correctamente
        echo.
        
        :: Actualizar variables de entorno
        call refreshenv >nul 2>nul
        timeout /t 3 /nobreak >nul
        
    ) else (
        echo Por favor instala Node.js manualmente desde: https://nodejs.org/
        pause
        exit /b 1
    )
)

:: Verificar de nuevo si Node.js está disponible
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js aún no está disponible después de la instalación.
    echo Por favor reinicia este terminal y ejecuta este script de nuevo.
    pause
    exit /b 1
)

echo ✅ Node.js detectado:
node --version
npm --version
echo.

:: Verificar si package.json existe
if not exist "package.json" (
    echo ❌ No se encontró package.json en el directorio actual
    pause
    exit /b 1
)

:: Verificar si node_modules existe
if not exist "node_modules" (
    echo 📦 Instalando dependencias del proyecto...
    echo Esto puede tardar unos minutos...
    echo.
    
    npm install
    
    if %errorlevel% neq 0 (
        echo ❌ Error al instalar dependencias
        echo Intentando con limpieza de caché...
        npm cache clean --force
        npm install
        
        if %errorlevel% neq 0 (
            echo ❌ Error persistente al instalar dependencias
            pause
            exit /b 1
        )
    )
    
    echo.
    echo ✅ Dependencias instaladas correctamente
) else (
    echo ✅ Dependencias ya instaladas
)

echo.
echo 🚀 Iniciando CommunityClips...
echo.

:: Verificar si existe .env
if not exist ".env" (
    echo ⚠️  No se encontró archivo .env
    echo Se usará .env.example como referencia
    echo Por favor configura tus credenciales de Google cuando la aplicación inicie
    echo.
)

:: Ejecutar la aplicación
echo Ejecutando: npm run dev
echo Presiona Ctrl+C para detener la aplicación
echo ======================================
echo.

npm run dev

if %errorlevel% neq 0 (
    echo.
    echo ❌ Error al ejecutar la aplicación
    echo Intentando modo producción...
    echo.
    npm start
)

echo.
echo ======================================
echo Aplicación finalizada
pause
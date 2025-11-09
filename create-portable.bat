@echo off
echo ======================================
echo Creando CommunityClips Portable
echo ======================================
echo.

echo 📦 Instalando herramientas de empaquetado...
npm install -g pkg

echo.
echo 📁 Creando directorio portable...
mkdir "CommunityClips-Portable" 2>nul

echo 🔨 Empaquetando aplicación...
pkg package.json --target node18-win-x64 --output "CommunityClips-Portable\CommunityClips.exe"

echo 📋 Copiando archivos necesarios...
copy "package.json" "CommunityClips-Portable\" >nul
copy "preload.js" "CommunityClips-Portable\" >nul
copy "main.js" "CommunityClips-Portable\" >nul
copy ".env.example" "CommunityClips-Portable\.env.example" >nul

REM Copiar carpetas necesarias
xcopy /E /I /Y "renderer" "CommunityClips-Portable\renderer" >nul
xcopy /E /I /Y "uploader" "CommunityClips-Portable\uploader" >nul

echo 🎨 Creando archivo de inicio...
echo @echo off > "CommunityClips-Portable\Iniciar-CommunityClips.bat"
echo echo ====================================== >> "CommunityClips-Portable\Iniciar-CommunityClips.bat"
echo echo Iniciando CommunityClips Portable... >> "CommunityClips-Portable\Iniciar-CommunityClips.bat"
echo echo ====================================== >> "CommunityClips-Portable\Iniciar-CommunityClips.bat"
echo echo. >> "CommunityClips-Portable\Iniciar-CommunityClips.bat"
echo echo ⚠️  IMPORTANTE: >> "CommunityClips-Portable\Iniciar-CommunityClips.bat"
echo echo Para que funcione correctamente, necesitas: >> "CommunityClips-Portable\Iniciar-CommunityClips.bat"
echo echo 1. Configurar tu archivo .env con las credenciales de Google >> "CommunityClips-Portable\Iniciar-CommunityClips.bat"
echo echo 2. Copiar tu archivo .env desde .env.example >> "CommunityClips-Portable\Iniciar-CommunityClips.bat"
echo echo. >> "CommunityClips-Portable\Iniciar-CommunityClips.bat"
echo CommunityClips.exe >> "CommunityClips-Portable\Iniciar-CommunityClips.bat"
echo pause >> "CommunityClips-Portable\Iniciar-CommunityClips.bat"

echo 📚 Creando instrucciones...
echo ====================================== > "CommunityClips-Portable\INSTRUCCIONES.txt"
echo COMMUNITYCLIPS PORTABLE >> "CommunityClips-Portable\INSTRUCCIONES.txt"
echo ====================================== >> "CommunityClips-Portable\INSTRUCCIONES.txt"
echo. >> "CommunityClips-Portable\INSTRUCCIONES.txt"
echo 1. COPIA tu archivo .env (configuración) aquí >> "CommunityClips-Portable\INSTRUCCIONES.txt"
echo 2. EJECUTA: Iniciar-CommunityClips.bat >> "CommunityClips-Portable\INSTRUCCIONES.txt"
echo 3. CONFIGURA las carpetas de clips en la interfaz >> "CommunityClips-Portable\INSTRUCCIONES.txt"
echo. >> "CommunityClips-Portable\INSTRUCCIONES.txt"
echo ====================================== >> "CommunityClips-Portable\INSTRUCCIONES.txt"
echo LISTO! Tu CommunityClips está listo para usar >> "CommunityClips-Portable\INSTRUCCIONES.txt"
echo ====================================== >> "CommunityClips-Portable\INSTRUCCIONES.txt"

echo ✅ Portable creado exitosamente!
echo 📁 Carpeta: CommunityClips-Portable
echo 🚀 Archivo ejecutable: CommunityClips.exe
echo 📋 Instrucciones: INSTRUCCIONES.txt
echo.
echo ¿Quieres abrir la carpeta portable? (S/N)
set /p open_choice=
if /i "%open_choice%"=="S" (
    explorer "CommunityClips-Portable"
)

pause
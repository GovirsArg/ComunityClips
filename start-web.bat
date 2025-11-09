@echo off
echo ======================================
echo Iniciando CommunityClips Web Server
echo ======================================
echo.

echo 📦 Instalando dependencias...
npm install express cors

echo 🚀 Iniciando servidor web...
echo.
echo ======================================
echo 🌐 Abre tu navegador en:
echo    http://localhost:3000
echo.
echo 📡 API disponible en:
echo    http://localhost:3000/api
echo ======================================
echo.

node web-server.js

pause
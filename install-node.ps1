# Instalador de Node.js para CommunityClips
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Instalador de Node.js para CommunityClips" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Función para verificar si Node.js está instalado
function Test-NodeInstalled {
    try {
        $nodeVersion = node --version 2>$null
        $npmVersion = npm --version 2>$null
        
        if ($nodeVersion -and $npmVersion) {
            Write-Host "✅ Node.js ya está instalado" -ForegroundColor Green
            Write-Host "   Node.js: $nodeVersion" -ForegroundColor Gray
            Write-Host "   npm: $npmVersion" -ForegroundColor Gray
            return $true
        }
        return $false
    }
    catch {
        return $false
    }
}

# Verificar si Node.js ya está instalado
if (Test-NodeInstalled) {
    Write-Host ""
    Write-Host "Instalación completada. Presiona Enter para salir..." -ForegroundColor Green
    Read-Host
    exit 0
}

Write-Host "📥 Descargando Node.js LTS..." -ForegroundColor Yellow
Write-Host ""

# Crear directorio temporal
$tempDir = Join-Path $env:TEMP "nodejs-install"
if (!(Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
}

# URL de descarga de Node.js LTS
$nodeUrl = "https://nodejs.org/dist/latest-v18.x/node-v18.20.4-x64.msi"
$installerPath = Join-Path $tempDir "nodejs.msi"

try {
    # Descargar Node.js
    Write-Host "Descargando desde: $nodeUrl" -ForegroundColor Gray
    Invoke-WebRequest -Uri $nodeUrl -OutFile $installerPath -UseBasicParsing
    
    if (!(Test-Path $installerPath)) {
        throw "No se pudo descargar el instalador"
    }
    
    Write-Host "✅ Descarga completada" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 Instalando Node.js..." -ForegroundColor Yellow
    Write-Host ""
    
    # Instalar Node.js en modo silencioso
    $installProcess = Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$installerPath`" /quiet /norestart" -Wait -PassThru
    
    if ($installProcess.ExitCode -ne 0) {
        throw "Error durante la instalación (código: $($installProcess.ExitCode))"
    }
    
    Write-Host "✅ Instalación completada" -ForegroundColor Green
    Write-Host ""
    
    # Actualizar PATH del entorno actual
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    
    # Verificar instalación
    Write-Host "Verificando instalación..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3  # Esperar a que el PATH se actualice
    
    if (Test-NodeInstalled) {
        Write-Host ""
        Write-Host "🧹 Limpiando archivos temporales..." -ForegroundColor Gray
        Remove-Item -Path $installerPath -Force -ErrorAction SilentlyContinue
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        
        Write-Host ""
        Write-Host "======================================" -ForegroundColor Cyan
        Write-Host "🎉 ¡Instalación completada con éxito!" -ForegroundColor Green
        Write-Host "======================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Ahora puedes ejecutar:" -ForegroundColor White
        Write-Host "  npm install   - Para instalar las dependencias" -ForegroundColor Cyan
        Write-Host "  npm run dev   - Para ejecutar en modo desarrollo" -ForegroundColor Cyan
        Write-Host ""
    } else {
        throw "Node.js no se instaló correctamente"
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Soluciones alternativas:" -ForegroundColor Yellow
    Write-Host "1. Descarga manualmente Node.js desde: https://nodejs.org/" -ForegroundColor White
    Write-Host "2. Instala el archivo .msi descargado" -ForegroundColor White
    Write-Host "3. Reinicia este terminal y ejecuta el instalador de nuevo" -ForegroundColor White
    Write-Host ""
}

Write-Host "Presiona Enter para salir..." -ForegroundColor Green
Read-Host
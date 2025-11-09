#!/bin/bash

# CommunityClips Docker Scripts
# Script de ayuda para gestionar los contenedores Docker

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[ADVERTENCIA]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función de ayuda
show_help() {
    echo -e "${BLUE}CommunityClips Docker Manager${NC}"
    echo ""
    echo "Uso: $0 [COMANDO] [OPCIONES]"
    echo ""
    echo "Comandos disponibles:"
    echo "  build-gui    - Construir imagen GUI (con VNC)"
    echo "  build-cli    - Construir imagen CLI (API REST)"
    echo "  build-all    - Construir todas las imágenes"
    echo "  up-gui       - Iniciar servicio GUI"
    echo "  up-cli       - Iniciar servicio CLI"
    echo "  up-all       - Iniciar todos los servicios"
    echo "  down         - Detener todos los servicios"
    echo "  logs         - Ver logs (opción: servicio)"
    echo "  status       - Estado de los contenedores"
    echo "  clean        - Limpiar todo (imágenes, volúmenes)"
    echo "  vnc          - Conectar a VNC (GUI)"
    echo "  help         - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 build-all"
    echo "  $0 up-gui"
    echo "  $0 logs communityclips-gui"
    echo "  $0 vnc"
}

# Construir imágenes
build_gui() {
    log "Construyendo imagen GUI..."
    docker build -f Dockerfile.gui -t communityclips:gui .
}

build_cli() {
    log "Construyendo imagen CLI..."
    docker build -f Dockerfile.cli -t communityclips:cli .
}

build_all() {
    build_gui
    build_cli
}

# Iniciar servicios
up_gui() {
    log "Iniciando CommunityClips GUI..."
    docker-compose up -d communityclips-gui
    log "Servicio GUI iniciado. Acceso VNC: localhost:5900"
}

up_cli() {
    log "Iniciando CommunityClips CLI..."
    docker-compose up -d communityclips-cli
    log "Servicio CLI iniciado. API: http://localhost:3000"
}

up_all() {
    log "Iniciando todos los servicios..."
    docker-compose up -d
    log "Servicios iniciados:"
    log "  - GUI (VNC): localhost:5900"
    log "  - CLI (API): http://localhost:3000"
    log "  - Web: http://localhost:8080"
}

# Detener servicios
down() {
    log "Deteniendo servicios..."
    docker-compose down
}

# Ver logs
logs() {
    if [ -n "$2" ]; then
        docker-compose logs -f "$2"
    else
        docker-compose logs -f
    fi
}

# Estado
status() {
    log "Estado de los contenedores:"
    docker-compose ps
}

# Limpiar
clean() {
    warn "Esta acción eliminará todos los datos. ¿Continuar? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        log "Limpiando todo..."
        docker-compose down -v --remove-orphans
        docker system prune -f
        docker volume prune -f
        log "Limpieza completada"
    else
        log "Operación cancelada"
    fi
}

# Conectar VNC
vnc() {
    log "Conectando a VNC..."
    if command -v vncviewer &> /dev/null; then
        vncviewer localhost:5900
    elif command -v remmina &> /dev/null; then
        remmina -c vnc://localhost:5900
    else
        log "Abre tu cliente VNC favorito y conecta a: localhost:5900"
        log "Contraseña VNC: communityclips123"
    fi
}

# Main script
case "${1:-help}" in
    build-gui)
        build_gui
        ;;
    build-cli)
        build_cli
        ;;
    build-all)
        build_all
        ;;
    up-gui)
        up_gui
        ;;
    up-cli)
        up_cli
        ;;
    up-all)
        up_all
        ;;
    down)
        down
        ;;
    logs)
        logs "$@"
        ;;
    status)
        status
        ;;
    clean)
        clean
        ;;
    vnc)
        vnc
        ;;
    help|*)
        show_help
        ;;
esac
#!/usr/bin/env bash
# Empacota, instala e abre o menu na televisão.
# Uso (a partir de qualquer pasta):  scripts/deploy.sh [nome-do-dispositivo]   (por omissão: tv)
set -euo pipefail

DEVICE="${1:-tv}"
APPID="com.lgdetox.menu"

# Trabalha sempre a partir da raiz do projeto
cd "$(dirname "$0")/.."

mkdir -p dist
rm -f dist/*.ipk

echo "=== A empacotar ==="
ares-package app -o dist

echo "=== A instalar em $DEVICE ==="
ares-install --device "$DEVICE" dist/*.ipk

echo "=== A abrir ==="
ares-launch --device "$DEVICE" "$APPID"

echo "Pronto!"

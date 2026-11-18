#!/usr/bin/env bash
# Abre as DevTools (Chrome/Chromium) ligadas ao menu que está a correr na televisão.
# Uso:  scripts/debug.sh [nome-do-dispositivo]   (por omissão: tv)
set -euo pipefail

ares-inspect --device "${1:-tv}" --app com.lgdetox.menu --open

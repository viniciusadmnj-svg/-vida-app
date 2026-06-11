#!/bin/bash
# Inicia o app Vida
pkill -f "node server.js" 2>/dev/null
cd "$(dirname "$0")/backend"
node server.js &
echo "✦ Vida rodando em http://localhost:3001"
echo "  Rede local:  http://$(ipconfig getifaddr en0):3001"
echo "  Tailscale:   http://100.83.102.39:3001"

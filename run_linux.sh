#!/usr/bin/env bash

# NEXUS-C2 // Linux Platform Launcher
# Smart India Hackathon 2026 - Problem Statement SIH26248
# Networked Environment for eXploration, Uncertainty & Simulation

set -e

# Terminal colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

clear
echo -e "${CYAN}===============================================================================${NC}"
echo -e "${CYAN}  _   _ _____ __  _   _ ____        ____ ____  ${NC}"
echo -e "${CYAN} | \ | | ____|\ \/ /| | | / ___|      / ___|___ \ ${NC}"
echo -e "${CYAN} |  \| |  _|   \  / | | | \___ \ ____| |     __) |${NC}"
echo -e "${CYAN} | |\  | |___  /  \ | |_| |___) |____| |___ / __/ ${NC}"
echo -e "${CYAN} |_| \_|_____|/_/\_\ \___/|____/      \____|_____|${NC}"
echo ""
echo -e "${GREEN}  NEXUS-C2: DECIDE UNDER UNCERTAINTY${NC}"
echo -e "  SIH26248: Immersive Multi-Domain Decision-Making Trainer"
echo -e "  NEXUS: Networked Environment for eXploration, Uncertainty & Simulation"
echo -e "${CYAN}===============================================================================${NC}"
echo ""

# 1. Verify Node.js Environment
echo -e "[*] Checking Node.js environment..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}[!] ERROR: Node.js is not installed or not in PATH.${NC}"
    echo -e "[*] Please install Node.js v18 or newer (e.g., via nvm or package manager)."
    exit 1
fi

NODE_VER=$(node -v)
echo -e "${GREEN}[*] Node.js detected: ${NODE_VER}${NC}"

# 2. Verify Dependencies
echo ""
echo -e "[*] Verifying project dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "[*] node_modules missing. Installing packages via npm install..."
    npm install
    echo -e "${GREEN}[*] Dependencies installed successfully.${NC}"
else
    echo -e "${GREEN}[*] Dependencies verified.${NC}"
fi

# 3. Clean background process shutdown on exit
trap 'echo -e "\n[*] Shutting down NEXUS-C2 server..."; kill $(jobs -p) 2>/dev/null || true; exit' INT TERM EXIT

# 4. Launch Local Simulator Server
echo ""
echo -e "[*] Starting NEXUS-C2 server on http://localhost:3000..."
npm run dev &
SERVER_PID=$!

# 5. Wait for server to become responsive
echo -e "[*] Waiting for server to initialize..."
for i in {1..30}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        echo -e "${GREEN}[*] NEXUS-C2 server is active and responding.${NC}"
        break
    fi
    sleep 1
done

# 6. Launch Browser in Fullscreen
TARGET_URL="http://localhost:3000/console"
echo -e "[*] Launching browser in fullscreen command mode..."

if command -v google-chrome &> /dev/null; then
    google-chrome --start-fullscreen "$TARGET_URL" >/dev/null 2>&1 &
elif command -v chromium-browser &> /dev/null; then
    chromium-browser --start-fullscreen "$TARGET_URL" >/dev/null 2>&1 &
elif command -v chromium &> /dev/null; then
    chromium --start-fullscreen "$TARGET_URL" >/dev/null 2>&1 &
elif command -v firefox &> /dev/null; then
    firefox --kiosk "$TARGET_URL" >/dev/null 2>&1 &
elif command -v xdg-open &> /dev/null; then
    xdg-open "$TARGET_URL" >/dev/null 2>&1 &
else
    echo -e "${YELLOW}[!] No standard browser found automatically. Please open: $TARGET_URL${NC}"
fi

echo ""
echo -e "${CYAN}===============================================================================${NC}"
echo -e "${GREEN}  NEXUS-C2 IS LIVE!${NC}"
echo -e "  Console URL:     http://localhost:3000/console"
echo -e "  Team LAN Station:http://localhost:3000/team"
echo -e "  LAN Drill:       Teammates on same Wi-Fi connect to http://<YOUR-LAN-IP>:3000/team"
echo -e "  Press Ctrl+C to terminate the simulator server."
echo -e "${CYAN}===============================================================================${NC}"
echo ""

wait $SERVER_PID

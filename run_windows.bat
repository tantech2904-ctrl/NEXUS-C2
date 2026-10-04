@echo off
setlocal enabledelayedexpansion
title NEXUS-C2 // Networked Environment for eXploration, Uncertainty & Simulation
color 0B
cls

echo ===============================================================================
echo   _   _ _____  __  _   _ ____        ____ ____  
echo  ^| \ ^| ^| ____^|\ \/ /^| ^| ^| / ___^|      / ___^|___ \ 
echo  ^|  \^| ^|  _^]   \  / ^| ^| ^| \___ \ ____^| ^|     __) ^|
echo  ^| ^|\  ^| ^|___  /  \ ^| ^|_^| ^|___) ^|____^| ^|___ / __/ 
echo  ^|_^| \_^|_____^|/_/\_\ \___/^|____/      \____^|_____^|
echo.
echo   NEXUS-C2: DECIDE UNDER UNCERTAINTY
echo   SIH26248: Immersive Multi-Domain Decision-Making Trainer for Degraded Environments
echo.
echo   NEXUS: Networked Environment for eXploration, Uncertainty ^& Simulation
echo   C2:    Command ^& Control Platform
echo ===============================================================================
echo.

:: 1. Verify Node.js Environment
echo [*] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] ERROR: Node.js is not found in system PATH.
    echo [*] Please install Node.js v18 or newer from https://nodejs.org
    echo [*] After installation, re-run this launcher.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [*] Node.js detected: !NODE_VER!

:: 2. Verify and Install Dependencies
echo.
echo [*] Checking local dependencies...
if not exist "node_modules\" (
    echo [*] Dependencies missing. Installing packages via npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [!] ERROR: Failed to install project dependencies.
        echo [*] Please verify internet connectivity or package integrity.
        pause
        exit /b 1
    )
    echo [*] Dependencies installed successfully.
) else (
    echo [*] Dependencies verified.
)

:: 3. Launch Local Simulator Server
echo.
echo [*] Launching NEXUS-C2 local simulator engine on http://localhost:3000 ...
start "NEXUS-C2 Simulator Server" cmd /c "npm run dev"

:: 4. Wait for Server Initialization
echo [*] Waiting for web server to initialize...
timeout /t 5 /nobreak >nul

:: 5. Launch Browser in Immersive Fullscreen Mode
echo [*] Opening NEXUS-C2 in full-screen command center mode...
set LAUNCH_URL=http://localhost:3000/console

where chrome >nul 2>nul
if %errorlevel% equ 0 (
    echo [*] Launching with Google Chrome (Fullscreen)...
    start chrome --start-fullscreen "%LAUNCH_URL%"
) else (
    where msedge >nul 2>nul
    if %errorlevel% equ 0 (
        echo [*] Launching with Microsoft Edge (Fullscreen)...
        start msedge --start-fullscreen "%LAUNCH_URL%"
    ) else (
        echo [*] Launching with default system browser...
        start "%LAUNCH_URL%"
    )
)

echo.
echo ===============================================================================
echo   NEXUS-C2 IS OPERATIONAL!
echo.
echo   Command Console:   http://localhost:3000/console
echo   Scenario Library:  http://localhost:3000/scenarios
echo   Instructor Room:   http://localhost:3000/instructor
echo   Data Provenance:   http://localhost:3000/data-sources
echo.
echo   * The interactive 3-Minute Site Tour will open automatically for evaluators.
echo   * Press F11 anytime to toggle fullscreen display.
echo   * To shut down: Close the 'NEXUS-C2 Simulator Server' command window.
echo ===============================================================================
echo.
pause

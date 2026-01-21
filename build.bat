@echo off
setlocal
echo ========================================
echo JSGeometry Production Build Script
echo ========================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. 
    echo Please install it from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Installing NPM dependencies...
echo This may take a minute depending on your connection...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Dependency installation failed.
    pause
    exit /b 1
)

echo.
echo [2/3] Building application bundle for offline use...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b 1
)

echo.
echo [3/3] Build successful!
echo ----------------------------------------
echo Your production-ready files are in the 'dist' folder.
echo You can host this folder on any web server.
echo The app will work offline once loaded for the first time.
echo ----------------------------------------
echo.
pause
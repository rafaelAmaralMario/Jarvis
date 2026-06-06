@echo off
chcp 65001 >nul

echo === Building React Frontend ===
cd ui
call npm install >nul 2>&1 && npm run build
if %ERRORLEVEL% neq 0 (
    echo React build failed!
    exit /b %ERRORLEVEL%
)
cd ..

echo === Installing Python Backend ===
cd backend
pip install -e . >nul 2>&1
if %ERRORLEVEL% neq 0 (
    pip install -e .
)
cd ..

echo === Done ===
echo Run: python backend/jarvis/main.py
echo Or dev mode: python backend/jarvis/main.py --dev
